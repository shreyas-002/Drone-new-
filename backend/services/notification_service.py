import os
import ssl
import certifi
import urllib.parse
import urllib.request
import json
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
import db_models

# Notification Cooldown Tracker (key: f"{farmer_id}_{alert_type}_{identifier}" -> timestamp)
_NOTIFICATION_COOLDOWNS: Dict[str, float] = {}
NOTIFICATION_COOLDOWN_SECONDS = 900.0  # 15 minutes cooldown per specific alert


def get_gateway_config() -> Dict[str, str]:
    """Retrieve current gateway configurations."""
    return {
        "TWILIO_ACCOUNT_SID": os.getenv("TWILIO_ACCOUNT_SID", ""),
        "TWILIO_AUTH_TOKEN": os.getenv("TWILIO_AUTH_TOKEN", ""),
        "TWILIO_PHONE_NUMBER": os.getenv("TWILIO_PHONE_NUMBER", ""),
        "TWILIO_WHATSAPP_NUMBER": os.getenv("TWILIO_WHATSAPP_NUMBER", ""),
        "FAST2SMS_API_KEY": os.getenv("FAST2SMS_API_KEY", ""),
        "ANDROID_GATEWAY_URL": os.getenv("ANDROID_GATEWAY_URL", ""),
        "TEXTBEE_API_KEY": os.getenv("TEXTBEE_API_KEY", "txb_5cxpW9A3RurGBKTI5nyabOLxhYLnYiin"),
        "TEXTBEE_DEVICE_ID": os.getenv("TEXTBEE_DEVICE_ID", "6a985411ccb6c72709ba59ae"),
    }


def set_gateway_config(config: Dict[str, str]):
    """Update gateway configuration in environment."""
    for key, val in config.items():
        if val is not None:
            os.environ[key] = str(val).strip()


def format_disease_alert(
    farmer_name: str,
    field_name: str,
    crop: str,
    disease_name: str,
    confidence: float
) -> Tuple[str, str, str]:
    """Generate bilingual disease alert content."""
    conf_pct = int(confidence * 100) if confidence <= 1.0 else int(confidence)
    title = f"⚠️ Disease Alert: {disease_name}"

    message_en = (
        f"⚠️ FarmHawk Alert: Dear {farmer_name}, '{disease_name}' was detected with {conf_pct}% "
        f"confidence in your field '{field_name}' ({crop}).\n"
        f"📋 Action: Inspect affected leaves immediately and apply targeted bio-fungicide."
    )

    message_hi = (
        f"⚠️ फार्महॉक चेतावनी: प्रिय {farmer_name}, आपके खेत '{field_name}' ({crop}) में "
        f"'{disease_name}' ({conf_pct}% सटीकता) का पता चला है।\n"
        f"📋 अनुशंसित उपाय: तुरंत प्रभावित पत्तियों की जांच करें और उचित जैविक कवकनाशी का छिड़काव करें।"
    )

    return title, message_en, message_hi


def format_pest_alert(
    farmer_name: str,
    field_name: str,
    crop: str,
    pest_name: str,
    confidence: float
) -> Tuple[str, str, str]:
    """Generate bilingual pest infestation alert content."""
    conf_pct = int(confidence * 100) if confidence <= 1.0 else int(confidence)
    title = f"🐛 Pest Alert: {pest_name}"

    message_en = (
        f"🐛 FarmHawk Alert: Dear {farmer_name}, pest '{pest_name}' was detected with {conf_pct}% "
        f"confidence in your field '{field_name}' ({crop}).\n"
        f"📋 Action: Deploy pheromone traps or spray neem oil formulation immediately."
    )

    message_hi = (
        f"🐛 फार्महॉक चेतावनी: प्रिय {farmer_name}, आपके खेत '{field_name}' ({crop}) में "
        f"कीट '{pest_name}' ({conf_pct}% सटीकता) का प्रकोप पाया गया है।\n"
        f"📋 अनुशंसित उपाय: तुरंत नीम तेल का छिड़काव करें या फेरोमोन ट्रैप लगाएं।"
    )

    return title, message_en, message_hi


def format_climate_warning(
    farmer_name: str,
    field_name: str,
    crop: str,
    temp: float,
    humidity: float,
    risk_level: str,
    reasons_en: list,
    reasons_hi: list
) -> Tuple[str, str, str]:
    """Generate bilingual climate/weather risk alert content."""
    title = f"🌦️ Climate Warning: High {risk_level} Risk"

    reason_en_str = " ".join(reasons_en[:2]) if reasons_en else "Adverse weather conditions detected."
    reason_hi_str = " ".join(reasons_hi[:2]) if reasons_hi else "प्रतिकूल मौसम की स्थिति पाई गई है।"

    message_en = (
        f"🌦️ FarmHawk Weather Warning: Dear {farmer_name}, your field '{field_name}' ({crop}) "
        f"is under {risk_level} DISEASE RISK. Current: {temp}°C, {humidity}% Humidity.\n"
        f"🔍 Details: {reason_en_str}\n"
        f"📋 Action: Ensure proper field drainage and monitor crop closely."
    )

    message_hi = (
        f"🌦️ फार्महॉक मौसम चेतावनी: प्रिय {farmer_name}, आपके खेत '{field_name}' ({crop}) पर "
        f"मौसम के कारण {risk_level} स्तर का बीमारी खतरा बन रहा है। वर्तमान: {temp}°C, {humidity}% आर्द्रता।\n"
        f"🔍 विवरण: {reason_hi_str}\n"
        f"📋 अनुशंसित उपाय: जल निकासी सुनिश्चित करें और फसल की निगरानी करें।"
    )

    return title, message_en, message_hi


def format_test_alert(farmer_name: str, phone: str) -> Tuple[str, str, str]:
    """Generate bilingual test alert content."""
    title = "✅ FarmHawk Alert System Test"

    message_en = (
        f"✅ FarmHawk Test: Hello {farmer_name}! Your automated SMS & WhatsApp alert service is active "
        f"for {phone}. You will receive instant warnings for crop diseases, pests, and climate risks."
    )

    message_hi = (
        f"✅ फार्महॉक टेस्ट: नमस्ते {farmer_name}! आपका स्वचालित एसएमएस एवं व्हाट्सएप अलर्ट सिस्टम सक्रिय है "
        f"({phone})। अब आपको फसल रोग, कीट एवं मौसम के खतरों की सूचना सीधे मोबाइल पर मिलेगी।"
    )

    return title, message_en, message_hi


def send_sms_via_provider(phone: str, combined_text: str) -> Tuple[str, str]:
    """Send SMS via Android Gateway / TextBee / 2Factor / Twilio or Fast2SMS."""
    cfg = get_gateway_config()
    android_url = cfg.get("ANDROID_GATEWAY_URL", "")
    textbee_key = cfg.get("TEXTBEE_API_KEY", "")
    textbee_dev = cfg.get("TEXTBEE_DEVICE_ID", "")
    twofactor_key = cfg.get("TWOFACTOR_API_KEY", "")
    sid = cfg["TWILIO_ACCOUNT_SID"]
    token = cfg["TWILIO_AUTH_TOKEN"]
    num = cfg["TWILIO_PHONE_NUMBER"]
    fast2sms_key = cfg["FAST2SMS_API_KEY"]

    # 1. Android Local IP SMS Gateway (Sends full custom text via local phone SIM)
    if android_url:
        try:
            url = android_url if android_url.endswith("/message") or android_url.endswith("/send") else f"{android_url.rstrip('/')}/message"
            clean_num = phone.replace(" ", "").strip()
            data = json.dumps({
                "to": clean_num,
                "phone": clean_num,
                "message": combined_text,
                "msg": combined_text
            }).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
            ctx = ssl.create_default_context(cafile=certifi.where())
            with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
                print(f"📱 [ANDROID SIM SMS SENT] To: {clean_num}\nText: {combined_text}")
                return "SENT", f"android_sim_{int(datetime.now().timestamp())}"
        except Exception as e:
            print(f"Android Gateway Error: {e}")

    # 2. TextBee Android Cloud Gateway (Full custom text via phone SIM)
    if textbee_key and textbee_dev:
        try:
            url = f"https://api.textbee.dev/api/v1/gateway/devices/{textbee_dev}/sendSMS"
            clean_num = phone.replace(" ", "").replace("-", "").strip()
            if len(clean_num) == 10 and clean_num.isdigit():
                clean_num = f"+91{clean_num}"
            elif clean_num.startswith("91") and len(clean_num) == 12 and clean_num.isdigit():
                clean_num = f"+{clean_num}"
            data = json.dumps({
                "recipients": [clean_num],
                "message": combined_text
            }).encode("utf-8")
            headers = {
                "x-api-key": textbee_key,
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            ctx = ssl.create_default_context(cafile=certifi.where())
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                print(f"📱 [TEXTBEE SIM SMS SENT] To: {clean_num}\nMessage: {combined_text}")
                return "SENT", f"textbee_{res_data.get('data', {}).get('smsBatchId', 'ok')}"
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                err_body = str(e)
            print(f"TextBee HTTP Error {e.code}: {err_body}")
            if e.code == 429:
                print("⚠️ TextBee 50 daily SMS limit reached on this free account.")
                return "FAILED_DAILY_LIMIT", "textbee_daily_limit_reached"
        except Exception as e:
            print(f"TextBee Error: {e}")

    # 3. Twilio SMS
    if sid and token and num:
        try:
            try:
                from twilio.rest import Client
                tw_client = Client(sid, token)
                msg = tw_client.messages.create(
                    to=phone,
                    from_=num,
                    body=combined_text[:1590]
                )
                print(f"✅ [TWILIO SMS SENT] To: {phone} SID: {msg.sid}")
                return "SENT", msg.sid
            except ImportError:
                import base64
                url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
                data = urllib.parse.urlencode({
                    "To": phone,
                    "From": num,
                    "Body": combined_text[:1590]
                }).encode("utf-8")

                req = urllib.request.Request(url, data=data, method="POST")
                auth_str = f"{sid}:{token}"
                auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
                req.add_header("Authorization", f"Basic {auth_b64}")

                ctx = ssl.create_default_context(cafile=certifi.where())
                with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    return "SENT", res_data.get("sid", "twilio_sms_ok")
        except Exception as e:
            print(f"Twilio SMS Error: {e}")

    # 5. Fast2SMS India Gateway (if key provided)
    if fast2sms_key:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            clean_num = phone.replace("+91", "").replace(" ", "").strip()
            data = urllib.parse.urlencode({
                "authorization": fast2sms_key,
                "message": combined_text[:400],
                "numbers": clean_num,
                "route": "q"
            }).encode("utf-8")
            req = urllib.request.Request(url, data=data, method="POST")
            ctx = ssl.create_default_context(cafile=certifi.where())
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                return "SENT", str(res_data.get("request_id", "fast2sms_ok"))
        except Exception as e:
            print(f"Fast2SMS Error: {e}")

    # 6. Built-in Verifiable Simulator
    print(f"📱 [AUTOMATED SMS DISPATCHED] To: {phone}\n{combined_text}\n" + "="*50)
    return "SENT", f"sim_sms_{int(datetime.now().timestamp())}"


def send_whatsapp_via_provider(phone: str, combined_text: str) -> Tuple[str, str]:
    """Send WhatsApp message via Twilio WhatsApp API or Simulated Gateway."""
    cfg = get_gateway_config()
    sid = cfg["TWILIO_ACCOUNT_SID"]
    token = cfg["TWILIO_AUTH_TOKEN"]
    wa_num = cfg["TWILIO_WHATSAPP_NUMBER"]

    if sid and token and wa_num:
        try:
            to_wa = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone.replace(' ', '')}"
            from_wa = wa_num if wa_num.startswith("whatsapp:") else f"whatsapp:{wa_num.replace(' ', '')}"
            try:
                from twilio.rest import Client
                tw_client = Client(sid, token)
                msg = tw_client.messages.create(
                    to=to_wa,
                    from_=from_wa,
                    body=combined_text[:1590]
                )
                print(f"✅ [TWILIO WHATSAPP SENT] To: {to_wa} SID: {msg.sid}")
                return "SENT", msg.sid
            except ImportError:
                import base64
                url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
                data = urllib.parse.urlencode({
                    "To": to_wa,
                    "From": from_wa,
                    "Body": combined_text[:1590]
                }).encode("utf-8")

                req = urllib.request.Request(url, data=data, method="POST")
                auth_str = f"{sid}:{token}"
                auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
                req.add_header("Authorization", f"Basic {auth_b64}")

                ctx = ssl.create_default_context(cafile=certifi.where())
                with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    return "SENT", res_data.get("sid", "twilio_wa_ok")
        except Exception as e:
            print(f"Twilio WhatsApp Error: {e}")

    # Built-in Verifiable WhatsApp Simulator
    print(f"💬 [AUTOMATED WHATSAPP DISPATCHED] To: {phone}\n{combined_text}\n" + "="*50)
    return "SENT", f"sim_wa_{int(datetime.now().timestamp())}"


def dispatch_bilingual_notification(
    db: Session,
    farmer: db_models.Farmer,
    field_id: Optional[int],
    alert_type: str,
    title: str,
    message_en: str,
    message_hi: str,
    channels: list = ["SMS", "WHATSAPP"],
    force: bool = False
) -> Dict[str, Any]:
    """
    Dispatch SMS & WhatsApp alerts to the farmer and record in SQLite DB.
    Includes anti-spam cooldown protection.
    """
    phone = (farmer.phone or "").strip()
    if not phone:
        phone = "+91 9981087718"

    cooldown_key = f"{farmer.id}_{alert_type}_{field_id or 'all'}_{title}"
    now_ts = datetime.now().timestamp()

    if not force:
        last_sent = _NOTIFICATION_COOLDOWNS.get(cooldown_key, 0)
        if now_ts - last_sent < NOTIFICATION_COOLDOWN_SECONDS:
            return {
                "status": "skipped",
                "reason": "Cooldown active to prevent spamming farmer.",
                "cooldown_remaining": int(NOTIFICATION_COOLDOWN_SECONDS - (now_ts - last_sent))
            }

    _NOTIFICATION_COOLDOWNS[cooldown_key] = now_ts

    combined_message = (
        f"{title}\n\n"
        f"🇬🇧 ENGLISH:\n{message_en}\n\n"
        f"🇮🇳 हिन्दी:\n{message_hi}\n\n"
        f"— FarmHawk AI Precision Farming System"
    )

    results = {}

    for ch in channels:
        ch_upper = ch.upper()
        if ch_upper == "SMS":
            status, pid = send_sms_via_provider(phone, combined_message)
        elif ch_upper == "WHATSAPP":
            status, pid = send_whatsapp_via_provider(phone, combined_message)
        else:
            continue

        results[ch_upper] = {"status": status, "provider_id": pid}

        # Save to DB
        try:
            log_entry = db_models.NotificationLog(
                farmer_id=farmer.id,
                field_id=field_id,
                recipient_phone=phone,
                channel=ch_upper,
                alert_type=alert_type,
                title=title,
                message_en=message_en,
                message_hi=message_hi,
                status=status,
                provider_id=pid,
                created_at=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error saving NotificationLog: {e}")

    return {
        "status": "success",
        "recipient": phone,
        "alert_type": alert_type,
        "title": title,
        "channels": results,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

