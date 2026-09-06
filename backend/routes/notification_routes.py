from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from database import get_db
import db_models
from auth import get_current_farmer
from services.notification_service import (
    dispatch_bilingual_notification,
    format_test_alert,
    format_climate_warning,
    format_disease_alert,
    format_pest_alert
)
from services.weather_service import fetch_real_weather
from services.risk_engine import calculate_disease_risk_and_advice

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class TestNotificationRequest(BaseModel):
    phone: Optional[str] = None
    channels: Optional[List[str]] = ["SMS", "WHATSAPP"]


class UpdatePhoneRequest(BaseModel):
    phone: str


@router.get("")
@router.get("/")
def get_farmer_notifications(
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Retrieve all notification history for the logged-in farmer."""
    logs = (
        db.query(db_models.NotificationLog)
        .filter(db_models.NotificationLog.farmer_id == current_farmer.id)
        .order_by(db_models.NotificationLog.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "notifications": [
            {
                "id": log.id,
                "field_id": log.field_id,
                "recipient_phone": log.recipient_phone,
                "channel": log.channel,
                "alert_type": log.alert_type,
                "title": log.title,
                "message_en": log.message_en,
                "message_hi": log.message_hi,
                "status": log.status,
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for log in logs
        ],
        "total": len(logs),
        "farmer_phone": current_farmer.phone or "+91 9876543210"
    }


@router.post("/test-send")
def send_test_notification(
    req: TestNotificationRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Dispatch a bilingual test SMS & WhatsApp alert to the farmer's mobile number."""
    if req.phone:
        current_farmer.phone = req.phone
        db.commit()

    phone = current_farmer.phone or req.phone or "+91 9876543210"
    title, msg_en, msg_hi = format_test_alert(current_farmer.name, phone)

    result = dispatch_bilingual_notification(
        db=db,
        farmer=current_farmer,
        field_id=None,
        alert_type="TEST",
        title=title,
        message_en=msg_en,
        message_hi=msg_hi,
        channels=req.channels or ["SMS", "WHATSAPP"],
        force=True
    )

    return result


@router.post("/update-phone")
def update_farmer_phone(
    req: UpdatePhoneRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Update farmer's registered phone number for SMS and WhatsApp notifications."""
    if not req.phone or len(req.phone.strip()) < 8:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    current_farmer.phone = req.phone.strip()
    db.commit()
    return {"status": "success", "message": "Phone number updated successfully", "phone": current_farmer.phone}


@router.post("/check-climate")
async def trigger_climate_risk_alerts(
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """
    Evaluate weather conditions for all registered fields of the farmer.
    If HIGH, CRITICAL, or MODERATE risk is found, automatically dispatches bilingual SMS & WhatsApp alerts.
    """
    fields = db.query(db_models.Field).filter(db_models.Field.farmer_id == current_farmer.id).all()
    alerts_triggered = []

    for f in fields:
        weather_data = await fetch_real_weather(f.latitude, f.longitude)
        if not weather_data:
            continue

        risk_analysis = calculate_disease_risk_and_advice(
            crop_name=f.crop,
            sowing_date=f.sowing_date,
            weather_data=weather_data,
            recent_detections=[]
        )

        overall_risk = risk_analysis.get("overall_risk", "LOW")

        if overall_risk in ["HIGH", "CRITICAL", "MODERATE"]:
            title, msg_en, msg_hi = format_climate_warning(
                farmer_name=current_farmer.name,
                field_name=f.field_name,
                crop=f.crop,
                temp=weather_data.get("temperature", 25),
                humidity=weather_data.get("humidity", 70),
                risk_level=overall_risk,
                reasons_en=risk_analysis.get("reasons_en", []),
                reasons_hi=risk_analysis.get("reasons_hi", [])
            )

            res = dispatch_bilingual_notification(
                db=db,
                farmer=current_farmer,
                field_id=f.id,
                alert_type="CLIMATE",
                title=title,
                message_en=msg_en,
                message_hi=msg_hi,
                channels=["SMS", "WHATSAPP"],
                force=True
            )
            alerts_triggered.append({
                "field_name": f.field_name,
                "crop": f.crop,
                "risk_level": overall_risk,
                "result": res
            })

    return {
        "status": "success",
        "fields_evaluated": len(fields),
        "alerts_triggered": alerts_triggered
    }


class GatewayConfigRequest(BaseModel):
    TWILIO_ACCOUNT_SID: Optional[str] = ""
    TWILIO_AUTH_TOKEN: Optional[str] = ""
    TWILIO_PHONE_NUMBER: Optional[str] = ""
    TWILIO_WHATSAPP_NUMBER: Optional[str] = ""
    FAST2SMS_API_KEY: Optional[str] = ""


@router.get("/gateway-config")
def get_gateway_settings(
    current_farmer: db_models.Farmer = Depends(get_current_farmer)
):
    """Get active gateway configurations."""
    from services.notification_service import get_gateway_config
    cfg = get_gateway_config()
    # Mask secrets for security
    return {
        "TWILIO_ACCOUNT_SID": cfg["TWILIO_ACCOUNT_SID"][:6] + "..." if cfg["TWILIO_ACCOUNT_SID"] else "",
        "TWILIO_PHONE_NUMBER": cfg["TWILIO_PHONE_NUMBER"],
        "TWILIO_WHATSAPP_NUMBER": cfg["TWILIO_WHATSAPP_NUMBER"],
        "FAST2SMS_API_KEY": cfg["FAST2SMS_API_KEY"][:6] + "..." if cfg["FAST2SMS_API_KEY"] else "",
        "is_twilio_configured": bool(cfg["TWILIO_ACCOUNT_SID"] and cfg["TWILIO_AUTH_TOKEN"]),
        "is_fast2sms_configured": bool(cfg["FAST2SMS_API_KEY"]),
    }


@router.post("/gateway-config")
def save_gateway_settings(
    req: GatewayConfigRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer)
):
    """Save live gateway credentials for Twilio and Fast2SMS."""
    from services.notification_service import set_gateway_config
    set_gateway_config(req.dict())
    return {"status": "success", "message": "Gateway credentials updated successfully"}


@router.post("/{notif_id}/send-sms")
def send_single_notification_sms(
    notif_id: int,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Dispatch real cellular SMS for this specific notification."""
    notif = db.query(db_models.NotificationLog).filter(
        db_models.NotificationLog.id == notif_id,
        db_models.NotificationLog.farmer_id == current_farmer.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    from services.notification_service import send_sms_via_provider
    phone = notif.recipient_phone or current_farmer.phone
    combined_text = f"{notif.title}\n{notif.message_en}"
    status_code, provider_id = send_sms_via_provider(phone, combined_text)

    return {
        "status": "success",
        "recipient": phone,
        "provider_id": provider_id,
        "message": f"SMS dispatched to {phone}"
    }


@router.post("/run-auto-sentinel")
async def trigger_manual_sentinel_scan(
    force: bool = False,
    current_farmer: db_models.Farmer = Depends(get_current_farmer)
):
    """Trigger an immediate autonomous climate shock scan across all fields."""
    from services.climate_monitor import evaluate_and_dispatch_farmer_alerts
    result = await evaluate_and_dispatch_farmer_alerts(force=force)
    return result


class SimulateShockRequest(BaseModel):
    shock_type: str = "HEAVY_RAIN"  # HEAVY_RAIN, HEATWAVE, FROST_WARNING, FUNGAL_RISK, STORM_WIND
    field_id: Optional[int] = None
    custom_phone: Optional[str] = None


@router.post("/simulate-shock")
def simulate_climate_shock(
    req: SimulateShockRequest,
    current_farmer: db_models.Farmer = Depends(get_current_farmer),
    db: Session = Depends(get_db)
):
    """Simulate a dummy climate shock (Heavy Rain, Heatwave, Frost, etc.) and dispatch real live alert."""
    from services.climate_monitor import detect_weather_shocks
    from services.notification_service import dispatch_bilingual_notification

    # Find field or fallback to first field
    field = None
    if req.field_id:
        field = db.query(db_models.Field).filter(db_models.Field.id == req.field_id).first()
    if not field:
        field = db.query(db_models.Field).filter(db_models.Field.farmer_id == current_farmer.id).first()

    field_name = field.field_name if field else "Wheat Field - Block A"
    crop = field.crop if field else "Wheat (Kanak)"
    field_id = field.id if field else None

    # Dummy weather scenarios
    scenarios = {
        "HEAVY_RAIN": {"temperature": 22.0, "humidity": 94.0, "precipitation": 18.5, "wind_speed": 16.0, "condition": "Heavy Rain & Thunderstorm"},
        "HEATWAVE": {"temperature": 41.5, "humidity": 28.0, "precipitation": 0.0, "wind_speed": 22.0, "condition": "Severe Heatwave & Dry Winds"},
        "FROST_WARNING": {"temperature": 1.8, "humidity": 88.0, "precipitation": 0.0, "wind_speed": 4.0, "condition": "Dense Fog & Ground Frost"},
        "FUNGAL_RISK": {"temperature": 24.0, "humidity": 92.0, "precipitation": 2.0, "wind_speed": 8.0, "condition": "High Humidity & Cloud Cover"},
        "STORM_WIND": {"temperature": 26.0, "humidity": 65.0, "precipitation": 4.0, "wind_speed": 42.0, "condition": "Severe Squall & Storm Gale"},
    }

    dummy_weather = scenarios.get(req.shock_type, scenarios["HEAVY_RAIN"])
    shocks = detect_weather_shocks(dummy_weather, crop)

    if not shocks:
        raise HTTPException(status_code=400, detail="No shock detected for selected scenario")

    target_shock = shocks[0]
    phone = req.custom_phone or current_farmer.phone or "9981087718"
    current_farmer.phone = phone

    title = target_shock["title_en"]
    msg_en = (
        f"[SIMULATED SHOCK] {target_shock['title_en']}\n"
        f"Dear {current_farmer.name}, in your field '{field_name}' ({crop}):\n"
        f"{target_shock['desc_en']}\n"
        f"📋 Action: {target_shock['action_en']}"
    )
    msg_hi = (
        f"[सिम्युलेटेड टेस्ट] {target_shock['title_hi']}\n"
        f"प्रिय {current_farmer.name}, आपके खेत '{field_name}' ({crop}) के लिए:\n"
        f"{target_shock['desc_hi']}\n"
        f"📋 अनुशंसित उपाय: {target_shock['action_hi']}"
    )

    res = dispatch_bilingual_notification(
        db=db,
        farmer=current_farmer,
        field_id=field_id,
        alert_type=req.shock_type,
        title=title,
        message_en=msg_en,
        message_hi=msg_hi,
        channels=["SMS", "WHATSAPP"],
        force=True
    )

    return {
        "status": "success",
        "simulated_scenario": req.shock_type,
        "dummy_weather": dummy_weather,
        "recipient_phone": phone,
        "dispatch_result": res
    }



