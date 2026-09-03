from typing import Dict, Any, List, Optional
from services.agriculture_service import get_crop_knowledge, calculate_growth_stage

def calculate_disease_risk_and_advice(
    crop_name: str,
    sowing_date: str,
    weather_data: Optional[Dict[str, Any]],
    recent_detections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evidence-based agricultural risk engine.
    Calculates disease risk ONLY when real weather data is available.
    Explains exact reasons for calculated risk level.
    """
    stage_info = calculate_growth_stage(sowing_date, crop_name)

    if not weather_data:
        return {
            "status": "unavailable",
            "message_en": "Risk cannot currently be calculated because real weather data is unavailable.",
            "message_hi": "वास्तविक मौसम डेटा अनुपलब्ध होने के कारण वर्तमान में जोखिम की गणना नहीं की जा सकती है।",
            "growth_stage": stage_info,
            "overall_risk": "UNKNOWN",
            "reasons": [],
            "threats": [],
            "recommendations": [],
            "recent_detections": recent_detections
        }

    temp = weather_data.get("temperature")
    humidity = weather_data.get("humidity")
    precipitation = weather_data.get("precipitation_mm", 0.0)
    rain = weather_data.get("rain_mm", 0.0)

    knowledge = get_crop_knowledge(crop_name)
    threats = knowledge.get("threats", [])

    assessed_threats = []
    global_reasons_en = []
    global_reasons_hi = []

    highest_risk_score = 0 # 0=Low, 1=Moderate, 2=High, 3=Critical

    for threat in threats:
        threat_score = 0
        reasons_en = []
        reasons_hi = []

        # 1. Temperature Range Check
        t_min = threat.get("fav_temp_min", 0)
        t_max = threat.get("fav_temp_max", 45)
        if temp is not None and t_min <= temp <= t_max:
            threat_score += 1
            reasons_en.append(f"Current temperature ({temp}°C) is favorable for {threat['name_en']} ({t_min}°C–{t_max}°C).")
            reasons_hi.append(f"वर्तमान तापमान ({temp}°C) {threat['name_hi']} के लिए अनुकूल है ({t_min}°C–{t_max}°C)।")

        # 2. Relative Humidity Check
        h_min = threat.get("fav_humidity_min", 70)
        if humidity is not None and humidity >= h_min:
            threat_score += 1
            reasons_en.append(f"High relative humidity ({humidity}%) meets humidity threshold (≥{h_min}%).")
            reasons_hi.append(f"उच्च सापेक्ष आर्द्रता ({humidity}%) जोखिम सीमा से अधिक है (≥{h_min}%)।")

        # 3. Growth Stage Vulnerability Check
        crit_stages = threat.get("critical_stages", [])
        if stage_info["stage_en"] in crit_stages:
            threat_score += 1
            reasons_en.append(f"Crop is currently in a vulnerable growth stage ({stage_info['stage_en']}).")
            reasons_hi.append(f"फसल वर्तमान में संवेदनशील विकास अवस्था ({stage_info['stage_hi']}) में है।")

        # 4. Precipitation/Rain Check
        if threat.get("requires_rain") and (precipitation > 0 or rain > 0):
            threat_score += 1
            reasons_en.append(f"Recent precipitation ({precipitation} mm) creates leaf wetness ideal for fungal spore germination.")
            reasons_hi.append(f"हालिया वर्षा ({precipitation} mm) फफूंद के अंकुरण के लिए अनुकूल परिस्थितियां बनाती है।")

        # Determine threat level
        risk_level = "LOW"
        if threat_score == 1 or threat_score == 2:
            risk_level = "MODERATE"
            highest_risk_score = max(highest_risk_score, 1)
        elif threat_score >= 3:
            risk_level = "HIGH"
            highest_risk_score = max(highest_risk_score, 2)

        # Check if YOLO model has detected this pathogen recently!
        has_yolo_detection = any(
            d.get("disease_or_pest_name", "").lower() in threat["name_en"].lower()
            for d in recent_detections
        )
        if has_yolo_detection:
            risk_level = "CRITICAL"
            highest_risk_score = 3
            reasons_en.insert(0, f"CONFIRMED YOLO DETECTION: {threat['name_en']} observed in recent camera/drone feed.")
            reasons_hi.insert(0, f"पुष्टि योग्य ड्रोन संसूचन: कैमरे/ड्रोन फीड में {threat['name_hi']} देखा गया है।")

        assessed_threats.append({
            "threat_id": threat["id"],
            "name_en": threat["name_en"],
            "name_hi": threat["name_hi"],
            "type": threat["type"],
            "risk_level": risk_level,
            "reasons_en": reasons_en,
            "reasons_hi": reasons_hi,
            "symptoms_en": threat["symptoms_en"],
            "symptoms_hi": threat["symptoms_hi"],
            "action_en": threat["action_en"],
            "action_hi": threat["action_hi"]
        })

        if risk_level in ["MODERATE", "HIGH", "CRITICAL"]:
            global_reasons_en.extend(reasons_en)
            global_reasons_hi.extend(reasons_hi)

    # Calculate overall risk
    overall_risk = "LOW"
    if highest_risk_score == 1:
        overall_risk = "MODERATE"
    elif highest_risk_score == 2:
        overall_risk = "HIGH"
    elif highest_risk_score == 3:
        overall_risk = "CRITICAL"

    if not global_reasons_en:
        global_reasons_en = ["Weather conditions (temperature, humidity, rain) are currently outside favorable pathogen development ranges."]
        global_reasons_hi = ["मौसम की स्थितियां (तापमान, आर्द्रता, वर्षा) वर्तमान में बीमारी के पनपने के अनुकूल नहीं हैं।"]

    # Generate actionable advice
    recommendations = []
    for at in assessed_threats:
        if at["risk_level"] in ["MODERATE", "HIGH", "CRITICAL"]:
            recommendations.append({
                "concern_en": f"Environmental risk detected for {at['name_en']}",
                "concern_hi": f"{at['name_hi']} के लिए पर्यावरण संबंधी जोखिम पाया गया",
                "action_en": at["action_en"],
                "action_hi": at["action_hi"],
                "monitor_en": f"Check crop leaves for: {at['symptoms_en']}",
                "monitor_hi": f"पत्तियों पर लक्षण देखें: {at['symptoms_hi']}",
                "recheck_en": "Recheck in 48 hours or after rain event.",
                "recheck_hi": "48 घंटे बाद या बारिश के बाद पुनः जांच करें।"
            })

    if not recommendations:
        recommendations.append({
            "concern_en": "No immediate disease risk detected under current climate.",
            "concern_hi": "वर्तमान मौसम में कोई तत्काल बीमारी का जोखिम नहीं है।",
            "action_en": "Continue routine field monitoring and maintain clean drainage.",
            "action_hi": "नियमित निगरानी जारी रखें और जल निकासी बनाए रखें।",
            "monitor_en": "Watch for any unusual leaf discoloration or pest activity.",
            "monitor_hi": "पत्तियों का रंग बदलने या कीटों की उपस्थिति पर नज़र रखें।",
            "recheck_en": "Recheck weekly or after significant weather change.",
            "recheck_hi": "साप्ताहिक या मौसम बदलने पर पुनः जांचें।"
        })

    return {
        "status": "success",
        "crop": crop_name,
        "sowing_date": sowing_date,
        "growth_stage": stage_info,
        "overall_risk": overall_risk,
        "reasons_en": list(set(global_reasons_en)),
        "reasons_hi": list(set(global_reasons_hi)),
        "threats": assessed_threats,
        "recommendations": recommendations,
        "recent_detections": recent_detections,
        "weather_summary": {
            "temperature": temp,
            "humidity": humidity,
            "precipitation": precipitation,
            "condition_en": weather_data.get("condition_en"),
            "condition_hi": weather_data.get("condition_hi"),
            "observation_time": weather_data.get("observation_time")
        }
    }

