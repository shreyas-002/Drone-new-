import io
import os
import sys
import csv
import json
import base64
import asyncio

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn

# Imports from local backend modules
from database import engine, Base, get_db, SessionLocal
import db_models
import schemas
from services.live_feed_service import generate_live_feed_stream, analyze_image_frame
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_farmer,
)
from routes import field_routes, notification_routes, community_routes, survey_routes
from services.weather_service import fetch_real_weather
from services.risk_engine import calculate_disease_risk_and_advice

# Create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Auto-migrate new columns for existing tables
def auto_migrate_sqlite():
    import sqlite3
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "farmhawk.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("PRAGMA table_info(farmers)")
            cols = [row[1] for row in c.fetchall()]
            new_farmer_cols = [
                ("role", "TEXT DEFAULT 'farmer'"),
                ("is_verified_expert", "INTEGER DEFAULT 0"),
                ("expert_title", "TEXT"),
                ("reputation", "INTEGER DEFAULT 10"),
                ("location_region", "TEXT DEFAULT 'Ludhiana, Punjab'"),
                ("avatar_url", "TEXT")
            ]
            for col_name, col_type in new_farmer_cols:
                if col_name not in cols:
                    c.execute(f"ALTER TABLE farmers ADD COLUMN {col_name} {col_type}")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Auto-migration note: {e}")

auto_migrate_sqlite()

# Initialize FastAPI App
app = FastAPI(title="FarmHawk Precision Agriculture API Server", version="3.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories & Files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_LOG_PATH = os.path.join(BASE_DIR, "farmhawk_logs.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "community"), exist_ok=True)

# Mount Static Media Uploads
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Mount REST Routes
app.include_router(field_routes.router)
app.include_router(notification_routes.router)
app.include_router(community_routes.router)
app.include_router(survey_routes.router)


# Ensure CSV log file exists
if not os.path.exists(CSV_LOG_PATH) or os.path.getsize(CSV_LOG_PATH) == 0:
    with open(CSV_LOG_PATH, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "Type", "Name", "Latitude", "Longitude", "Confidence", "FieldID"])

print("==================================================")
print("🦅 FarmHawk Precision Agriculture Backend Server")
print("==================================================")
print("🚀 REST API & Agricultural Intelligence Engine Ready")


from services.climate_monitor import start_autonomous_climate_daemon

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_autonomous_climate_daemon())

# --- System Health Endpoint ---
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "FarmHawk Precision Agriculture Backend Server",
        "database": "farmhawk.db (SQLite + SQLAlchemy)",
        "autonomous_climate_sentinel": "active (24/7 shock monitoring)",
    }


# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=schemas.TokenResponse)
def register_farmer(farmer_in: schemas.FarmerRegister, db: Session = Depends(get_db)):
    existing = db.query(db_models.Farmer).filter(db_models.Farmer.email == farmer_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_farmer = db_models.Farmer(
        name=farmer_in.name,
        email=farmer_in.email,
        phone=farmer_in.phone,
        password_hash=hash_password(farmer_in.password)
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)

    token = create_access_token({"sub": new_farmer.email})
    return {"access_token": token, "token_type": "bearer", "farmer": new_farmer}


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login_farmer(login_in: schemas.FarmerLogin, db: Session = Depends(get_db)):
    farmer = db.query(db_models.Farmer).filter(db_models.Farmer.email == login_in.email).first()
    if not farmer or not verify_password(login_in.password, farmer.password_hash):
        # Convenience fallback for demo credentials if password hash check fails
        if login_in.email == "farmer1@farmhawk.com" and login_in.password == "password123":
            if not farmer:
                farmer = db_models.Farmer(
                    name="Anant",
                    email="farmer1@farmhawk.com",
                    phone="+91 98765 43210",
                    password_hash=hash_password("password123")
                )
                db.add(farmer)
                db.commit()
                db.refresh(farmer)
        else:
            raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({"sub": farmer.email})
    return {"access_token": token, "token_type": "bearer", "farmer": farmer}


@app.get("/api/auth/me", response_model=schemas.FarmerResponse)
def get_current_user_profile(farmer: db_models.Farmer = Depends(get_current_farmer)):
    return farmer


# --- Weather API Endpoints ---
@app.get("/api/fields/{field_id}/weather")
async def get_field_current_weather(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this field")

    weather_data = await fetch_real_weather(field.latitude, field.longitude)
    if not weather_data:
        raise HTTPException(status_code=503, detail="Weather data is temporarily unavailable from provider")

    return {
        "status": "success",
        "field_id": field_id,
        "field_name": field.field_name,
        "weather": weather_data
    }


@app.get("/api/fields/{field_id}/forecast")
async def get_field_forecast(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    weather_data = await fetch_real_weather(field.latitude, field.longitude)
    if not weather_data:
        raise HTTPException(status_code=503, detail="Forecast data is temporarily unavailable")

    return {
        "status": "success",
        "field_id": field_id,
        "forecast": weather_data.get("hourly_forecast", {})
    }


# --- Agricultural Intelligence & Risk Endpoints ---
@app.get("/api/fields/{field_id}/disease-risk")
async def get_field_disease_risk(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch real weather for field location
    weather_data = await fetch_real_weather(field.latitude, field.longitude)

    # Fetch recent detections for field
    db_dets = (
        db.query(db_models.Detection)
        .filter(db_models.Detection.field_id == field_id)
        .order_by(db_models.Detection.timestamp.desc())
        .limit(10)
        .all()
    )

    recent_dets = [
        {
            "id": d.id,
            "type": d.detection_type,
            "disease_or_pest_name": d.disease_or_pest_name,
            "confidence": d.confidence,
            "timestamp": d.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for d in db_dets
    ]

    analysis = calculate_disease_risk_and_advice(
        crop_name=field.crop,
        sowing_date=field.sowing_date,
        weather_data=weather_data,
        recent_detections=recent_dets
    )

    return {"status": "success", "field_id": field_id, "analysis": analysis}


@app.get("/api/fields/{field_id}/advice")
async def get_field_advice(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    weather_data = await fetch_real_weather(field.latitude, field.longitude)

    db_dets = (
        db.query(db_models.Detection)
        .filter(db_models.Detection.field_id == field_id)
        .order_by(db_models.Detection.timestamp.desc())
        .limit(10)
        .all()
    )

    recent_dets = [
        {
            "id": d.id,
            "type": d.detection_type,
            "disease_or_pest_name": d.disease_or_pest_name,
            "confidence": d.confidence,
            "timestamp": d.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for d in db_dets
    ]

    analysis = calculate_disease_risk_and_advice(
        crop_name=field.crop,
        sowing_date=field.sowing_date,
        weather_data=weather_data,
        recent_detections=recent_dets
    )

    return {
        "status": "success",
        "field_id": field_id,
        "field_name": field.field_name,
        "crop": field.crop,
        "recommendations": analysis.get("recommendations", []),
        "reasons_en": analysis.get("reasons_en", []),
        "reasons_hi": analysis.get("reasons_hi", [])
    }


# --- Detection & Live Feed Endpoints ---
@app.get("/api/fields/{field_id}/detections")
def get_field_detections(
    field_id: int,
    limit: int = 25,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch max specified detections (default max 25, refreshable)
    detections = (
        db.query(db_models.Detection)
        .filter(db_models.Detection.field_id == field_id)
        .order_by(db_models.Detection.timestamp.desc())
        .limit(min(limit, 50))
        .all()
    )
    return {"detections": detections, "count": len(detections)}


@app.get("/api/fields/{field_id}/live-feed/stream")
def stream_field_live_feed(
    field_id: int,
    camera: int = 0,
    conf: float = 0.35,
    db: Session = Depends(get_db)
):
    """
    Real-time MJPEG live camera stream using trained YOLO/CNN model.
    Draws Blue boxes for Insects, Red boxes for Pests.
    Persists detected threats directly into the database for this field.
    """
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    return StreamingResponse(
        generate_live_feed_stream(
            field_id=field_id,
            camera_idx=camera,
            conf_thresh=conf,
            db_session_factory=SessionLocal
        ),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/api/fields/{field_id}/live-feed/analyze")
async def analyze_field_frame(
    field_id: int,
    file: UploadFile = File(...),
    conf: float = 0.35,
    db: Session = Depends(get_db)
):
    """
    Runs YOLO CNN inference on a captured webcam frame or uploaded image.
    Returns annotated frame (base64) and saves detections.
    """
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    image_bytes = await file.read()
    result = analyze_image_frame(
        image_bytes=image_bytes,
        field_id=field_id,
        conf_thresh=conf,
        db_session=db
    )
    return result


@app.post("/api/fields/{field_id}/live-feed/launch-desktop")
def launch_desktop_feed(
    field_id: int,
    camera: int = 1,
):
    """Launches the native OpenCV desktop live feed script using Apple Silicon MPS acceleration."""
    import subprocess
    script_path = "/Users/harshitkushwaha/.gemini/antigravity/scratch/crop-disease-pest-detector/webcam_feed.py"
    python_bin = "/Users/harshitkushwaha/.gemini/antigravity/scratch/crop-disease-pest-detector/.venv/bin/python3"
    subprocess.Popen([python_bin, script_path, "--camera", str(camera)])
    return {"status": "success", "message": f"Desktop live feed window launched with camera {camera}"}


@app.post("/api/fields/{field_id}/live-feed/test-sample")
def test_dataset_sample(
    field_id: int,
    sample_type: str = "pest",
    conf: float = 0.25,
    db: Session = Depends(get_db),
):
    """Runs the trained YOLO model on an actual test image from combined_dataset/test/images."""
    from pathlib import Path
    test_dir = Path("/Users/harshitkushwaha/.gemini/antigravity/scratch/crop-disease-pest-detector/combined_dataset/test/images")
    if sample_type == "insect":
        img_path = test_dir / "ip102_00011_jpg.rf.38447cdca6e80556526e25cf3db69f31.jpg"
    else:
        img_path = test_dir / "plantdoc_02_-Rust-2017-207u24s_jpg.rf.87b84a77a849228fd3648aeeb0ebd06a.jpg"

    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Sample image not found")

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    return analyze_image_frame(img_bytes, field_id=field_id, conf_thresh=conf, db_session=db)


@app.post("/api/fields/{field_id}/detections")
def add_field_detection(
    field_id: int,
    payload: Dict[str, Any],
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Add a detection to a field and automatically dispatch bilingual SMS & WhatsApp alerts."""
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    det_type = payload.get("detection_type", "DISEASE").upper()
    name = payload.get("disease_or_pest_name", "Unknown Threat")
    conf = float(payload.get("confidence", 0.85))

    new_det = db_models.Detection(
        field_id=field.id,
        detection_type=det_type,
        disease_or_pest_name=name,
        confidence=conf,
        latitude=payload.get("latitude", field.latitude),
        longitude=payload.get("longitude", field.longitude),
        timestamp=datetime.utcnow()
    )
    db.add(new_det)
    db.commit()
    db.refresh(new_det)

    # Dispatch Automated Bilingual Alert
    from services.notification_service import (
        dispatch_bilingual_notification,
        format_disease_alert,
        format_pest_alert
    )

    if det_type == "DISEASE":
        title, msg_en, msg_hi = format_disease_alert(
            farmer_name=current_farmer.name,
            field_name=field.field_name,
            crop=field.crop,
            disease_name=name,
            confidence=conf
        )
    else:
        title, msg_en, msg_hi = format_pest_alert(
            farmer_name=current_farmer.name,
            field_name=field.field_name,
            crop=field.crop,
            pest_name=name,
            confidence=conf
        )

    notif_res = dispatch_bilingual_notification(
        db=db,
        farmer=current_farmer,
        field_id=field.id,
        alert_type=det_type,
        title=title,
        message_en=msg_en,
        message_hi=msg_hi,
        channels=["SMS", "WHATSAPP"],
        force=True
    )

    return {
        "status": "success",
        "detection": {
            "id": new_det.id,
            "detection_type": new_det.detection_type,
            "disease_or_pest_name": new_det.disease_or_pest_name,
            "confidence": new_det.confidence,
        },
        "notification": notif_res
    }


@app.delete("/api/fields/{field_id}/detections")
def clear_field_detections(
    field_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field.farmer_id != current_farmer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.query(db_models.Detection).filter(db_models.Detection.field_id == field_id).delete()
    db.commit()
    return {"status": "success", "message": "Detection history cleared successfully"}


@app.get("/api/logs")
def get_csv_logs():
    """Returns parsed detection records from farmhawk_logs.csv"""
    if not os.path.exists(CSV_LOG_PATH):
        return {"logs": []}

    logs = []
    try:
        with open(CSV_LOG_PATH, mode="r", newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                try:
                    logs.append({
                        "timestamp": row.get("Timestamp", ""),
                        "type": row.get("Type", "DISEASE"),
                        "name": row.get("Name", "Unknown"),
                        "latitude": float(row.get("Latitude", 26.827)),
                        "longitude": float(row.get("Longitude", 75.565)),
                        "confidence": float(row.get("Confidence", 0.5)),
                        "field_id": row.get("FieldID", "")
                    })
                except Exception:
                    continue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"logs": logs, "total": len(logs)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)


