import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Info,
  Globe,
  LogOut,
  BarChart3,
  ClipboardList,
  Eye,
  Target,
  Star,
  MessageCircle,
  AlertTriangle,
  Quote,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import logoImg from "../assets/logo.png";
import "../styles/SurveyInsightsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SURVEY_URL = import.meta.env.VITE_SURVEY_URL || "http://localhost:5174";

const CHART_COLORS = [
  "#15803d",
  "#22c55e",
  "#86efac",
  "#34d399",
  "#059669",
  "#10b981",
  "#047857",
  "#a7f3d0",
  "#6ee7b7",
  "#bbf7d0",
];

const BAR_GREEN = "#15803d";

// Master category definitions for complete survey options
const MASTER_CATEGORIES = {
  late_discovery_frequency: [
    "Rarely (शायद ही कभी)",
    "Sometimes (कभी-कभी)",
    "Frequently — In certain critical months (काफी बार — संवेदनशील महीनों में)",
    "Very Frequently (बहुत बार)",
    "Almost Always (लगभग हमेशा)",
  ],
  valuable_features: [
    "AI camera detection of leaf diseases & insect pests (कैमरे द्वारा पत्तियों की बीमारी और कीटों की पहचान)",
    "Hyperlocal live weather forecast & rain probability (आपके क्षेत्र के अनुसार सटीक मौसम पूर्वानुमान और बारिश की संभावना)",
    "Scientifically approved chemical remedies & dosage advice (वैज्ञानिक रूप से प्रमाणित दवा और सही खुराक की सलाह)",
    "Drone survey & GPS-based affected area mapping (ड्रोन सर्वे और GPS आधारित प्रभावित क्षेत्र की मैपिंग)",
    "Krishi Samvad (कृषि संवाद)",
    "Government schemes & subsidies information (सरकारी योजनाओं और सब्सिडी की जानकारी)",
  ],
  krishi_samvad_usefulness: [
    "Not Useful (उपयोगी नहीं)",
    "Slightly Useful (थोड़ा उपयोगी)",
    "Moderately Useful (मध्यम उपयोगी)",
    "Very Useful (बहुत उपयोगी)",
    "Highly Useful — Needed for transparent, unbiased advice (अत्यंत उपयोगी — पारदर्शी और निष्पक्ष सलाह के लिए आवश्यक)",
  ],
  adoption_concerns: [
    "Complex English interface / lack of tech skills (जटिल अंग्रेजी इंटरफेस / तकनीकी ज्ञान की कमी)",
    "Cost of technology (तकनीक की लागत)",
    "Doubt about whether aerial AI detection is really accurate (संदेह कि क्या हवाई AI पहचान वास्तव में सटीक है)",
    "Privacy / data concerns (गोपनीयता / डेटा संबंधी चिंताएं)",
    "Difficulty operating drones or devices (ड्रोन या उपकरणों को चलाने में कठिनाई)",
    "Lack of local technical support (स्थानीय तकनीकी सहायता की कमी)",
  ],
};

const buildCategoryChartData = (apiList = [], masterList = [], getLabelFunc) => {
  const result = [];
  const matchedApiIndices = new Set();

  masterList.forEach((masterOpt) => {
    const masterEn = masterOpt.split("(")[0].trim().toLowerCase();
    let count = 0;
    (apiList || []).forEach((item, idx) => {
      if (!item || !item.name) return;
      const itemEn = String(item.name).split("(")[0].trim().toLowerCase();
      if (itemEn === masterEn || String(item.name).trim() === masterOpt.trim()) {
        count += Number(item.value || 0);
        matchedApiIndices.add(idx);
      }
    });

    result.push({
      name: getLabelFunc(masterOpt),
      rawName: masterOpt,
      count: Number(count),
    });
  });

  (apiList || []).forEach((item, idx) => {
    if (!matchedApiIndices.has(idx) && item && item.name) {
      result.push({
        name: getLabelFunc(item.name),
        rawName: item.name,
        count: Number(item.value || 0),
      });
    }
  });

  return result;
};

const buildRatingChartData = (apiList = []) => {
  return [1, 2, 3, 4, 5].map((num) => {
    const strNum = String(num);
    let count = 0;
    (apiList || []).forEach((item) => {
      if (!item || item.name == null) return;
      const itemNameStr = String(item.name).trim();
      if (
        itemNameStr === strNum ||
        itemNameStr.startsWith(strNum) ||
        itemNameStr === `★ ${strNum}`
      ) {
        count += Number(item.value || 0);
      }
    });

    return {
      rating: strNum,
      name: strNum,
      count: Number(count),
    };
  });
};

export default function SurveyInsightsPage({
  onNavigateHome,
  onNavigateCommunity,
  onNavigateAbout,
  language = "hi",
  onToggleLanguage,
  onLogout,
}) {
  const isHindi = language === "hi";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/survey/stats`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching survey stats:", err);
      setError(
        isHindi
          ? "सर्वेक्षण आंकड़े लोड करने में असमर्थ। कृपया बाद में प्रयास करें।"
          : "Unable to load survey statistics. Please try again later."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);

    // Auto-update stats in real-time when user switches back to this tab after completing survey
    const onFocus = () => fetchStats(false);
    window.addEventListener("focus", onFocus);

    // Live background polling every 10 seconds
    const intervalTimer = setInterval(() => fetchStats(false), 10000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalTimer);
    };
  }, [isHindi]);

  // Helper to extract bilingual labels if text contains parenthetical Hindi (e.g. "Wheat (गेहूं)")
  const getLabel = (nameStr) => {
    if (!nameStr) return "";
    if (nameStr.includes("(") && nameStr.includes(")")) {
      const parts = nameStr.split("(");
      const enPart = parts[0].trim();
      const hiPart = parts[1].replace(")", "").trim();
      return isHindi ? hiPart || enPart : enPart || hiPart;
    }
    return nameStr;
  };

  const totalResponses = stats ? stats.total_responses : 0;
  const avgRating = stats ? Number(stats.average_early_warning_rating || 0).toFixed(2) : "0";

  // Calculate percentage for Early Detection
  const earlyDetectionUsefulPercent = (() => {
    if (!stats || !stats.early_warning_ratings || totalResponses === 0) return 0;
    const count4or5 = stats.early_warning_ratings
      .filter((r) => r.name === "4" || r.name === "5")
      .reduce((sum, r) => sum + r.value, 0);
    return Math.round((count4or5 / totalResponses) * 100);
  })();

  // Calculate percentage for Drone Spraying
  const droneSprayingValuablePercent = (() => {
    if (!stats || !stats.drone_spraying_value || totalResponses === 0) return 0;
    const countValuable = stats.drone_spraying_value
      .filter(
        (r) =>
          r.name === "4" ||
          r.name === "5" ||
          r.name.toLowerCase().includes("valuable")
      )
      .reduce((sum, r) => sum + r.value, 0);
    return Math.round((countValuable / totalResponses) * 100);
  })();

  // Top concern
  const topConcernText = (() => {
    if (!stats || !stats.adoption_concerns || stats.adoption_concerns.length === 0) {
      return isHindi ? "कोई डेटा नहीं" : "No Data";
    }
    const sorted = [...stats.adoption_concerns].sort((a, b) => b.value - a.value);
    return getLabel(sorted[0].name);
  })();

  return (
    <div className="survey-page">
      {/* ===== Top Header Bar ===== */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo-container">
            <img src={logoImg} alt="FarmHawk Logo" className="header-logo-img" />
          </div>

          <button className="header-nav-btn" onClick={onNavigateHome}>
            <Home size={18} />
            <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateCommunity}>
            <Users size={18} />
            <span>{isHindi ? "कृषि संवाद" : "Krishi Samvad"}</span>
          </button>

          <button
            className="header-nav-btn active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <BarChart3 size={18} />
            <span>{isHindi ? "सर्वे परिणाम" : "Survey Results"}</span>
          </button>

          <button className="header-nav-btn" onClick={onNavigateAbout}>
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

      {/* ===== Hero Section ===== */}
      <section className="survey-hero-section">
        <div className="survey-hero-badge">
          <ClipboardList size={16} />
          <span>
            {isHindi
              ? "FarmHawk स्मार्ट खेती सर्वेक्षण"
              : "FarmHawk Smart Farming Survey"}
          </span>
        </div>

        <h1 className="survey-hero-title">
          {isHindi ? "सर्वे परिणाम" : "Survey Results"}
        </h1>

        <p className="survey-hero-subtitle">
          {isHindi
            ? "FarmHawk स्मार्ट खेती एवं फसल स्वास्थ्य सर्वेक्षण से प्राप्त वास्तविक किसान प्रतिक्रियाएँ।"
            : "Real farmer insights collected through the FarmHawk Smart Farming & Crop Health Survey."}
        </p>

        <div className="survey-hero-actions">
          <div className="survey-response-count">
            <span>{isHindi ? "कुल प्रतिक्रियाएँ:" : "Total Responses:"}</span>
            <span className="count-number">{totalResponses}</span>
            <button
              onClick={() => fetchStats(true)}
              className="survey-refresh-icon-btn"
              title={isHindi ? "आंकड़े ताज़ा करें" : "Refresh survey statistics"}
              style={{
                background: "transparent",
                border: "none",
                color: "#86efac",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "8px",
                padding: "2px",
              }}
            >
              <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            </button>
          </div>

          <a
            href="http://localhost:5174"
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="take-survey-btn"
          >
            <ExternalLink size={18} />
            <span>{isHindi ? "सर्वे में भाग लें" : "Take the Survey"}</span>
          </a>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <main className="survey-main-content">
        {/* Loading State */}
        {loading && (
          <div className="survey-loading-card">
            <div className="survey-spinner"></div>
            <p>
              {isHindi
                ? "सर्वेक्षण आंकड़े लोड हो रहे हैं..."
                : "Loading survey statistics..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="survey-error-card">
            <AlertTriangle size={36} color="#dc2626" />
            <h3>{isHindi ? "डेटा लोड करने में त्रुटि" : "Error Loading Data"}</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && totalResponses === 0 && (
          <div className="survey-empty-card">
            <ClipboardList size={48} color="#15803d" />
            <h3>
              {isHindi
                ? "अभी तक कोई सर्वेक्षण उत्तर प्राप्त नहीं हुआ है।"
                : "No survey responses yet."}
            </h3>
            <p>
              {isHindi
                ? "जैसे ही किसान सर्वेक्षण पूरा करेंगे, वास्तविक आंकड़े और चार्ट यहाँ प्रदर्शित होंगे।"
                : "As soon as farmers complete the survey, real statistics and charts will appear here."}
            </p>
          </div>
        )}

        {/* Real Data Render View */}
        {!loading && !error && totalResponses > 0 && (
          <>
            {/* Overview Summary Cards */}
            <div className="survey-summary-grid">
              <div className="survey-summary-card">
                <div className="card-icon-wrap">
                  <ClipboardList size={20} />
                </div>
                <span className="card-label">
                  {isHindi ? "कुल प्रतिक्रियाएँ" : "Total Responses"}
                </span>
                <span className="card-value">{totalResponses}</span>
              </div>

              <div className="survey-summary-card">
                <div className="card-icon-wrap">
                  <Eye size={20} />
                </div>
                <span className="card-label">
                  {isHindi ? "प्रारंभिक पहचान" : "Early Detection"}
                </span>
                <span className="card-value">
                  {earlyDetectionUsefulPercent}%
                </span>
                <span className="card-detail">
                  {isHindi ? "बहुत उपयोगी मानते हैं" : "rated it very useful"}
                </span>
              </div>

              <div className="survey-summary-card">
                <div className="card-icon-wrap">
                  <Target size={20} />
                </div>
                <span className="card-label">
                  {isHindi ? "ड्रोन छिड़काव" : "Drone Spraying"}
                </span>
                <span className="card-value">
                  {droneSprayingValuablePercent}%
                </span>
                <span className="card-detail">
                  {isHindi
                    ? "अत्यधिक मूल्यवान मानते हैं"
                    : "rated it highly valuable"}
                </span>
              </div>

              <div className="survey-summary-card">
                <div className="card-icon-wrap">
                  <AlertTriangle size={20} />
                </div>
                <span className="card-label">
                  {isHindi ? "शीर्ष चिंता" : "Top Concern"}
                </span>
                <span className="card-value" style={{ fontSize: "16px" }}>
                  {topConcernText}
                </span>
              </div>
            </div>

            {/* Section Title */}
            <div className="survey-section-title">
              <div className="section-icon-badge">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2>{isHindi ? "सर्वे विश्लेषण" : "Survey Analysis"}</h2>
                <p className="section-subtitle">
                  {isHindi
                    ? "किसानों की वास्तविक प्रतिक्रियाओं का चार्ट विश्लेषण"
                    : "Visual analysis of real farmer responses"}
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="survey-chart-grid">
              {/* Crop Profile — Donut Chart */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi ? "उगाई जाने वाली फसलें" : "Crops Grown"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "सर्वे में भाग लेने वाले किसानों की फसल प्रोफ़ाइल"
                    : "Crop profile of surveyed farmers"}
                </p>
                <div className="survey-chart-container pie-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(stats.crop_distribution || []).map((c) => ({
                          name: getLabel(c.name),
                          value: Number(c.value || 0),
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={105}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {(stats.crop_distribution || []).map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Late Disease Discovery — Bar Chart */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi
                    ? "बीमारी और कीटों की देर से पहचान"
                    : "Late Disease & Pest Discovery"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "कितनी बार किसान देर से रोग/कीट पहचान पाते हैं"
                    : "How often farmers discover diseases/pests late"}
                </p>
                <div className="survey-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildCategoryChartData(
                        stats.late_discovery_frequency,
                        MASTER_CATEGORIES.late_discovery_frequency,
                        getLabel
                      )}
                      margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill={BAR_GREEN}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Early Warning Usefulness — Bar Chart */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi
                    ? "प्रारंभिक चेतावनी की उपयोगिता"
                    : "Usefulness of Early Warning Alerts"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "1 (कम उपयोगी) से 5 (बहुत उपयोगी) तक रेटिंग"
                    : "Rating from 1 (least useful) to 5 (most useful)"}
                </p>
                <div className="survey-avg-rating">
                  <Star size={18} />
                  <span>
                    {isHindi ? "औसत रेटिंग:" : "Average Rating:"}
                  </span>
                  <span className="rating-value">{avgRating} / 5</span>
                </div>
                <div className="survey-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildRatingChartData(stats.early_warning_ratings)}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
                      <YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Drone Spraying Value — Bar Chart */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi
                    ? "ड्रोन द्वारा लक्षित छिड़काव का मूल्य"
                    : "Value of Targeted Drone Spraying"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "ड्रोन-आधारित लक्षित छिड़काव पर किसानों की राय (1 से 5 रेटिंग)"
                    : "Farmer responses on drone-based targeted spraying (1 to 5 rating)"}
                </p>
                <div className="survey-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildRatingChartData(stats.drone_spraying_value)}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
                      <YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Most Valuable Features — Horizontal Bar */}
              <div className="survey-chart-card full-width">
                <h3 className="chart-title">
                  {isHindi
                    ? "FarmHawk की सबसे उपयोगी सुविधाएँ"
                    : "Most Valuable FarmHawk Features"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "किसानों द्वारा चुनी गई शीर्ष सुविधाएँ"
                    : "Features selected by farmers as most valuable"}
                </p>
                <div className="survey-chart-container" style={{ height: "340px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={buildCategoryChartData(
                        stats.valuable_features,
                        MASTER_CATEGORIES.valuable_features,
                        getLabel
                      )}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={220}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill={BAR_GREEN}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Krishi Samvad Usefulness */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi
                    ? "कृषि संवाद की उपयोगिता"
                    : "Krishi Samvad Usefulness"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "समुदाय मंच की उपयोगिता पर किसानों की राय"
                    : "Farmer opinions on community forum usefulness"}
                </p>
                <div className="survey-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildCategoryChartData(
                        stats.krishi_samvad_usefulness,
                        MASTER_CATEGORIES.krishi_samvad_usefulness,
                        getLabel
                      )}
                      margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Preferred Alert Method — Donut */}
              <div className="survey-chart-card">
                <h3 className="chart-title">
                  {isHindi ? "पसंदीदा अलर्ट माध्यम" : "Preferred Alert Method"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "किसान अलर्ट कैसे प्राप्त करना पसंद करते हैं"
                    : "How farmers prefer to receive alerts"}
                </p>
                <div className="survey-chart-container pie-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(stats.preferred_alert_method || []).map((a) => ({
                          name: getLabel(a.name),
                          value: Number(a.value || 0),
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {(stats.preferred_alert_method || []).map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI & Drone Adoption Concerns — Horizontal Bar */}
              <div className="survey-chart-card full-width">
                <h3 className="chart-title">
                  {isHindi
                    ? "AI और ड्रोन अपनाने की चिंताएँ"
                    : "AI & Drone Adoption Concerns"}
                </h3>
                <p className="chart-subtitle">
                  {isHindi
                    ? "किसानों की प्रमुख चिंताएँ जो तकनीक अपनाने में बाधा हैं"
                    : "Key concerns preventing farmers from adopting technology"}
                </p>
                <div className="survey-chart-container" style={{ height: "340px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={buildCategoryChartData(
                        stats.adoption_concerns,
                        MASTER_CATEGORIES.adoption_concerns,
                        getLabel
                      )}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={220}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#047857"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ===== Farmers' Voice ===== */}
            <div className="survey-farmer-voice">
              <div
                className="survey-section-title"
                style={{ marginBottom: "12px" }}
              >
                <div className="section-icon-badge">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h2>{isHindi ? "किसानों की आवाज़" : "Farmers' Voice"}</h2>
                </div>
              </div>

              <p className="voice-question">
                {isHindi
                  ? "प्रश्न: खेती में सबसे बड़ी समस्या क्या है जिसे आप चाहते हैं कि तकनीक हल करे? (Q: What is the biggest problem in farming that you want technology to solve?)"
                  : "Q: What is the biggest problem in farming that you want technology to solve? (प्रश्न: खेती में सबसे बड़ी समस्या क्या है जिसे आप चाहते हैं कि तकनीक हल करे?)"}
              </p>

              <div className="survey-response-cards">
                {(stats.farmer_responses && stats.farmer_responses.length > 0
                  ? stats.farmer_responses
                  : []
                ).map((voice, idx) => (
                  <div key={idx} className="survey-response-card">
                    <div className="quote-icon">
                      <Quote size={16} />
                    </div>
                    <div>
                      <div className="quote-text">"{voice.response}"</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="survey-demo-notice live-notice">
                <CheckCircle2 size={14} />
                <span>
                  {isHindi
                    ? "लाइव डेटाबेस से जुड़े वास्तविक सर्वेक्षण परिणाम।"
                    : "Live survey statistics connected to backend database."}
                </span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
