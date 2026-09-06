import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Info,
  Globe,
  LogOut,
  Sprout,
  CloudRain,
  Eye,
  Lightbulb,
  MessageSquare,
  Landmark,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  HeartHandshake,
  HelpCircle,
  FileText,
  Building,
  Target,
  Compass,
  Check,
  Sparkles,
  Award,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import logoImg from "../assets/logo.png";
import farmerImg from "../assets/farmer.jpg";
import "../styles/AboutPage.css";

export default function AboutPage({
  onNavigateHome,
  onNavigateCommunity,
  onNavigateSurvey,
  language = "hi",
  onToggleLanguage,
  onLogout,
}) {
  const isHindi = language === "hi";
  const [activeTopic, setActiveTopic] = useState("what-is-farmhawk");

  const topics = [
    {
      id: "what-is-farmhawk",
      icon: <Sprout size={15} />,
      label_hi: "फार्महॉक क्या है?",
      label_en: "What is FarmHawk?",
    },
    {
      id: "how-helps",
      icon: <Building size={15} />,
      label_hi: "किसानों की सहायता",
      label_en: "How We Help",
    },
    {
      id: "how-it-works",
      icon: <Target size={15} />,
      label_hi: "कार्यप्रणाली",
      label_en: "How It Works",
    },
    {
      id: "krishi-samvad",
      icon: <Users size={15} />,
      label_hi: "कृषि संवाद",
      label_en: "Krishi Samvad",
    },
    {
      id: "gov-schemes",
      icon: <Landmark size={15} />,
      label_hi: "सरकारी योजनाएं",
      label_en: "Gov Schemes",
    },
    {
      id: "gov-resources",
      icon: <FileText size={15} />,
      label_hi: "सरकारी पोर्टल",
      label_en: "Gov Portals",
    },
    {
      id: "trust-transparency",
      icon: <ShieldCheck size={15} />,
      label_hi: "विश्वास व पारदर्शिता",
      label_en: "Trust & Privacy",
    },
    {
      id: "mission",
      icon: <HeartHandshake size={15} />,
      label_hi: "हमारा उद्देश्य",
      label_en: "Our Mission",
    },
  ];

  const scrollToTopic = (topicId) => {
    setActiveTopic(topicId);
    const element = document.getElementById(topicId);
    if (element) {
      const yOffset = -140;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Dynamic active section observer on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = topics.length - 1; i >= 0; i--) {
        const el = document.getElementById(topics[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveTopic(topics[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const featuresList = [
    {
      id: "fields",
      icon: <Sprout size={24} />,
      tag_hi: "खेत प्रोफाइल व GPS",
      tag_en: "Field Profile & GPS",
      title_hi: "खेत प्रबंधन (My Fields)",
      title_en: "Field Management (My Fields)",
      desc_hi:
        "अपने खेतों का क्षेत्रफल, फसल का प्रकार, बुआई की तारीख, मिट्टी व सिंचाई विवरण और सटीक GPS नक्शा एक स्थान पर सुरक्षित रखें।",
      desc_en:
        "Keep track of your farm field boundaries, area size, crop variety, sowing timeline, soil type, and GPS map coordinates in one secure dashboard.",
      accent: "#15803d",
    },
    {
      id: "weather",
      icon: <CloudRain size={24} />,
      tag_hi: "वास्तविक मौसम डेटा",
      tag_en: "Hyperlocal Weather",
      title_hi: "वास्तविक मौसम डेटा (Weather)",
      title_en: "Real Field Weather Observations",
      desc_hi:
        "अपने खेत के निर्देशांकों के आधार पर वास्तविक तापमान, नमी, वर्षा की संभावना, हवा की गति और आगामी 24 घंटे का पूर्वानुमान देखें।",
      desc_en:
        "Access real-time temperature, humidity levels, precipitation probability, wind speed, and 24-hour weather forecasts customized to your exact field coordinates.",
      accent: "#0284c7",
    },
    {
      id: "monitoring",
      icon: <Eye size={24} />,
      tag_hi: "विज़न AI व कैमरा",
      tag_en: "Vision AI & Monitoring",
      title_hi: "फसल निगरानी (Crop Monitoring)",
      title_en: "Crop & Vision Monitoring",
      desc_hi:
        "कंप्यूटर विज़न व स्मार्ट इमेज तकनीक की सहायता से पत्तियों पर लगने वाले कीटों और बीमारियों के प्रारंभिक लक्षणों की समय पर निगरानी करें।",
      desc_en:
        "Monitor crop health and detect early visual indicators of diseases and pests on crop foliage using smart image analysis models.",
      accent: "#7c3aed",
    },
    {
      id: "advice",
      icon: <Lightbulb size={24} />,
      tag_hi: "जोखिम व उपचार सलाह",
      tag_en: "Risk & Crop Advice",
      title_hi: "फसल सलाह व जोखिम (Crop Advice)",
      title_en: "Evidence-Based Crop Advice",
      desc_hi:
        "मौसम और फसल की विकास अवस्था के अनुसार कीट व रोग जोखिम का स्वतः विश्लेषण और कृषि विशेषज्ञों द्वारा सुझाई गई निवारक कार्य योजना पाएं।",
      desc_en:
        "Receive automated disease and pest risk assessments calculated from actual weather conditions and growth stages, with recommended preventive remedies.",
      accent: "#d97706",
    },
    {
      id: "community",
      icon: <MessageSquare size={24} />,
      tag_hi: "किसान-से-किसान समुदाय",
      tag_en: "Farmer Community",
      title_hi: "कृषि संवाद (Krishi Samvad)",
      title_en: "Krishi Samvad Community",
      desc_hi:
        "अन्य साथी किसानों से सीधे जुड़ें, फसल की समस्याएं पूछें, फोटो साझा करें, समाधानों पर चर्चा करें और वास्तविक अनुभवों से सीखें।",
      desc_en:
        "Connect directly with fellow farmers, ask crop queries, share field photos, discuss remedies, and learn practical solutions from real-world farming experiences.",
      accent: "#059669",
    },
    {
      id: "gov",
      icon: <Landmark size={24} />,
      tag_hi: "सत्यापित सरकारी नीतियां",
      tag_en: "Government Initiatives",
      title_hi: "सरकारी योजनाएं (Government Info)",
      title_en: "Government Schemes & Policies",
      desc_hi:
        "किसानों के लिए केंद्र व राज्य सरकारों की प्रमुख कल्याणकारी योजनाओं, सब्सिडी, फसल बीमा और वित्तीय सहायता की प्रामाणिक जानकारी प्राप्त करें।",
      desc_en:
        "Explore verified information on national and state agricultural schemes, input subsidies, crop insurance policies, and institutional farmer credit.",
      accent: "#b45309",
    },
  ];

  const govSchemes = [
    {
      id: "pm-kisan",
      category_hi: "प्रत्यक्ष वित्तीय सहायता",
      category_en: "Direct Income Support",
      title_hi: "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
      title_en: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      desc_hi:
        "पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता, जो ₹2,000 की तीन समान किस्तों में सीधे बैंक खाते (DBT) में भेजी जाती है।",
      desc_en:
        "Provides ₹6,000 per year financial benefit to all eligible landholder farmer families in three equal instalments deposited directly via DBT.",
      officialUrl: "https://pmkisan.gov.in",
    },
    {
      id: "pmfby",
      category_hi: "फसल बीमा सुरक्षा",
      category_en: "Crop Insurance & Risk Coverage",
      title_hi: "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
      title_en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      desc_hi:
        "प्राकृतिक आपदाओं, कीटों, रोगों एवं बेमौसम बारिश से फसल नुकसान की स्थिति में किसानों को व्यापक और न्यूनतम प्रीमियम पर बीमा सुरक्षा।",
      desc_en:
        "Comprehensive, affordable crop insurance coverage protecting farmers against financial losses caused by natural calamities, pests, and unseasonal weather.",
      officialUrl: "https://pmfby.gov.in",
    },
    {
      id: "kcc",
      category_hi: "कृषि ऋण व क्रेडिट",
      category_en: "Agricultural Credit & Working Capital",
      title_hi: "किसान क्रेडिट कार्ड योजना (KCC)",
      title_en: "Kisan Credit Card (KCC) Scheme",
      desc_hi:
        "किसानों को बीज, खाद, कीटनाशक और कृषि उपकरणों की खरीद के लिए रियायती ब्याज दर (समय पर भुगतान पर 4% तक) पर सुलभ ऋण सुविधा।",
      desc_en:
        "Ensures timely institutional credit at concessional interest rates (as low as 4% upon prompt repayment) for agricultural inputs and operational farm needs.",
      officialUrl: "https://myscheme.gov.in/schemes/kcc",
    },
    {
      id: "soil-card",
      category_hi: "मिट्टी स्वास्थ्य व उर्वरक",
      category_en: "Soil Health & Nutrient Management",
      title_hi: "मृदा स्वास्थ्य कार्ड योजना (Soil Health Card)",
      title_en: "Soil Health Card Scheme",
      desc_hi:
        "खेत की मिट्टी के 12 महत्वपूर्ण पोषक तत्वों की जांच कर खाद और उर्वरकों के संतुलित और किफायती उपयोग हेतु व्यक्तिगत परामर्श पत्रक।",
      desc_en:
        "Provides farmers with customized soil test reports analyzing 12 essential nutrients and guidance on balanced, cost-effective fertilizer application.",
      officialUrl: "https://soilhealth.dac.gov.in",
    },
    {
      id: "enam",
      category_hi: "राष्ट्रीय कृषि बाजार",
      category_en: "Agricultural Marketing & Trade",
      title_hi: "राष्ट्रीय कृषि ई-बाजार (e-NAM)",
      title_en: "National Agriculture Market (e-NAM)",
      desc_hi:
        "देश भर की कृषि मंडियों को ऑनलाइन जोड़कर किसानों को अपनी उपज का पारदर्शी, प्रतिस्पर्धी और बेहतर मूल्य दिलाने हेतु राष्ट्रीय ट्रेडिंग पोर्टल।",
      desc_en:
        "Pan-India electronic trading portal networking existing APMC mandis to create a unified national market for transparent price discovery and fair trade.",
      officialUrl: "https://enam.gov.in",
    },
    {
      id: "kusum",
      category_hi: "सोलर ऊर्जा व सिंचाई",
      category_en: "Solar Energy & Irrigation Subsidy",
      title_hi: "पीएम कुसुम योजना (PM-KUSUM)",
      title_en: "PM-KUSUM Solar Agriculture Scheme",
      desc_hi:
        "सिंचाई के लिए सोलर पंपों की स्थापना हेतु भारी सरकारी सब्सिडी और बंजर भूमि पर सोलर प्लांट लगाकर अतिरिक्त आय अर्जित करने का अवसर।",
      desc_en:
        "Subsidizes solar-powered water pumps for reliable daytime irrigation and empowers farmers to generate clean energy and supplementary income.",
      officialUrl: "https://pmkusum.mnre.gov.in",
    },
  ];

  const officialPortals = [
    {
      name_hi: "कृषि एवं किसान कल्याण मंत्रालय (भारत सरकार)",
      name_en: "Ministry of Agriculture & Farmers Welfare",
      url: "https://agricoop.gov.in",
      desc_hi:
        "नीतियों, दिशा-निर्देशों और केंद्रीय कृषि पहलों का मुख्य आधिकारिक पोर्टल।",
      desc_en:
        "Primary central ministry overseeing national agricultural policies, welfare schemes, and farmer guidelines.",
    },
    {
      name_hi: "भारतीय कृषि अनुसंधान परिषद (ICAR)",
      name_en: "Indian Council of Agricultural Research (ICAR)",
      url: "https://icar.org.in",
      desc_hi:
        "कृषि अनुसंधान, नई बीज किस्मों और वैज्ञानिक कृषि सलाह का शीर्ष संस्थान।",
      desc_en:
        "Apex organization for coordinating agricultural research, hybrid seed releases, and scientific farming advisories.",
    },
    {
      name_hi: "किसान पोर्टल (Farmer Portal of India)",
      name_en: "Farmer Portal of India",
      url: "https://farmer.gov.in",
      desc_hi:
        "बीज, उर्वरक, कृषि यंत्र, मौसम और बाजार भाव की एकीकृत सरकारी सूचना।",
      desc_en:
        "One-stop central access point for information on seeds, fertilizers, machinery, and mandi market rates.",
    },
    {
      name_hi: "भारत का राष्ट्रीय पोर्टल (India.gov.in)",
      name_en: "National Portal of India",
      url: "https://india.gov.in",
      desc_hi:
        "सभी केंद्रीय एवं राज्य सरकार की कृषि व नागरिक सेवाओं की आधिकारिक निर्देशिका।",
      desc_en:
        "Official single-window gateway to all central and state government services and initiatives.",
    },
  ];

  return (
    <div className="about-page-container">
      {/* Top Header Bar */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo-container">
            <img
              src={logoImg}
              alt="FarmHawk Logo"
              className="header-logo-img"
            />
          </div>

          <button className="header-nav-btn" onClick={onNavigateHome}>
            <Home size={18} />
            <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateCommunity}>
            <Users size={18} />
            <span>{isHindi ? "कृषि संवाद" : "Krishi Samvad"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateSurvey}>
            <BarChart3 size={18} />
            <span>{isHindi ? "सर्वे परिणाम" : "Survey Results"}</span>
          </button>

          <button
            className="header-nav-btn active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Info size={18} />
            <span>{isHindi ? "हमारे बारे में" : "About"}</span>
          </button>
        </div>

        <div className="header-right">
          <button onClick={onToggleLanguage} className="lang-toggle-btn">
            <Globe size={18} />
            <span>{isHindi ? "English" : "हिन्दी"}</span>
          </button>

          <button onClick={onLogout} className="logout-header-btn">
            <LogOut size={18} />
            <span>{isHindi ? "लॉगआउट" : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="about-main-content">
        {/* Hero Section */}
        <section className="about-hero-card">
          <img
            src={farmerImg}
            alt="Indian Farmer"
            className="about-hero-bg-img"
          />
          <div className="about-hero-overlay" />
          <div className="hero-content-wrapper">
            <div className="about-hero-badge">
              <ShieldCheck size={16} />
              <span>
                {isHindi
                  ? "विश्वसनीय कृषि तकनीक प्लेटफ़ॉर्म"
                  : "Trustworthy Agricultural Tech Platform"}
              </span>
            </div>

            <h1 className="about-hero-title">
              {isHindi ? "फार्महॉक के बारे में" : "About FarmHawk"}
            </h1>

            <p className="about-hero-subtitle">
              {isHindi
                ? "तकनीक, मौसम और समुदाय के माध्यम से किसानों को बेहतर व समय पर निर्णय लेने में सहायता।"
                : "Empowering farmers with practical field data, real-time weather observations, and peer agricultural knowledge."}
            </p>

            <div className="hero-highlights-row">
              <div className="hero-highlight-pill">
                <Check size={14} />
                <span>
                  {isHindi ? "100% नि:शुल्क व सरल" : "Simple & Farmer-Centric"}
                </span>
              </div>
              <div className="hero-highlight-pill">
                <Check size={14} />
                <span>
                  {isHindi
                    ? "सत्यापित मौसम व सलाह"
                    : "Verified Field Intelligence"}
                </span>
              </div>
              <div className="hero-highlight-pill">
                <Check size={14} />
                <span>
                  {isHindi ? "सक्रिय किसान समुदाय" : "Active Peer Community"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Topic Navigation Panel */}
        <nav className="about-topic-nav-panel" aria-label="Topic navigation">
          <div className="topic-nav-header">
            <Compass size={17} className="topic-compass-icon" />
            <span className="topic-nav-title">
              {isHindi ? "विषय अनुसार सीधे जाएं" : "Jump Directly to Topic"}
            </span>
          </div>

          <div className="topic-chips-wrapper">
            {topics.map((t) => (
              <button
                key={t.id}
                className={`topic-chip-btn ${activeTopic === t.id ? "active" : ""}`}
                onClick={() => scrollToTopic(t.id)}
              >
                {t.icon}
                <span>{isHindi ? t.label_hi : t.label_en}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Section 1: What is FarmHawk? */}
        <section id="what-is-farmhawk" className="about-section-card">
          <div className="section-header-block">
            <div className="section-icon-badge green">
              <Sprout size={24} />
            </div>
            <div>
              <h2 className="section-title-text">
                {isHindi ? "फार्महॉक क्या है?" : "What is FarmHawk?"}
              </h2>
              <span className="section-subtitle-text">
                {isHindi
                  ? "किसानों के लिए निर्मित एक व्यावहारिक, स्वतंत्र और विश्वसनीय कृषि मंच"
                  : "A practical, independent agricultural intelligence platform designed for farmers"}
              </span>
            </div>
          </div>

          <div className="about-overview-grid">
            <div className="overview-text-col">
              <p>
                {isHindi
                  ? "फार्महॉक (FarmHawk) एक आधुनिक एवं स्वतंत्र कृषि प्रौद्योगिकी प्लेटफ़ॉर्म है जिसका उद्देश्य किसानों को उनकी खेती के प्रबंधन, वास्तविक मौसम पूर्वानुमान, फसल स्वास्थ्य की निगरानी और किसान समुदाय से जुड़ने में व्यावहारिक सहायता प्रदान करना है।"
                  : "FarmHawk is an independent agricultural technology platform designed to bring useful farming information, climate intelligence, visual crop health monitoring, and peer collaboration together in one simple place."}
              </p>
              <p>
                {isHindi
                  ? "हम किसी भी प्रकार के अवास्तविक या अतिशयोक्तिपूर्ण दावे नहीं करते। फार्महॉक का उद्देश्य जटिल वैज्ञानिक मौसम डेटा और फसल जोखिम मॉडल्स को सरल, समझने योग्य और द्विभाषी (हिन्दी/English) भाषा में किसानों तक पहुंचाना है, जिससे वे अपनी सिंचाई, पोषण और फसल सुरक्षा से संबंधित निर्णय आत्मविश्वास से ले सकें।"
                  : "We believe in honest, practical technology. FarmHawk focuses on transforming complex meteorological data and agricultural risk models into clear, actionable insights so farmers can make well-timed decisions with confidence."}
              </p>
            </div>

            <div className="overview-points-col">
              <div className="point-card">
                <div className="point-icon green">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong>
                    {isHindi ? "सरल व व्यावहारिक उपयोग" : "Simple & Practical"}
                  </strong>
                  <p>
                    {isHindi
                      ? "बिना किसी जटिलता के हर किसान के लिए सुलभ।"
                      : "Built with clear interfaces suitable for everyday field use."}
                  </p>
                </div>
              </div>

              <div className="point-card">
                <div className="point-icon blue">
                  <CloudRain size={18} />
                </div>
                <div>
                  <strong>
                    {isHindi ? "सटीक खेत-स्तर मौसम" : "Hyperlocal Weather"}
                  </strong>
                  <p>
                    {isHindi
                      ? "आपके खेत के GPS निर्देशांकों पर आधारित मौसम डेटा।"
                      : "Accurate weather observations tailored to exact field coordinates."}
                  </p>
                </div>
              </div>

              <div className="point-card">
                <div className="point-icon purple">
                  <Users size={18} />
                </div>
                <div>
                  <strong>
                    {isHindi
                      ? "पारस्परिक किसान संवाद"
                      : "Farmer-to-Farmer Support"}
                  </strong>
                  <p>
                    {isHindi
                      ? "हजारों किसानों का सामूहिक ज्ञान और वास्तविक जमीनी नुस्खे।"
                      : "Shared peer knowledge and practical field experiences."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: What We Do (Features Grid) */}
        <section id="how-helps" className="about-section-card">
          <div className="section-header-block">
            <div className="section-icon-badge blue">
              <Building size={24} />
            </div>
            <div>
              <h2 className="section-title-text">
                {isHindi
                  ? "फार्महॉक किसानों की कैसे मदद करता है"
                  : "How FarmHawk Helps Farmers"}
              </h2>
              <span className="section-subtitle-text">
                {isHindi
                  ? "प्लेटफ़ॉर्म में उपलब्ध वास्तविक सुविधाएं और क्षमताएं"
                  : "Genuine capabilities implemented across the FarmHawk application"}
              </span>
            </div>
          </div>

          <div className="about-features-grid">
            {featuresList.map((item) => (
              <div key={item.id} className="about-feature-card">
                <div className="feat-card-top">
                  <div
                    className="feat-icon-wrapper"
                    style={{
                      color: item.accent,
                      backgroundColor: `${item.accent}12`,
                      borderColor: `${item.accent}30`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="feat-tag-chip">
                    {isHindi ? item.tag_hi : item.tag_en}
                  </span>
                </div>

                <h3 className="feat-title">
                  {isHindi ? item.title_hi : item.title_en}
                </h3>
                <p className="feat-desc">
                  {isHindi ? item.desc_hi : item.desc_en}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: How FarmHawk Works (Process Flow) */}
        <section id="how-it-works" className="about-section-card">
          <div className="section-header-block">
            <div className="section-icon-badge orange">
              <Target size={24} />
            </div>
            <div>
              <h2 className="section-title-text">
                {isHindi ? "फार्महॉक कैसे कार्य करता है" : "How FarmHawk Works"}
              </h2>
              <span className="section-subtitle-text">
                {isHindi
                  ? "खेत के डेटा से लेकर व्यावहारिक सलाह तक की 5-चरणीय प्रक्रिया"
                  : "The step-by-step intelligence workflow for your farm and community"}
              </span>
            </div>
          </div>

          <div className="workflow-container">
            <div className="workflow-block-header">
              <span className="workflow-badge green">
                {isHindi ? "प्रक्रिया १" : "Workflow 1"}
              </span>
              <h4 className="workflow-title">
                {isHindi
                  ? "खेत विश्लेषण प्रक्रिया (Field Intelligence Flow)"
                  : "Field Intelligence Workflow"}
              </h4>
            </div>

            <div className="workflow-steps-row">
              <div className="workflow-step-box">
                <div className="step-num">1</div>
                <strong className="step-name">
                  {isHindi ? "आपका खेत" : "Your Field"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "पंजीकृत खेत प्रोफाइल"
                    : "Registered Field Profile"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">2</div>
                <strong className="step-name">
                  {isHindi ? "खेत का डेटा" : "Farm Data"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "फसल, मिट्टी, बुआई तिथि व GPS"
                    : "Crop, Soil, Sowing Date & GPS"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">3</div>
                <strong className="step-name">
                  {isHindi ? "मौसम व निगरानी" : "Weather & Vision"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "वास्तविक मौसम व अवलोकन"
                    : "Real Weather & Observations"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">4</div>
                <strong className="step-name">
                  {isHindi ? "फार्महॉक विश्लेषण" : "FarmHawk Engine"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "जोखिम व लक्षण मूल्यांकन"
                    : "Risk & Symptom Evaluation"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box highlight">
                <div className="step-num highlight">5</div>
                <strong className="step-name">
                  {isHindi ? "उपयोगी सलाह" : "Actionable Advice"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "स्पष्ट सिफारिशें व SMS अलर्ट"
                    : "Clear Advisories & SMS Alerts"}
                </span>
              </div>
            </div>

            <div
              className="workflow-block-header"
              style={{ marginTop: "28px" }}
            >
              <span className="workflow-badge blue">
                {isHindi ? "प्रक्रिया २" : "Workflow 2"}
              </span>
              <h4 className="workflow-title">
                {isHindi
                  ? "कृषि संवाद समुदाय प्रक्रिया (Krishi Samvad Community Flow)"
                  : "Krishi Samvad Community Workflow"}
              </h4>
            </div>

            <div className="workflow-steps-row">
              <div className="workflow-step-box">
                <div className="step-num">1</div>
                <strong className="step-name">
                  {isHindi ? "किसान समस्या" : "Farmer Problem"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "फसल या कीट का सवाल"
                    : "Crop issue or symptom posted"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">2</div>
                <strong className="step-name">
                  {isHindi ? "समुदाय चर्चा" : "Community Discussion"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "क्षेत्रीय किसानों की प्रतिक्रिया"
                    : "Responses from local peers"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">3</div>
                <strong className="step-name">
                  {isHindi ? "किसान अनुभव" : "Shared Experience"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "वास्तविक जमीनी नुस्खे"
                    : "Practical real-world trials"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box">
                <div className="step-num">4</div>
                <strong className="step-name">
                  {isHindi ? "विशेषज्ञ परामर्श" : "Expert Insights"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "प्रमाणित विशेषज्ञों की राय"
                    : "Guidance from verified agronomists"}
                </span>
              </div>
              <div className="workflow-arrow">→</div>

              <div className="workflow-step-box highlight">
                <div className="step-num highlight">5</div>
                <strong className="step-name">
                  {isHindi ? "व्यावहारिक समाधान" : "Effective Solution"}
                </strong>
                <span className="step-desc">
                  {isHindi
                    ? "फसल सुरक्षा व बेहतर उपज"
                    : "Crop protection & better care"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Krishi Samvad Dedicated Showcase */}
        <section
          id="krishi-samvad"
          className="about-section-card samvad-highlight-card"
        >
          <div className="samvad-header-row">
            <div>
              <span className="samvad-tag">
                {isHindi ? "किसान-से-किसान संवाद" : "Farmer Peer Network"}
              </span>
              <h2 className="samvad-main-heading">
                {isHindi ? "कृषि संवाद (Krishi Samvad)" : "Krishi Samvad"}
              </h2>
              <p className="samvad-tagline">
                {isHindi
                  ? "“किसानों की बात, किसानों के साथ।”"
                  : "“Farmer-to-Farmer Dialogue, Knowledge & Solutions.”"}
              </p>
            </div>

            <button onClick={onNavigateCommunity} className="btn-samvad-cta">
              <Users size={18} />
              <span>
                {isHindi ? "कृषि संवाद पर जाएं" : "Go to Krishi Samvad"}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="samvad-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon">
                <MessageSquare size={20} />
              </div>
              <div>
                <strong>
                  {isHindi
                    ? "सवाल पूछें व फोटो साझा करें"
                    : "Ask Questions & Share Photos"}
                </strong>
                <p>
                  {isHindi
                    ? "फसल में लगे कीट या बीमारी की तस्वीर खींचकर सवाल पूछें और साथी किसानों से तुरंत सुझाव पाएं।"
                    : "Post clear photos of crop concerns to get prompt advice and remedies from experienced farmers."}
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon">
                <Sprout size={20} />
              </div>
              <div>
                <strong>
                  {isHindi
                    ? "क्षेत्रीय व फसल अनुसार वर्गीकरण"
                    : "Category & Regional Filtering"}
                </strong>
                <p>
                  {isHindi
                    ? "गेहूं, धान, कपास, सब्जी, जैविक खेती और अपने राज्य के अनुसार चर्चाएं खोजें।"
                    : "Filter discussions by wheat, paddy, cotton, vegetables, organic farming, and state."}
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon">
                <Award size={20} />
              </div>
              <div>
                <strong>
                  {isHindi
                    ? "प्रमाणित विशेषज्ञ व प्रतिष्ठा प्रणाली"
                    : "Verified Experts & Reputation"}
                </strong>
                <p>
                  {isHindi
                    ? "सक्रिय और मददगार किसानों को प्रतिष्ठा अंक व कृषि विशेषज्ञों को विशेष बैज मिलते हैं।"
                    : "Helpful contributors earn reputation points, and verified experts receive special badges."}
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon">
                <TrendingUp size={20} />
              </div>
              <div>
                <strong>
                  {isHindi
                    ? "दैनिक क्षेत्रीय व राष्ट्रीय समाचार"
                    : "Daily Agricultural News"}
                </strong>
                <p>
                  {isHindi
                    ? "कृषि संवाद साइडबार में रोजाना सत्यापित कृषि समाचार, मंडी भाव व सरकारी एडवाइजरी अपडेट होती हैं।"
                    : "Stay up-to-date with verified daily agricultural advisories, mandi rates, and policy updates."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Government Schemes & Policies */}
        <section id="gov-schemes" className="about-section-card">
          <div className="section-header-block">
            <div className="section-icon-badge green">
              <Landmark size={24} />
            </div>
            <div>
              <h2 className="section-title-text">
                {isHindi
                  ? "सरकारी योजनाएं और नीतियां"
                  : "Government Schemes & Policies"}
              </h2>
              <span className="section-subtitle-text">
                {isHindi
                  ? "किसानों के कल्याण हेतु प्रमुख राष्ट्रीय योजनाएं, वित्तीय सहायता एवं नीतियां"
                  : "Key national agricultural initiatives, subsidies, insurance, and welfare schemes"}
              </span>
            </div>
          </div>

          <div className="gov-schemes-grid">
            {govSchemes.map((scheme) => (
              <div key={scheme.id} className="gov-scheme-card">
                <div className="scheme-card-header">
                  <span className="scheme-category-badge">
                    {isHindi ? scheme.category_hi : scheme.category_en}
                  </span>
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="scheme-ext-link"
                    title={
                      isHindi
                        ? "आधिकारिक वेबसाइट पर देखें"
                        : "Open official portal"
                    }
                  >
                    <span>
                      {isHindi ? "आधिकारिक पोर्टल" : "Official Portal"}
                    </span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <h3 className="scheme-title">
                  {isHindi ? scheme.title_hi : scheme.title_en}
                </h3>
                <p className="scheme-desc">
                  {isHindi ? scheme.desc_hi : scheme.desc_en}
                </p>
              </div>
            ))}
          </div>

          {/* Section 6: Official Government Resources & Disclaimer */}
          <div id="gov-resources" className="gov-resources-subblock">
            <h3 className="resources-heading">
              <Building size={20} />
              <span>
                {isHindi
                  ? "आधिकारिक सरकारी संसाधन (Official Government Resources)"
                  : "Official Government Resources"}
              </span>
            </h3>

            <div className="official-links-list">
              {officialPortals.map((portal, idx) => (
                <a
                  key={idx}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="official-link-row"
                >
                  <div className="link-info-col">
                    <strong className="link-name">
                      {isHindi ? portal.name_hi : portal.name_en}
                    </strong>
                    <span className="link-desc">
                      {isHindi ? portal.desc_hi : portal.desc_en}
                    </span>
                    <span className="link-url-text">{portal.url}</span>
                  </div>
                  <div className="link-action-btn">
                    <span>{isHindi ? "पोर्टल खोलें" : "Visit Portal"}</span>
                    <ExternalLink size={14} />
                  </div>
                </a>
              ))}
            </div>

            {/* Prominent but Clean Disclaimer */}
            <div className="gov-disclaimer-box">
              <AlertCircle size={24} className="disclaimer-icon" />
              <div className="disclaimer-text">
                <strong>
                  {isHindi
                    ? "सरकारी जानकारी अस्वीकरण (Disclaimer):"
                    : "Government Information Disclaimer:"}
                </strong>
                <p>
                  {isHindi
                    ? "फार्महॉक एक स्वतंत्र कृषि प्रौद्योगिकी प्लेटफ़ॉर्म है और भारत सरकार की आधिकारिक वेबसाइट नहीं है। सरकारी जानकारी केवल किसानों की जागरूकता एवं सूचनात्मक उद्देश्य से संकलित की गई है। किसी भी योजना के लिए आवेदन करने, पात्रता नियमों और अंतिम तिथियों की पुष्टि हेतु हमेशा संबंधित आधिकारिक सरकारी पोर्टल से जानकारी सत्यापित करें।"
                    : "FarmHawk is an independent agricultural technology platform and is not an official Government of India website. Government information is provided for informational and awareness purposes only. Farmers should verify specific eligibility criteria, application deadlines, and guidelines directly through the respective official government portals."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Trust & Transparency */}
        <section id="trust-transparency" className="about-section-card">
          <div className="section-header-block">
            <div className="section-icon-badge purple">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="section-title-text">
                {isHindi ? "विश्वास और पारदर्शिता" : "Trust & Transparency"}
              </h2>
              <span className="section-subtitle-text">
                {isHindi
                  ? "फार्महॉक के मार्गदर्शक सिद्धांत, डेटा सुरक्षा और स्पष्ट सीमाएं"
                  : "Our core principles, data privacy protections, and honest operating boundaries"}
              </span>
            </div>
          </div>

          <div className="trust-points-grid">
            <div className="trust-card">
              <div className="trust-number">1</div>
              <div>
                <strong>
                  {isHindi
                    ? "स्वतंत्र प्रौद्योगिकी मंच"
                    : "Independent Platform"}
                </strong>
                <p>
                  {isHindi
                    ? "फार्महॉक एक स्वतंत्र कृषि सॉफ्टवेयर है। यह किसी भी सरकारी विभाग का हिस्सा नहीं है।"
                    : "FarmHawk is an independent agricultural software platform and is not owned by any government department."}
                </p>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-number">2</div>
              <div>
                <strong>
                  {isHindi
                    ? "सरकारी जानकारी की पुष्टि"
                    : "Official Verification"}
                </strong>
                <p>
                  {isHindi
                    ? "सरकारी योजनाओं की अंतिम पात्रता के लिए हमेशा संबंधित आधिकारिक सरकारी वेबसाइटों से पुष्टि करें।"
                    : "Always verify official scheme eligibility and guidelines directly on official government websites."}
                </p>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-number">3</div>
              <div>
                <strong>
                  {isHindi
                    ? "AI / विज़न सहायक अवलोकन है"
                    : "AI Observational Support"}
                </strong>
                <p>
                  {isHindi
                    ? "कंप्यूटर विज़न परिणाम केवल प्रारंभिक अवलोकन हैं। अंतिम निर्णय लेने से पहले स्थानीय कृषि विशेषज्ञ से परामर्श लें।"
                    : "AI and vision detections provide assistive observations and are not absolute laboratory diagnoses."}
                </p>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-number">4</div>
              <div>
                <strong>
                  {isHindi
                    ? "समुदाय सामग्री सहकर्मी-साझा है"
                    : "Peer-Generated Content"}
                </strong>
                <p>
                  {isHindi
                    ? "कृषि संवाद में दी गई सलाह साथी किसानों के अनुभवों पर आधारित होती है, जब तक कि वह प्रमाणित विशेषज्ञ द्वारा न दी गई हो।"
                    : "Community responses reflect fellow farmers' experiences unless explicitly marked by a verified agronomist."}
                </p>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-number">5</div>
              <div>
                <strong>
                  {isHindi
                    ? "गोपनीयता व डेटा सुरक्षा"
                    : "Privacy & Farm Data Protection"}
                </strong>
                <p>
                  {isHindi
                    ? "आपके खेत के सटीक GPS निर्देशांक और निजी संपर्क विवरण पूरी तरह सुरक्षित रहते हैं और सार्वजनिक नहीं किए जाते।"
                    : "Your private field GPS coordinates and personal contact details remain protected and are never shared publicly."}
                </p>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-number">6</div>
              <div>
                <strong>
                  {isHindi
                    ? "कोई अवास्तविक गारंटी नहीं"
                    : "No Unrealistic Guarantees"}
                </strong>
                <p>
                  {isHindi
                    ? "फार्महॉक फसल उपज, रोग निवारण या वित्तीय लाभ का भ्रामक दावा नहीं करता। हमारा लक्ष्य केवल निर्णय सहायता है।"
                    : "FarmHawk does not make exaggerated promises regarding crop yield or profit. Our objective is practical decision support."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Our Mission */}
        <section id="mission" className="about-mission-card">
          <div className="mission-content-box">
            <div className="mission-heart-badge">
              <HeartHandshake size={30} />
            </div>
            <h2 className="mission-title">
              {isHindi ? "हमारा उद्देश्य" : "Our Mission"}
            </h2>
            <p className="mission-quote">
              {isHindi
                ? "“उपयोगी कृषि तकनीक और विश्वसनीय कृषि जानकारी को हर किसान तक सरल, सुलभ और व्यावहारिक तरीके से पहुंचाना।”"
                : "“To make useful agricultural technology and reliable farming information accessible, actionable, and transparent for every farmer.”"}
            </p>
            <div className="mission-brand-sign">
              <strong>FarmHawk Platform</strong> •{" "}
              <span>
                {isHindi
                  ? "किसानों की सेवा व प्रगति के लिए समर्पित"
                  : "Dedicated to Farmer Empowerment & Agriculture Tech"}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
