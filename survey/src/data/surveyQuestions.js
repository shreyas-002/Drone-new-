export const surveyQuestions = [
  {
    id: 1,
    key: "crops",
    type: "multiple",
    question: {
      en: "What type of crops do you mainly grow?",
      hi: "आप मुख्य रूप से कौन सी फसलें उगाते हैं?"
    },
    subtitle: {
      en: "Select all that apply",
      hi: "सभी लागू होने वाले विकल्प चुनें"
    },
    options: [
      "Wheat / Rabi Cereals (गेहूं / रबी फसलें)",
      "Rice / Paddy (धान / चावल)",
      "Vegetables (सब्जियाँ)",
      "Pulses (दालें)",
      "Fruits (फल)",
      "Oilseeds (तिलहन)",
      "Cotton / Cash Crops (कपास / नकदी फसलें)",
      "Other (अन्य)"
    ]
  },
  {
    id: 2,
    key: "farmland_size",
    type: "single",
    question: {
      en: "What is the approximate size of your farmland?",
      hi: "आपकी कृषि भूमि का अनुमानित क्षेत्रफल कितना है?"
    },
    options: [
      "Less than 2 acres (2 एकड़ से कम)",
      "2 to 5 acres (2 से 5 एकड़ / लघु किसान)",
      "5 to 10 acres (5 से 10 एकड़)",
      "More than 10 acres (10 एकड़ से अधिक)"
    ]
  },
  {
    id: 3,
    key: "irrigation",
    type: "single",
    question: {
      en: "What is the primary source of irrigation on your farm?",
      hi: "आपके खेत में सिंचाई का मुख्य स्रोत क्या है?"
    },
    options: [
      "Tube well / Borewell (नलकूप / बोरवेल)",
      "Canal (नहर)",
      "Rain-fed (वर्षा आधारित)",
      "Open well (कुआँ)",
      "Other (अन्य)"
    ]
  },
  {
    id: 4,
    key: "operational_challenges",
    type: "multiple",
    question: {
      en: "What are the biggest operational challenges you face?",
      hi: "आपको खेती के संचालन में किन प्रमुख समस्याओं का सामना करना पड़ता है?"
    },
    subtitle: {
      en: "Select all that apply",
      hi: "सभी लागू होने वाले विकल्प चुनें"
    },
    options: [
      "Insect and pest attacks (कीटों, माहू या सुंडी का अचानक प्रकोप)",
      "Sudden weather shock / unseasonal rain (अचानक मौसम बदलना / बेमौसम बारिश)",
      "Water shortage / irrigation issues (पानी की कमी / सिंचाई की समस्या)",
      "Difficulty in identifying crop diseases (फसल रोगों की पहचान में कठिनाई)",
      "High input costs (उर्वरक, दवा आदि की अधिक लागत)",
      "Labour shortage (मजदूरों की कमी)",
      "Other (अन्य)"
    ]
  },
  {
    id: 5,
    key: "inspection_difficulty",
    type: "rating",
    min: 1,
    max: 5,
    question: {
      en: "How difficult is it for you to regularly inspect your entire farmland for crop health?",
      hi: "अपने पूरे खेत की फसल के स्वास्थ्य की नियमित जाँच करना आपके लिए कितना कठिन है?"
    },
    labels: {
      low: { en: "Very Easy (बहुत आसान)", hi: "बहुत आसान (Very Easy)" },
      high: { en: "Very Difficult (बहुत कठिन)", hi: "बहुत कठिन (Very Difficult)" }
    }
  },
  {
    id: 6,
    key: "late_discovery_frequency",
    type: "single",
    question: {
      en: "How frequently do you discover crop diseases or pests only after they have spread?",
      hi: "आपको कितनी बार फसल की बीमारी या कीटों का पता तब चलता है जब वे काफी फैल चुके होते हैं?"
    },
    options: [
      "Rarely (शायद ही कभी)",
      "Sometimes (कभी-कभी)",
      "Frequently — In certain critical months (काफी बार — संवेदनशील महीनों में)",
      "Very Frequently (बहुत बार)",
      "Almost Always (लगभग हमेशा)"
    ]
  },
  {
    id: 7,
    key: "advice_source",
    type: "single",
    question: {
      en: "When you notice a crop disease or pest problem, whom do you usually ask for advice?",
      hi: "जब आपको फसल में बीमारी या कीट की समस्या दिखाई देती है, तो आप आमतौर पर सलाह किससे लेते हैं?"
    },
    options: [
      "Experienced neighboring farmers (आस-पास के अनुभवी किसान भाइयों से)",
      "Local agricultural input dealer (स्थानीय कृषि दवा/बीज विक्रेता)",
      "Government agriculture officer (सरकारी कृषि अधिकारी)",
      "Private agriculture expert (निजी कृषि विशेषज्ञ)",
      "Internet / YouTube (इंटरनेट / यूट्यूब)",
      "Other (अन्य)"
    ]
  },
  {
    id: 8,
    key: "early_warning_rating",
    type: "rating",
    min: 1,
    max: 5,
    question: {
      en: "How helpful would an early warning system for crop diseases, pests and weather risks be?",
      hi: "फसल की बीमारी, कीट और मौसम के खतरे के लिए पहले से चेतावनी देने वाली प्रणाली आपके लिए कितनी उपयोगी होगी?"
    },
    labels: {
      low: { en: "Not Useful (उपयोगी नहीं)", hi: "उपयोगी नहीं (Not Useful)" },
      high: { en: "Extremely Useful (अत्यंत उपयोगी)", hi: "अत्यंत उपयोगी (Extremely Useful)" }
    }
  },
  {
    id: 9,
    key: "pesticide_problems",
    type: "multiple",
    question: {
      en: "What are the biggest problems you face while applying pesticides?",
      hi: "कीटनाशक/दवा का छिड़काव करते समय आपको किन प्रमुख समस्याओं का सामना करना पड़ता है?"
    },
    subtitle: {
      en: "Select all that apply",
      hi: "सभी लागू होने वाले विकल्प चुनें"
    },
    options: [
      "Chemical wastage from spraying healthy and unhealthy areas equally (पूरे खेत पर बेवजह दवा का अधिक खर्च)",
      "Difficulty identifying affected areas (प्रभावित क्षेत्र की पहचान में कठिनाई)",
      "Incorrect dosage / mixing (गलत मात्रा / मिश्रण)",
      "High labour requirement (अधिक मजदूरी/श्रम की आवश्यकता)",
      "Health and safety concerns (स्वास्थ्य और सुरक्षा संबंधी चिंता)",
      "Other (अन्य)"
    ]
  },
  {
    id: 10,
    key: "drone_spraying_value",
    type: "rating",
    min: 1,
    max: 5,
    question: {
      en: "If an aerial drone could identify affected crop areas and enable targeted spraying, how valuable would this be to you?",
      hi: "यदि ड्रोन प्रभावित फसल क्षेत्रों की पहचान करके केवल उन्हीं स्थानों पर दवा का छिड़काव कर सके, तो यह सुविधा आपके लिए कितनी उपयोगी होगी?"
    },
    labels: {
      low: { en: "Not Valuable (मूल्यवान नहीं)", hi: "मूल्यवान नहीं (Not Valuable)" },
      high: { en: "Extremely Valuable (अत्यंत मूल्यवान)", hi: "अत्यंत मूल्यवान (Extremely Valuable)" }
    }
  },
  {
    id: 11,
    key: "valuable_features",
    type: "multiple",
    maxSelection: 3,
    question: {
      en: "Which of the following FarmHawk features would be most valuable to you? (Select max 3)",
      hi: "निम्नलिखित में से FarmHawk की कौन सी सुविधाएँ आपके लिए सबसे अधिक उपयोगी होंगी? (अधिकतम 3 चुनें)"
    },
    subtitle: {
      en: "Select up to 3 features (Max 3)",
      hi: "3 सुविधाएँ चुनें (अधिकतम 3)"
    },
    options: [
      "AI camera detection of leaf diseases & insect pests (कैमरे द्वारा पत्तियों की बीमारी और कीटों की पहचान)",
      "Hyperlocal live weather forecast & rain probability (आपके क्षेत्र के अनुसार सटीक मौसम पूर्वानुमान और बारिश की संभावना)",
      "Scientifically approved chemical remedies & dosage advice (वैज्ञानिक रूप से प्रमाणित दवा और सही खुराक की सलाह)",
      "Drone survey & GPS-based affected area mapping (ड्रोन सर्वे और GPS आधारित प्रभावित क्षेत्र की मैपिंग)",
      "Krishi Samvad (कृषि संवाद)",
      "Government schemes & subsidies information (सरकारी योजनाओं और सब्सिडी की जानकारी)",
      "Other (अन्य)"
    ]
  },
  {
    id: 12,
    key: "krishi_samvad_usefulness",
    type: "single",
    question: {
      en: "How useful would Krishi Samvad be for getting transparent and unbiased agricultural advice?",
      hi: "पारदर्शी और निष्पक्ष कृषि सलाह प्राप्त करने के लिए कृषि संवाद आपके लिए कितना उपयोगी होगा?"
    },
    options: [
      "Not Useful (उपयोगी नहीं)",
      "Slightly Useful (थोड़ा उपयोगी)",
      "Moderately Useful (मध्यम उपयोगी)",
      "Very Useful (बहुत उपयोगी)",
      "Highly Useful — Needed for transparent, unbiased advice (अत्यंत उपयोगी — पारदर्शी और निष्पक्ष सलाह के लिए आवश्यक)"
    ]
  },
  {
    id: 13,
    key: "preferred_alert_method",
    type: "single",
    question: {
      en: "How would you prefer to receive important crop/weather alerts?",
      hi: "आप महत्वपूर्ण फसल/मौसम चेतावनियाँ किस माध्यम से प्राप्त करना पसंद करेंगे?"
    },
    options: [
      "Simple mobile application with Hindi voice support (हिंदी वॉइस सपोर्ट के साथ सरल मोबाइल ऐप)",
      "SMS (एसएमएस)",
      "WhatsApp (व्हाट्सऐप)",
      "Phone call / voice call (फोन कॉल / वॉइस कॉल)",
      "Other (अन्य)"
    ]
  },
  {
    id: 14,
    key: "adoption_concerns",
    type: "multiple",
    question: {
      en: "What would be your main concern about adopting AI/drone-based farming technology?",
      hi: "AI/ड्रोन आधारित कृषि तकनीक अपनाने को लेकर आपकी मुख्य चिंता क्या होगी?"
    },
    subtitle: {
      en: "Select all that apply",
      hi: "सभी लागू होने वाले विकल्प चुनें"
    },
    options: [
      "Complex English interface / lack of tech skills (जटिल अंग्रेजी इंटरफेस / तकनीकी ज्ञान की कमी)",
      "Cost of technology (तकनीक की लागत)",
      "Doubt about whether aerial AI detection is really accurate (संदेह कि क्या हवाई AI पहचान वास्तव में सटीक है)",
      "Privacy / data concerns (गोपनीयता / डेटा संबंधी चिंताएं)",
      "Difficulty operating drones or devices (ड्रोन या उपकरणों को चलाने में कठिनाई)",
      "Lack of local technical support (स्थानीय तकनीकी सहायता की कमी)",
      "Other (अन्य)"
    ]
  },
  {
    id: 15,
    key: "biggest_problem",
    type: "text",
    question: {
      en: "In your own words, what is the biggest problem in farming that you wish technology could solve?",
      hi: "अपने शब्दों में बताइए कि खेती की सबसे बड़ी कौन सी समस्या है जिसे आप चाहते हैं कि तकनीक हल करे?"
    },
    placeholder: {
      en: "Type your response here...",
      hi: "अपना उत्तर यहाँ दर्ज करें..."
    }
  }
];
