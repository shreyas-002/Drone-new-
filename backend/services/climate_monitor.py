import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from database import SessionLocal
import db_models
from services.weather_service import fetch_real_weather
from services.risk_engine import calculate_disease_risk_and_advice
from services.notification_service import (
    dispatch_bilingual_notification,
    format_climate_warning
)

logger = logging.getLogger("farmhawk.climate_monitor")

# Background task state
_MONITOR_RUNNING = False
_MONITOR_INTERVAL_SECONDS = 900  # Scan every 15 minutes
_ALERT_COOLDOWN_HOURS = 4  # Don't repeat identical alert within 4 hours


def detect_weather_shocks(weather: Dict[str, Any], crop: str) -> List[Dict[str, Any]]:
    """
    Analyzes live weather metrics for acute climate shocks:
    - Heavy Rainfall / Downpour
    - Extreme Heatwave Stress
    - Cold Snap / Ground Frost
    - Prolonged High Humidity (Fungal Spore Explosion)
    - Storm / High Wind Velocity
    """
    shocks = []
    temp = weather.get("temperature", 25.0)
    humidity = weather.get("humidity", 60.0)
    precip = weather.get("precipitation", 0.0)
    wind_speed = weather.get("wind_speed", 10.0)
    condition = str(weather.get("condition", "")).lower()

    # 1. Heavy Rainfall Shock
    if precip >= 5.0 or "heavy rain" in condition or "thunderstorm" in condition or "downpour" in condition:
        shocks.append({
            "type": "HEAVY_RAIN",
            "title_en": "🌧️ Urgent Alert: Heavy Rainfall Detected",
            "title_hi": "🌧️ तत्काल चेतावनी: भारी वर्षा दर्ज",
            "desc_en": f"Heavy rain ({precip} mm/h) detected over your field. Risk of waterlogging and root asphyxiation for {crop}.",
            "desc_hi": f"आपके खेत पर भारी वर्षा ({precip} मिमी) दर्ज की गई है। {crop} की फसल में जलभराव व जड़ सड़न का जोखिम है।",
            "action_en": "Immediately pause all irrigation and open field drainage channels to prevent water stagnation.",
            "action_hi": "तुरंत सभी सिंचाई रोकें और खेत की जल निकासी नालियां खोलें ताकि पानी जमा न हो।"
        })

    # 2. Extreme Heatwave Shock
    if temp >= 38.0:
        shocks.append({
            "type": "HEATWAVE",
            "title_en": "☀️ Critical Alert: Severe Heatwave Shock",
            "title_hi": "☀️ गंभीर चेतावनी: अत्यधिक लू व उच्च तापमान",
            "desc_en": f"Extreme heat ({temp}°C) recorded. High evapotranspiration risk and flower/grain drop for {crop}.",
            "desc_hi": f"खेत में अत्यधिक तापमान ({temp}°C) दर्ज किया गया है। {crop} में नमी की कमी व फूल/दाना गिरने का गंभीर खतरा है।",
            "action_en": "Provide light evening irrigation or apply micro-sprinklers to maintain soil moisture and cool the canopy.",
            "action_hi": "शाम के समय हल्की सिंचाई करें या फव्वारे चलाएं ताकि फसल को ठंडक मिले और नमी बनी रहे।"
        })

    # 3. Frost / Cold Snap Shock
    if temp <= 4.0:
        shocks.append({
            "type": "FROST_WARNING",
            "title_en": "❄️ Frost Alert: Near-Freezing Temperature",
            "title_hi": "❄️ पाला चेतावनी: जमाव बिंदु के करीब तापमान",
            "desc_en": f"Severe cold ({temp}°C) detected. High risk of frost damage and tissue cell freezing in {crop}.",
            "desc_hi": f"कड़ाके की ठंड व कम तापमान ({temp}°C) दर्ज। {crop} की पत्तियों पर पाला जमने और फसल झुलसने का खतरा।",
            "action_en": "Apply light night irrigation or create smoke mulch near boundary bunds to elevate ground temperature.",
            "action_hi": "रात में हल्की सिंचाई करें या मेड़ों पर धुआं करें ताकि खेत का तापमान बढ़ सके और पाले से बचाव हो।"
        })

    # 4. High Humidity & Fungal Explosion Shock
    if humidity >= 85.0 and 15.0 <= temp <= 30.0:
        shocks.append({
            "type": "FUNGAL_RISK",
            "title_en": "🌫️ Microclimate Alert: High Disease Susceptibility",
            "title_hi": "🌫️ सूक्ष्म जलवायु चेतावनी: तीव्र फंगल व रोग प्रकोप",
            "desc_en": f"Extreme humidity ({humidity}%) at {temp}°C creates ideal breeding environment for rust, blight, and mildew in {crop}.",
            "desc_hi": f"अत्यधिक आर्द्रता ({humidity}%) और {temp}°C तापमान के कारण {crop} में रतुआ, झुलसा और फफूंद का खतरा बहुत बढ़ गया है।",
            "action_en": "Inspect lower canopy foliage closely for spots and prepare preventive bio-fungicidal spray.",
            "action_hi": "पौधों की निचली पत्तियों पर धब्बों की जांच करें और निवारक जैविक कवकनाशी का छिड़काव तैयार रखें।"
        })

    # 5. Strong Storm / Wind Shock
    if wind_speed >= 35.0 or "storm" in condition or "squall" in condition:
        shocks.append({
            "type": "STORM_WIND",
            "title_en": "💨 Storm Warning: High Wind Velocity",
            "title_hi": "💨 आंधी-तूफान चेतावनी: तेज हवाएं",
            "desc_en": f"High wind speeds ({wind_speed} km/h) recorded. Severe crop lodging and physical stem damage risk for {crop}.",
            "desc_hi": f"खेत में तेज आंधी/हवा की गति ({wind_speed} किमी/घंटा) दर्ज। {crop} के गिरने (Lodging) का खतरा।",
            "action_en": "Postpone chemical spraying and stake tall plants/vegetables where applicable.",
            "action_hi": "कीटनाशक छिड़काव तुरंत टालें और लंबी फसलों/सब्जियों को सहारा दें।"
        })

    return shocks


async def evaluate_and_dispatch_farmer_alerts(force: bool = False) -> Dict[str, Any]:
    """
    Autonomous engine function that scans all fields, evaluates live weather,
    and automatically dispatches bilingual SMS to farmers whenever climate shocks occur.
    """
    db: Session = SessionLocal()
    dispatched_count = 0
    scanned_fields = 0
    alerts_summary = []

    try:
        farmers = db.query(db_models.Farmer).all()

        for farmer in farmers:
            if not farmer.phone or len(farmer.phone.strip()) < 8:
                continue

            fields = db.query(db_models.Field).filter(db_models.Field.farmer_id == farmer.id).all()

            for f in fields:
                scanned_fields += 1
                try:
                    weather = await fetch_real_weather(f.latitude, f.longitude)
                    if not weather:
                        continue

                    # 1. Check for specific climate shocks (Rain, Frost, Heatwave, Humidity, Storm)
                    shocks = detect_weather_shocks(weather, f.crop or "General Crop")

                    for shock in shocks:
                        # Check cooldown against recent logs in DB
                        recent_log = None
                        if not force:
                            cutoff = datetime.utcnow() - timedelta(hours=_ALERT_COOLDOWN_HOURS)
                            recent_log = (
                                db.query(db_models.NotificationLog)
                                .filter(
                                    db_models.NotificationLog.farmer_id == farmer.id,
                                    db_models.NotificationLog.field_id == f.id,
                                    db_models.NotificationLog.alert_type == shock["type"],
                                    db_models.NotificationLog.created_at >= cutoff
                                )
                                .first()
                            )

                        if recent_log and not force:
                            continue  # Already alerted within cooldown window

                        # Build bilingual message
                        title = shock["title_en"]
                        msg_en = (
                            f"{shock['title_en']}\n"
                            f"Dear {farmer.name}, in your field '{f.field_name}' ({f.crop}):\n"
                            f"{shock['desc_en']}\n"
                            f"📋 Action: {shock['action_en']}"
                        )
                        msg_hi = (
                            f"{shock['title_hi']}\n"
                            f"प्रिय {farmer.name}, आपके खेत '{f.field_name}' ({f.crop}) के लिए:\n"
                            f"{shock['desc_hi']}\n"
                            f"📋 अनुशंसित उपाय: {shock['action_hi']}"
                        )

                        # Dispatch live SMS and WhatsApp
                        dispatch_res = dispatch_bilingual_notification(
                            db=db,
                            farmer=farmer,
                            field_id=f.id,
                            alert_type=shock["type"],
                            title=title,
                            message_en=msg_en,
                            message_hi=msg_hi,
                            channels=["SMS", "WHATSAPP"],
                            force=True
                        )

                        dispatched_count += 1
                        alerts_summary.append({
                            "farmer": farmer.name,
                            "phone": farmer.phone,
                            "field": f.field_name,
                            "crop": f.crop,
                            "shock_type": shock["type"],
                            "status": dispatch_res.get("status", "sent")
                        })
                        logger.info(f"🚨 Auto-Dispatched {shock['type']} alert to {farmer.phone} for field {f.field_name}")

                except Exception as field_err:
                    logger.warning(f"Error evaluating field {f.id}: {field_err}")

    except Exception as e:
        logger.error(f"Error in automated climate monitor cycle: {e}")
    finally:
        db.close()

    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "scanned_fields": scanned_fields,
        "dispatched_count": dispatched_count,
        "alerts_summary": alerts_summary
    }


async def start_autonomous_climate_daemon():
    """
    24/7 Background loop that autonomously monitors weather changes and sends SMS alerts.
    """
    global _MONITOR_RUNNING
    if _MONITOR_RUNNING:
        return

    _MONITOR_RUNNING = True
    logger.info("🟢 FarmHawk Autonomous Climate Sentinel Daemon Started (24/7 Mode)")

    # Initial grace period before first run
    await asyncio.sleep(5)

    while _MONITOR_RUNNING:
        try:
            logger.info("🛰️ Running scheduled autonomous climate scan...")
            res = await evaluate_and_dispatch_farmer_alerts(force=False)
            logger.info(f"🛰️ Autonomous scan complete: {res['dispatched_count']} alerts dispatched.")
        except Exception as err:
            logger.error(f"Climate sentinel loop error: {err}")

        # Sleep until next evaluation interval
        await asyncio.sleep(_MONITOR_INTERVAL_SECONDS)

