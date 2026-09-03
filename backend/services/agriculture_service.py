from datetime import datetime
from typing import Dict, Any, List

# Authoritative Crop Knowledge Base
CROP_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "wheat": {
        "name_en": "Wheat",
        "name_hi": "गेहूं",
        "growth_stages": [
            {"max_days": 15, "stage_en": "Germination & Seedling", "stage_hi": "अंकुरण एवं पौधा अवस्था"},
            {"max_days": 45, "stage_en": "Tillering & Vegetative", "stage_hi": "कल्ले निकलना एवं कायिक वृद्धि"},
            {"max_days": 85, "stage_en": "Heading & Flowering", "stage_hi": "बालियां निकलना एवं पुष्पन"},
            {"max_days": 999, "stage_en": "Grain Filling & Maturity", "stage_hi": "दाना भरना एवं पकना"}
        ],
        "threats": [
            {
                "id": "yellow_rust",
                "name_en": "Yellow Rust (Stripe Rust)",
                "name_hi": "पीला रतुआ (येलो रस्ट)",
                "type": "DISEASE",
                "fav_temp_min": 10,
                "fav_temp_max": 22,
                "fav_humidity_min": 75,
                "requires_rain": False,
                "critical_stages": ["Tillering & Vegetative", "Heading & Flowering"],
                "symptoms_en": "Yellow pustules forming linear stripes on leaves.",
                "symptoms_hi": "पत्तियों पर पीले रंग के धब्बे रेखाओं के रूप में उभरते हैं।",
                "prevention_en": "Use resistant varieties (HD-2967, PBW-550). Avoid excess nitrogen.",
                "prevention_hi": "प्रतिरोधी किस्मों का चयन करें। यूरिया की अत्यधिक मात्रा से बचें।",
                "action_en": "Spray Propiconazole 25% EC @ 1ml/liter water if stripes appear.",
                "action_hi": "शुरुआती लक्षण दिखने पर प्रोपिकोनाज़ोल 25% EC 1 एमएल/लीटर पानी में घोलकर छिड़कें।"
            },
            {
                "id": "brown_rust",
                "name_en": "Leaf Rust (Brown Rust)",
                "name_hi": "भूरा रतुआ (ब्राउन रस्ट)",
                "type": "DISEASE",
                "fav_temp_min": 15,
                "fav_temp_max": 28,
                "fav_humidity_min": 70,
                "requires_rain": False,
                "critical_stages": ["Heading & Flowering", "Grain Filling & Maturity"],
                "symptoms_en": "Small round orange-brown pustules scattered on leaf surface.",
                "symptoms_hi": "पत्तियों की ऊपरी सतह पर गोल, नारंगी-भूरे रंग के फफोले नजर आते हैं।",
                "prevention_en": "Monitor field regularly during warm humid weather.",
                "prevention_hi": "नमी वाले मौसम में नियमित रूप से खेत का निरीक्षण करें।",
                "action_en": "Apply Mancozeb 75% WP @ 2g/liter of water at first symptom.",
                "action_hi": "मैनकोजेब 75% WP 2 ग्राम/लीटर पानी के हिसाब से छिड़कें।"
            },
            {
                "id": "aphids",
                "name_en": "Wheat Aphids",
                "name_hi": "गेहूं का माहू (माहूँ)",
                "type": "PEST",
                "fav_temp_min": 15,
                "fav_temp_max": 26,
                "fav_humidity_min": 60,
                "requires_rain": False,
                "critical_stages": ["Heading & Flowering"],
                "symptoms_en": "Small green insects sucking sap from ears and leaves, honey dew secretion.",
                "symptoms_hi": "छोटे हरे कीड़े बालियों और पत्तियों से रस चूसते हैं।",
                "prevention_en": "Conserve natural predators like ladybird beetles.",
                "prevention_hi": "मित्र कीटों (जैसे लेडीबर्ड बीटल) का संरक्षण करें।",
                "action_en": "If threshold (>5 aphids/ear) crossed, spray Imidacloprid 17.8% SL @ 0.5ml/L.",
                "action_hi": "आर्थिक क्षति स्तर पार होने पर इमिडाक्लोप्रिड 17.8% SL 0.5 एमएल/लीटर घोलें।"
            }
        ]
    },
    "tomato": {
        "name_en": "Tomato",
        "name_hi": "टमाटर",
        "growth_stages": [
            {"max_days": 25, "stage_en": "Nursery & Establishment", "stage_hi": "पौध तैयार एवं रोपण अवस्था"},
            {"max_days": 60, "stage_en": "Vegetative & Branching", "stage_hi": "वानस्पतिक वृद्धि अवस्था"},
            {"max_days": 90, "stage_en": "Flowering & Fruit Set", "stage_hi": "फूल एवं फल आने की अवस्था"},
            {"max_days": 999, "stage_en": "Fruit Ripening & Harvesting", "stage_hi": "फल पकना एवं तुड़ाई"}
        ],
        "threats": [
            {
                "id": "early_blight",
                "name_en": "Early Blight",
                "name_hi": "अगेती झुलसा (अर्ली ब्लाइट)",
                "type": "DISEASE",
                "fav_temp_min": 24,
                "fav_temp_max": 30,
                "fav_humidity_min": 80,
                "requires_rain": True,
                "critical_stages": ["Vegetative & Branching", "Flowering & Fruit Set"],
                "symptoms_en": "Concentric rings (target spots) on lower leaves.",
                "symptoms_hi": "निचली पत्तियों पर छल्लेदार (टारगेट बोर्ड जैसे) काले-भूरे धब्बे।",
                "prevention_en": "Avoid overhead irrigation, maintain row spacing.",
                "prevention_hi": "ऊपर से पानी देने (फव्वारा) से बचें, पौधों के बीच दूरी रखें।",
                "action_en": "Spray Chlorothalonil 75% WP @ 2g/liter of water.",
                "action_hi": "क्लोरोथेलोनिल 75% WP 2 ग्राम/लीटर पानी में छिड़कें।"
            },
            {
                "id": "late_blight",
                "name_en": "Late Blight",
                "name_hi": "पछेती झुलसा (लेट ब्लाइट)",
                "type": "DISEASE",
                "fav_temp_min": 12,
                "fav_temp_max": 22,
                "fav_humidity_min": 85,
                "requires_rain": True,
                "critical_stages": ["Flowering & Fruit Set", "Fruit Ripening & Harvesting"],
                "symptoms_en": "Water-soaked dark lesions on leaves with white fungal growth underneath.",
                "symptoms_hi": "पत्तियों पर जल-सोखे काले धब्बे और निचली सतह पर सफेद फफूंद।",
                "prevention_en": "Ensure proper drainage and air circulation.",
                "prevention_hi": "खेत में जलभराव न होने दें, वायु प्रवाह बनाए रखें।",
                "action_en": "Spray Metalaxyl + Mancozeb @ 2.5g/liter immediately.",
                "action_hi": "तत्काल मेटैलेक्सिल + मैनकोजेब 2.5 ग्राम/लीटर पानी में स्प्रे करें।"
            }
        ]
    }
}

# Fallback profile for unlisted crops
DEFAULT_CROP_KNOWLEDGE = {
    "name_en": "General Crop",
    "name_hi": "सामान्य फसल",
    "growth_stages": [
        {"max_days": 30, "stage_en": "Vegetative Stage", "stage_hi": "वानस्पतिक अवस्था"},
        {"max_days": 70, "stage_en": "Reproductive Stage", "stage_hi": "जनन अवस्था"},
        {"max_days": 999, "stage_en": "Maturity Stage", "stage_hi": "परिपक्वता अवस्था"}
    ],
    "threats": [
        {
            "id": "general_pest",
            "name_en": "Fungal Leaf Spot",
            "name_hi": "फंगल पत्ती धब्बा",
            "type": "DISEASE",
            "fav_temp_min": 20,
            "fav_temp_max": 32,
            "fav_humidity_min": 75,
            "requires_rain": False,
            "critical_stages": ["Vegetative Stage", "Reproductive Stage"],
            "symptoms_en": "Discolored brown/black spots on leaves.",
            "symptoms_hi": "पत्तियों पर भूरे या काले धब्बे।",
            "prevention_en": "Maintain field sanitation and clean drainage.",
            "prevention_hi": "खेत की सफाई रखें और उचित जल निकासी सुनिश्चित करें।",
            "action_en": "Inspect leaves regularly and consult local Krishi Vigyan Kendra.",
            "action_hi": "नियमित रूप से पत्तियों की जांच करें और स्थानीय कृषि विज्ञान केंद्र से संपर्क करें।"
        }
    ]
}

def get_crop_knowledge(crop_name: str) -> Dict[str, Any]:
    key = crop_name.lower().strip()
    return CROP_KNOWLEDGE_BASE.get(key, DEFAULT_CROP_KNOWLEDGE)

def calculate_growth_stage(sowing_date_str: str, crop_name: str) -> Dict[str, str]:
    """Calculates days since sowing and current growth stage."""
    try:
        sowing_dt = datetime.strptime(sowing_date_str, "%Y-%m-%d")
        days = (datetime.utcnow() - sowing_dt).days
        if days < 0:
            days = 0
    except Exception:
        days = 30 # Default if parse error

    knowledge = get_crop_knowledge(crop_name)
    stages = knowledge.get("growth_stages", [])

    stage_en = "Vegetative Stage"
    stage_hi = "वानस्पतिक अवस्था"

    for st in stages:
        if days <= st["max_days"]:
            stage_en = st["stage_en"]
            stage_hi = st["stage_hi"]
            break

    return {
        "days_since_sowing": days,
        "stage_en": stage_en,
        "stage_hi": stage_hi
    }

