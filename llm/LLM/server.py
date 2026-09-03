import io
import os
import csv
import json
import base64
import asyncio
from datetime import datetime
from typing import List, Dict, Any

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uvicorn

# Initialize FastAPI
app = FastAPI(title="FarmHawk AI Edge Inference Server", version="2.0.0")

# Enable CORS for React website (localhost & local network IP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_LOG_PATH = os.path.join(os.path.dirname(__file__), "farmhawk_logs.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Ensure CSV exists
if not os.path.exists(CSV_LOG_PATH) or os.path.getsize(CSV_LOG_PATH) == 0:
    with open(CSV_LOG_PATH, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "Type", "Name", "Latitude", "Longitude", "Confidence"])

print("==================================================")
print("🦅 Loading FarmHawk Dual YOLOv8 Models into memory...")
print("==================================================")

disease_model_path = os.path.join(MODELS_DIR, "disease_model.pt")
insect_model_path = os.path.join(MODELS_DIR, "insect_model.pt")

if not os.path.exists(disease_model_path):
    print(f"⚠️ Warning: {disease_model_path} not found. Fallback to best.pt if exists")
    disease_model_path = os.path.join(os.path.dirname(__file__), "best.pt")

disease_model = YOLO(disease_model_path)
insect_model = YOLO(insect_model_path)

print(f"✅ Disease Model Loaded ({len(disease_model.names)} classes)")
print(f"✅ Insect/Pest Model Loaded ({len(insect_model.names)} classes)")
print("🚀 AI Engine Ready for Real-Time Inference")


def run_yolo_inference(image_np: np.ndarray, lat: float = 26.827, lng: float = 75.565) -> Dict[str, Any]:
    """Run dual YOLO inference on a single image frame (BGR format)."""
    h, w = image_np.shape[:2]
    detections: List[Dict[str, Any]] = []

    # 1. Disease Model
    disease_res = disease_model.predict(source=image_np, conf=0.18, verbose=False)
    for res in disease_res:
        for box in res.boxes:
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            cls_id = int(box.cls[0])
            name = disease_model.names[cls_id]
            conf = float(box.conf[0])

            # Convert to percentages for responsive frontend canvas
            bx = (x1 / w) * 100
            by = (y1 / h) * 100
            bw = ((x2 - x1) / w) * 100
            bh = ((y2 - y1) / h) * 100

            detection_item = {
                "id": f"dis_{int(datetime.now().timestamp() * 1000)}_{cls_id}",
                "type": "DISEASE",
                "name": name,
                "confidence": round(conf, 2),
                "box": {"x": bx, "y": by, "w": bw, "h": bh},
                "raw_coords": [int(x1), int(y1), int(x2), int(y2)],
                "latitude": lat,
                "longitude": lng,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            detections.append(detection_item)

            # Log to CSV
            try:
                with open(CSV_LOG_PATH, mode="a", newline="") as file:
                    writer = csv.writer(file)
                    writer.writerow([
                        detection_item["timestamp"],
                        "DISEASE",
                        name,
                        lat,
                        lng,
                        round(conf, 2),
                    ])
            except Exception as e:
                print("Error writing to CSV:", e)

    # 2. Insect / Pest Model
    insect_res = insect_model.predict(source=image_np, conf=0.18, verbose=False)
    for res in insect_res:
        for box in res.boxes:
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            cls_id = int(box.cls[0])
            name = insect_model.names[cls_id]
            conf = float(box.conf[0])

            bx = (x1 / w) * 100
            by = (y1 / h) * 100
            bw = ((x2 - x1) / w) * 100
            bh = ((y2 - y1) / h) * 100

            detection_item = {
                "id": f"pest_{int(datetime.now().timestamp() * 1000)}_{cls_id}",
                "type": "PEST",
                "name": name,
                "confidence": round(conf, 2),
                "box": {"x": bx, "y": by, "w": bw, "h": bh},
                "raw_coords": [int(x1), int(y1), int(x2), int(y2)],
                "latitude": lat,
                "longitude": lng,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            detections.append(detection_item)

            # Log to CSV
            try:
                with open(CSV_LOG_PATH, mode="a", newline="") as file:
                    writer = csv.writer(file)
                    writer.writerow([
                        detection_item["timestamp"],
                        "PEST",
                        name,
                        lat,
                        lng,
                        round(conf, 2),
                    ])
            except Exception as e:
                print("Error writing to CSV:", e)

    return {
        "status": "success",
        "detections": detections,
        "count": len(detections),
        "frame_width": w,
        "frame_height": h,
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "FarmHawk Dual YOLOv8 AI Server",
        "disease_model": "models/disease_model.pt",
        "insect_model": "models/insect_model.pt",
        "disease_classes": len(disease_model.names),
        "insect_classes": len(insect_model.names),
    }


@app.get("/api/logs")
async def get_logs():
    """Returns parsed detection records from farmhawk_logs.csv"""
    if not os.path.exists(CSV_LOG_PATH):
        return {"logs": []}

    logs = []
    try:
        with open(CSV_LOG_PATH, mode="r", newline="") as file:
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
                    })
                except Exception:
                    continue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"logs": logs, "total": len(logs)}


@app.post("/api/predict")
async def predict_frame(payload: Dict[str, Any]):
    """HTTP POST fallback for single frame prediction."""
    image_data = payload.get("image", "")
    lat = float(payload.get("lat", 26.827))
    lng = float(payload.get("lng", 75.565))

    if not image_data:
        raise HTTPException(status_code=400, detail="No image provided")

    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    image_bytes = base64.b64decode(image_data)
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    result = run_yolo_inference(frame, lat=lat, lng=lng)
    if result["count"] > 0:
        print(f"🎯 [REAL YOLOv8] Detected {result['count']} objects: {[d['name'] for d in result['detections']]}")
    return result


@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time high-throughput WebSocket connection for live camera frames.
    Client sends JSON: { "image": "data:image/jpeg;base64,...", "lat": 26.827, "lng": 75.565 }
    Server replies with real YOLOv8 detections.
    """
    await websocket.accept()
    print("🔌 [WebSocket] Client Connected for Live AI Detection")

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                image_data = data.get("image", "")
                lat = float(data.get("lat", 26.827))
                lng = float(data.get("lng", 75.565))

                if not image_data:
                    await websocket.send_json({"status": "error", "message": "No image sent", "detections": []})
                    continue

                if "," in image_data:
                    image_data = image_data.split(",", 1)[1]

                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_json({"status": "error", "message": "Invalid frame decode", "detections": []})
                    continue

                # Run Real Dual YOLO Inference
                result = run_yolo_inference(frame, lat=lat, lng=lng)
                if result["count"] > 0:
                    print(f"🎯 [REAL YOLOv8] Detected {result['count']} objects: {[d['name'] for d in result['detections']]}")
                await websocket.send_json(result)

            except json.JSONDecodeError:
                await websocket.send_json({"status": "error", "message": "Invalid JSON format"})
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e), "detections": []})

    except WebSocketDisconnect:
        print("🔌 [WebSocket] Client Disconnected")
    except Exception as e:
        print("WebSocket Exception:", e)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
