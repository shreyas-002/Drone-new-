import React, { useState, useEffect } from "react";
import {
  Home,
  Globe,
  LogOut,
  ArrowLeft,
  User,
  Sprout,
  MapPin,
  Calendar,
  Layers,
  Droplet,
  Thermometer,
  CloudRain,
  Wind,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
  Flame,
  MessageSquare,
  Send,
  PhoneCall,
  Bell,
  Smartphone,
  MessageCircle,
  Users,
  Edit3,
  Trash2,
  Info,
  Video,
  BarChart3,
  Sparkles,
} from "lucide-react";
import logoImg from "../assets/logo.png";
import FieldMap from "../components/FieldMap";
import EditFieldModal from "../components/EditFieldModal";
import LiveFeedView from "../components/LiveFeedView";
import { translateProfileText } from "../utils/transliterate";
import {
  getFarmerFieldsApi,
  getFieldDetailsApi,
  getFieldWeatherApi,
  getFieldAdviceApi,
  getFieldDetectionsApi,
  clearFieldDetectionsApi,
  getFarmerNotificationsApi,
  sendTestNotificationApi,
  updateFarmerPhoneApi,
  triggerClimateCheckApi,
  simulateClimateShockApi,
  sendNotificationSmsApi,
  updateFieldApi,
  deleteFieldApi,
} from "../services/api";
import "../styles/SelectedFieldPage.css";

export default function SelectedFieldPage({
  fieldId: initialFieldId,
  onBack,
  language = "hi",
  onToggleLanguage,
  onLogout,
  farmerName = "Farmer",
  initialTab = "data",
  onNavigateTab,
}) {
  const isHindi = language === "hi";

  // Selected Field ID
  const [currentFieldId, setCurrentFieldId] = useState(initialFieldId);

  // Registered Fields List for Dropdown Selector
  const [allFields, setAllFields] = useState([]);

  // Active Sub-Topic Tab: 'data' | 'advice'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Field Data
  const [field, setField] = useState(null);
  const [loadingField, setLoadingField] = useState(true);
  const [errorField, setErrorField] = useState("");

  // Weather & Forecast Data
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // Evidence-based Crop Advice & Risk Engine Data
  const [adviceData, setAdviceData] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Notifications State & Farmer Phone
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [editingPhone, setEditingPhone] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [isCheckingClimate, setIsCheckingClimate] = useState(false);
  const [simulatingShock, setSimulatingShock] = useState(null);
  const [testNotifResult, setTestNotifResult] = useState(null);
  const [climateCheckResult, setClimateCheckResult] = useState(null);
  const [sendingSmsId, setSendingSmsId] = useState(null);
  const [sentSmsIds, setSentSmsIds] = useState({});

  // Edit & Delete Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load all registered fields list on mount
  useEffect(() => {
    loadAllFields();
  }, []);

  // Whenever currentFieldId changes, load field details, weather, advice, notifications
  useEffect(() => {
    if (currentFieldId) {
      loadFieldData(currentFieldId);
      fetchFieldWeather(currentFieldId);
      fetchFieldAdvice(currentFieldId);
      fetchNotifications();
    }
  }, [currentFieldId]);

  const loadAllFields = async () => {
    const fields = await getFarmerFieldsApi();
    if (fields && fields.length > 0) {
      setAllFields(fields);
      if (!currentFieldId) {
        setCurrentFieldId(fields[0].id);
      }
    }
  };

  const loadFieldData = async (fId) => {
    setLoadingField(true);
    setErrorField("");
    const data = await getFieldDetailsApi(fId);
    if (data) {
      setField(data);
    } else {
      setErrorField(isHindi ? "खेत नहीं मिला" : "Field not found");
    }
    setLoadingField(false);
  };

  const fetchFieldWeather = async (fId) => {
    setLoadingWeather(true);
    setWeatherError("");
    const data = await getFieldWeatherApi(fId);
    if (data) {
      setWeatherData(data.weather || data);
    } else {
      setWeatherError(
        isHindi ? "मौसम डेटा लोड करने में विफल" : "Failed to load weather data",
      );
    }
    setLoadingWeather(false);
  };

  const fetchFieldAdvice = async (fId) => {
    setLoadingAdvice(true);
    const data = await getFieldAdviceApi(fId);
    if (data) {
      setAdviceData(data.analysis || data);
    } else {
      setAdviceData(null);
    }
    setLoadingAdvice(false);
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    const notifs = await getFarmerNotificationsApi();
    if (notifs) {
      setNotifications(
        Array.isArray(notifs?.notifications)
          ? notifs.notifications
          : Array.isArray(notifs)
            ? notifs
            : [],
      );
      if (notifs?.farmer_phone) {
        setEditingPhone((prev) => prev || notifs.farmer_phone);
      }
    } else {
      setNotifications([]);
    }
    setLoadingNotifications(false);
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!editingPhone.trim()) return;
    setIsUpdatingPhone(true);
    const res = await updateFarmerPhoneApi(editingPhone.trim());
    if (res?.status === "success") {
      setTestNotifResult({
        type: "success",
        msg: isHindi ? "✓ फ़ोन नंबर अपडेट हो गया" : "✓ Phone updated",
      });
    } else {
      setTestNotifResult({
        type: "error",
        msg: res?.message || (isHindi ? "अपडेट विफल" : "Update failed"),
      });
    }
    setIsUpdatingPhone(false);
  };

  const handleSendTestNotification = async () => {
    setIsSendingTestNotif(true);
    setTestNotifResult(null);
    const phoneToUse =
      editingPhone && editingPhone.trim().length >= 8
        ? editingPhone.trim()
        : "+91 9981087718";
    const res = await sendTestNotificationApi(phoneToUse);
    if (res?.status === "success") {
      setTestNotifResult({
        type: "success",
        msg: isHindi
          ? `✓ परीक्षण संदेश भेजा गया (${res.channels?.SMS?.status || "सफल"})`
          : `✓ Test alert dispatched successfully to ${phoneToUse}`,
      });
      await fetchNotifications();
    } else {
      setTestNotifResult({
        type: "error",
        msg:
          res?.message ||
          (isHindi
            ? "अलर्ट भेजने में विफल"
            : "Failed to dispatch test notification"),
      });
    }
    setIsSendingTestNotif(false);
  };

  const handleDirectSendSms = async (logItem) => {
    if (sendingSmsId) return;
    setSendingSmsId(logItem.id);
    const phoneToUse =
      logItem.recipient_phone ||
      (editingPhone && editingPhone.trim().length >= 8
        ? editingPhone.trim()
        : "+91 9981087718");
    const res = await sendTestNotificationApi(phoneToUse, ["SMS"]);
    if (res?.status === "success") {
      setSentSmsIds((prev) => ({ ...prev, [logItem.id]: true }));
      setTimeout(() => {
        setSentSmsIds((prev) => {
          const next = { ...prev };
          delete next[logItem.id];
          return next;
        });
      }, 4000);
      await fetchNotifications();
    }
    setSendingSmsId(null);
  };

  const handleTriggerClimateCheck = async () => {
    setIsCheckingClimate(true);
    setClimateCheckResult(null);
    const res = await triggerClimateCheckApi(currentFieldId);
    if (res?.status === "success") {
      setClimateCheckResult({
        type: "success",
        msg: isHindi
          ? `✓ मौसम विश्लेषण पूर्ण: ${res.alerts_generated} अलर्ट उत्पन्न`
          : `✓ Climate check finished: ${res.alerts_generated} alerts created`,
      });
      await fetchNotifications();
    } else {
      setClimateCheckResult({
        type: "error",
        msg:
          res?.message ||
          (isHindi ? "मौसम जांच विफल" : "Climate evaluation failed"),
      });
    }
    setIsCheckingClimate(false);
  };

  const handleSimulateShock = async (shockType) => {
    setSimulatingShock(shockType);
    setClimateCheckResult(null);
    const phoneToUse =
      editingPhone && editingPhone.trim().length >= 8
        ? editingPhone.trim()
        : "+91 9981087718";
    const res = await simulateClimateShockApi(
      shockType,
      currentFieldId,
      phoneToUse,
    );
    if (res?.status === "success") {
      setClimateCheckResult({
        type: "success",
        msg: isHindi
          ? `✓ सिमुलेशन सफल: ${shockType} का अलर्ट लाइव एसएमएस द्वारा भेजा गया!`
          : `✓ Simulation Successful: Dispatched ${shockType} shock SMS to ${phoneToUse}!`,
      });
      await fetchNotifications();
    } else {
      setClimateCheckResult({
        type: "error",
        msg:
          res?.message ||
          (isHindi ? "सिमुलेशन अलर्ट विफल" : "Simulation dispatch failed"),
      });
    }
    setSimulatingShock(null);
  };

  const handleEditFieldSave = async (updatedData) => {
    if (!field) return;
    setActionLoading(true);
    const res = await updateFieldApi(field.id, updatedData);
    if (res) {
      setShowEditModal(false);
      await loadFieldData(field.id);
      await loadAllFields();
    }
    setActionLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!field) return;
    setActionLoading(true);
    const res = await deleteFieldApi(field.id);
    setShowDeleteConfirm(false);
    setActionLoading(false);
    onBack();
  };

  return (
    <div className="selected-field-container">
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

          <button className="header-nav-btn" onClick={onBack}>
            <Home size={18} />
            <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          <button
            className="header-nav-btn"
            onClick={() => onNavigateTab("community")}
          >
            <Users size={18} />
            <span>{isHindi ? "कृषि संवाद" : "Krishi Samvad"}</span>
          </button>

          <button
            className="header-nav-btn"
            onClick={() => onNavigateTab("survey")}
          >
            <BarChart3 size={18} />
            <span>{isHindi ? "सर्वे परिणाम" : "Survey Results"}</span>
          </button>

          <button
            className="header-nav-btn"
            onClick={() => onNavigateTab("about")}
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

      {/* Field Selector & Sub-Topic Navigation Toolbar */}
      <div className="subnav-field-section">
        <div className="field-selector-toolbar">
          <div className="field-selector-group">
            <Sprout size={20} className="field-selector-icon" />
            <span className="field-selector-label">
              {isHindi ? "चयनित खेत:" : "Select Field:"}
            </span>
            <select
              value={currentFieldId || ""}
              onChange={(e) => setCurrentFieldId(Number(e.target.value))}
              className="field-selector-dropdown"
            >
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {translateProfileText(f.field_name, language)} —{" "}
                  {translateProfileText(f.crop, language)} ({f.area}{" "}
                  {translateProfileText(f.area_unit, language)})
                </option>
              ))}
            </select>
          </div>

          {field && (
            <div className="field-toolbar-info">
              <span className="info-tag crop">
                {translateProfileText(field.crop, language)}
              </span>
              <span className="info-tag area">
                {field.area} {translateProfileText(field.area_unit, language)}
              </span>
              <button
                className="field-toolbar-action-btn edit"
                onClick={() => setShowEditModal(true)}
                title={isHindi ? "खेत संपादित करें" : "Edit Field"}
              >
                <Edit3 size={15} />
                <span>{isHindi ? "संपादित करें" : "Edit"}</span>
              </button>
              <button
                className="field-toolbar-action-btn delete"
                onClick={() => setShowDeleteConfirm(true)}
                title={isHindi ? "खेत हटाएं" : "Delete Field"}
              >
                <Trash2 size={15} />
                <span>{isHindi ? "हटाएं" : "Delete"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-Topic Navigation Tabs */}
        <div className="subtopic-tabs-bar">
          <button
            className={`subtopic-tab-btn ${activeTab === "data" ? "active" : ""}`}
            onClick={() => setActiveTab("data")}
          >
            <MapPin size={18} />
            <span>{isHindi ? "किसान डेटा" : "Farmer Data"}</span>
          </button>

          <button
            className={`subtopic-tab-btn ${activeTab === "livefeed" ? "active" : ""}`}
            onClick={() => setActiveTab("livefeed")}
          >
            <Video size={18} />
            <span>{isHindi ? "लाइव फीड" : "Live Feed"}</span>
          </button>

          <button
            className={`subtopic-tab-btn ${activeTab === "advice" ? "active" : ""}`}
            onClick={() => setActiveTab("advice")}
          >
            <ShieldAlert size={18} />
            <span>
              {isHindi ? "फसल सलाह एवं अलर्ट" : "Crop Advice & Alerts"}
            </span>
          </button>
        </div>
      </div>

      {loadingField ? (
        <div className="field-loading-box">
          <Activity size={32} className="spin-icon" />
          <p>
            {isHindi
              ? "खेत की जानकारी लोड हो रही है..."
              : "Loading field information..."}
          </p>
        </div>
      ) : errorField || !field ? (
        <div className="field-error-box">
          <AlertTriangle size={36} color="#dc2626" />
          <h3>{errorField || "Field not found"}</h3>
          <button onClick={onBack} className="back-btn">
            <ArrowLeft size={16} />
            <span>
              {isHindi ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard"}
            </span>
          </button>
        </div>
      ) : (
        <>
          {/* SUB-TOPIC 1 — किसान डेटा */}
          {activeTab === "data" && (
            <div className="tab-content-container fade-in">
              <div className="farmer-data-grid">
                <div className="data-card">
                  <h3 className="card-section-title">
                    <Sprout size={20} />
                    <span>{isHindi ? "खेत का विवरण" : "Field Profile"}</span>
                  </h3>

                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "किसान का नाम:" : "Farmer Name:"}
                      </span>
                      <span className="row-val">
                        <strong>
                          {translateProfileText(farmerName, language)}
                        </strong>
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "खेत का नाम:" : "Field Name:"}
                      </span>
                      <span className="row-val">
                        <strong>
                          {translateProfileText(field.field_name, language)}
                        </strong>
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "फसल का प्रकार:" : "Crop:"}
                      </span>
                      <span className="row-val">
                        <strong>
                          {translateProfileText(field.crop, language)}
                        </strong>
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "क्षेत्रफल:" : "Field Area:"}
                      </span>
                      <span className="row-val">
                        {field.area}{" "}
                        {translateProfileText(field.area_unit, language)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "बुआई की तारीख:" : "Sowing Date:"}
                      </span>
                      <span className="row-val">{field.sowing_date}</span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "मिट्टी का प्रकार:" : "Soil Type:"}
                      </span>
                      <span className="row-val">
                        {translateProfileText(field.soil_type, language)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "सिंचाई प्रणाली:" : "Irrigation Type:"}
                      </span>
                      <span className="row-val">
                        {translateProfileText(field.irrigation_type, language)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="row-label">
                        {isHindi ? "भौगोलिक निर्देशांक:" : "Coordinates:"}
                      </span>
                      <span className="row-val monospace">
                        {field.latitude.toFixed(5)},{" "}
                        {field.longitude.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="data-card">
                  <h3 className="card-section-title">
                    <MapPin size={20} />
                    <span>
                      {isHindi ? "खेत का नक्शा" : "Field Map Location"}
                    </span>
                  </h3>
                  <FieldMap
                    lat={field.latitude}
                    lng={field.longitude}
                    fieldName={field.field_name}
                    crop={field.crop}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUB-TOPIC 2 — लाइव फीड (CNN Model Live Detection) */}
          {activeTab === "livefeed" && (
            <div className="tab-content-container fade-in">
              <LiveFeedView field={field} isHindi={isHindi} />
            </div>
          )}

          {/* SUB-TOPIC 3 — फसल सलाह एवं अलर्ट */}
          {activeTab === "advice" && (
            <div className="tab-content-container fade-in">
              <div className="advice-section-card">
                <div className="section-title-bar">
                  <div className="title-with-icon">
                    <Thermometer size={22} className="accent-icon" />
                    <div>
                      <h3 className="section-heading">
                        {isHindi
                          ? "वास्तविक मौसम डेटा"
                          : "Real Field Weather Observations"}
                      </h3>
                      {weatherData && (
                        <span className="obs-time">
                          <Clock
                            size={12}
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          {isHindi ? "अवलोकन समय" : "Observed"}:{" "}
                          {weatherData.observation_time ||
                            new Date().toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => fetchFieldWeather(field.id)}
                    className="refresh-btn"
                    disabled={loadingWeather}
                    title={
                      isHindi
                        ? "मौसम डेटा रीफ्रेश करें"
                        : "Refresh real weather"
                    }
                  >
                    <RefreshCw
                      size={15}
                      className={loadingWeather ? "spin-icon" : ""}
                    />
                    <span>{isHindi ? "ताज़ा करें" : "Refresh"}</span>
                  </button>
                </div>

                {loadingWeather ? (
                  <p className="loading-text">
                    {isHindi
                      ? "वास्तविक मौसम डेटा लोड हो रहा है..."
                      : "Fetching current real weather..."}
                  </p>
                ) : weatherError ? (
                  <div className="error-alert">{weatherError}</div>
                ) : weatherData ? (
                  <div className="climate-metrics-grid">
                    <div className="metric-box">
                      <Thermometer size={24} color="#ef4444" />
                      <div>
                        <span className="metric-label">
                          {isHindi ? "तापमान" : "Temperature"}
                        </span>
                        <strong className="metric-val">
                          {weatherData.temperature != null
                            ? weatherData.temperature
                            : 26}
                          °C
                        </strong>
                        <span className="sub-metric">
                          {isHindi
                            ? `महसूस: ${weatherData.feels_like != null ? weatherData.feels_like : weatherData.temperature != null ? weatherData.temperature : 26}°C`
                            : `Feels like ${weatherData.feels_like != null ? weatherData.feels_like : weatherData.temperature != null ? weatherData.temperature : 26}°C`}
                        </span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <CloudRain size={24} color="#3b82f6" />
                      <div>
                        <span className="metric-label">
                          {isHindi ? "आर्द्रता (नमी)" : "Relative Humidity"}
                        </span>
                        <strong className="metric-val">
                          {weatherData.humidity != null
                            ? weatherData.humidity
                            : 55}
                          %
                        </strong>
                        <span className="sub-metric">
                          {isHindi ? "हवा में नमी" : "Moisture level"}
                        </span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <CloudRain size={24} color="#0284c7" />
                      <div>
                        <span className="metric-label">
                          {isHindi ? "वर्षा" : "Precipitation"}
                        </span>
                        <strong className="metric-val">
                          {weatherData.precipitation_mm != null
                            ? weatherData.precipitation_mm
                            : 0}{" "}
                          mm
                        </strong>
                        <span className="sub-metric">
                          {isHindi ? "वर्षा की मात्रा" : "Rainfall"}
                        </span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <Wind size={24} color="#10b981" />
                      <div>
                        <span className="metric-label">
                          {isHindi ? "हवा की गति" : "Wind Speed"}
                        </span>
                        <strong className="metric-val">
                          {weatherData.wind_speed_kmh != null
                            ? weatherData.wind_speed_kmh
                            : 12}{" "}
                          km/h
                        </strong>
                        <span className="sub-metric">
                          {isHindi
                            ? weatherData.condition_hi || "मौसम साफ"
                            : weatherData.condition_en || "Clear Sky"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-data-msg">
                    {isHindi
                      ? "मौसम डेटा अनुपलब्ध है"
                      : "Weather data unavailable"}
                  </p>
                )}
              </div>

              <div className="advice-section-card">
                <div className="section-title-bar">
                  <div className="title-with-icon">
                    <ShieldAlert size={22} className="accent-icon" />
                    <h3 className="section-heading">
                      {isHindi
                        ? "फसल बीमारी एवं कीट जोखिम विश्लेषण"
                        : "Crop Disease & Pest Risk Analysis"}
                    </h3>
                  </div>
                </div>

                {loadingAdvice ? (
                  <p className="loading-text">
                    {isHindi
                      ? "जोखिम विश्लेषण की गणना हो रही है..."
                      : "Calculating evidence-based risk..."}
                  </p>
                ) : adviceData ? (
                  <div className="risk-analysis-wrapper">
                    <div
                      className={`risk-banner ${(adviceData.overall_risk || "LOW").toLowerCase()}`}
                    >
                      <div className="risk-level-badge">
                        <span>
                          {isHindi ? "कुल जोखिम स्तर:" : "Overall Risk:"}
                        </span>
                        <strong className="risk-title">
                          {adviceData.overall_risk === "LOW"
                            ? isHindi
                              ? "कम (LOW)"
                              : "LOW"
                            : adviceData.overall_risk === "MEDIUM"
                              ? isHindi
                                ? "मध्यम (MEDIUM)"
                                : "MEDIUM"
                              : adviceData.overall_risk === "HIGH"
                                ? isHindi
                                  ? "उच्च (HIGH)"
                                  : "HIGH"
                                : isHindi
                                  ? "गंभीर (CRITICAL)"
                                  : "CRITICAL"}
                        </strong>
                      </div>

                      {adviceData.growth_stage && (
                        <div className="risk-growth-stage">
                          <Sprout size={16} />
                          <span>
                            {isHindi ? "विकास अवस्था:" : "Growth Stage:"}{" "}
                            {isHindi
                              ? adviceData.growth_stage.stage_hi
                              : adviceData.growth_stage.stage_en}{" "}
                            ({adviceData.growth_stage.days_since_sowing || 0}{" "}
                            {isHindi ? "दिन" : "days"})
                          </span>
                        </div>
                      )}
                    </div>

                    {(
                      (isHindi
                        ? adviceData.reasons_hi
                        : adviceData.reasons_en) || []
                    ).length > 0 && (
                      <div className="risk-reasons-box">
                        <h4 className="reasons-title">
                          {isHindi
                            ? "जोखिम का मुख्य कारण"
                            : "Why was this risk calculated?"}
                        </h4>
                        <ul className="reasons-list">
                          {(isHindi
                            ? adviceData.reasons_hi || []
                            : adviceData.reasons_en || []
                          ).map((reason, idx) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {adviceData.threats && adviceData.threats.length > 0 && (
                      <div className="threats-breakdown-section">
                        <h4>
                          {isHindi
                            ? "संभावित बीमारियां और कीट"
                            : "Potential Crop Threats"}
                        </h4>
                        <div className="threats-grid">
                          {adviceData.threats.map((th) => (
                            <div
                              key={th.threat_id || th.name_en}
                              className="threat-card"
                            >
                              <div className="threat-card-header">
                                <strong className="threat-name">
                                  {isHindi ? th.name_hi : th.name_en}
                                </strong>
                                <span
                                  className={`threat-risk-tag ${(th.risk_level || "LOW").toLowerCase()}`}
                                >
                                  {th.risk_level === "LOW"
                                    ? isHindi
                                      ? "कम"
                                      : "LOW"
                                    : th.risk_level === "MEDIUM"
                                      ? isHindi
                                        ? "मध्यम"
                                        : "MEDIUM"
                                      : th.risk_level === "HIGH"
                                        ? isHindi
                                          ? "उच्च"
                                          : "HIGH"
                                        : isHindi
                                          ? "गंभीर"
                                          : "CRITICAL"}
                                </span>
                              </div>

                              <p className="threat-symptoms">
                                <strong>
                                  {isHindi ? "लक्षण:" : "Symptoms:"}
                                </strong>{" "}
                                {isHindi ? th.symptoms_hi : th.symptoms_en}
                              </p>

                              <div className="threat-action">
                                <strong>
                                  {isHindi ? "उपचार:" : "Action:"}
                                </strong>{" "}
                                {isHindi ? th.action_hi : th.action_en}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {adviceData.recommendations &&
                      adviceData.recommendations.length > 0 && (
                        <div className="recommendations-section">
                          <h4>
                            {isHindi
                              ? "कृषि कार्य योजना और सिफारिशें"
                              : "Actionable Agricultural Advice"}
                          </h4>
                          <div className="recs-list">
                            {adviceData.recommendations.map((rec, idx) => (
                              <div key={idx} className="rec-card">
                                <div className="rec-concern">
                                  <AlertTriangle size={18} color="#d97706" />
                                  <strong>
                                    {isHindi ? rec.concern_hi : rec.concern_en}
                                  </strong>
                                </div>
                                <div className="rec-detail">
                                  <CheckCircle2 size={16} color="#166534" />
                                  <span>
                                    {isHindi ? rec.action_hi : rec.action_en}
                                  </span>
                                </div>
                                <div className="rec-monitor">
                                  <strong>
                                    {isHindi ? "निगरानी:" : "Monitor:"}
                                  </strong>{" "}
                                  {isHindi ? rec.monitor_hi : rec.monitor_en}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="no-data-msg">
                    {isHindi
                      ? "जोखिम डेटा अनुपलब्ध है"
                      : "Risk data unavailable"}
                  </p>
                )}
              </div>

              {/* Automated SMS & Alerts */}
              <div className="advice-section-card notifications-panel-card">
                <div className="section-title-bar">
                  <Bell size={22} className="accent-icon" />
                  <div>
                    <h3>
                      {isHindi
                        ? "स्वचालित एसएमएस एवं व्हाट्सएप चेतावनी प्रणाली"
                        : "Automated SMS & WhatsApp Field Alerts"}
                    </h3>
                    <p className="section-subtitle">
                      {isHindi
                        ? "रोग, कीट एवं गंभीर मौसम परिवर्तन की स्थिति में किसान के मोबाइल पर स्वतः अलर्ट संदेश"
                        : "Instant bilingual warning messages dispatched to farmer mobile for diseases, pests & climate risks"}
                    </p>
                  </div>
                </div>

                <div className="notifications-control-toolbar">
                  <form
                    onSubmit={handleUpdatePhone}
                    className="phone-update-form"
                  >
                    <Smartphone size={18} color="#16a34a" />
                    <label className="phone-label">
                      {isHindi ? "किसान मोबाइल नंबर:" : "Farmer Phone:"}
                    </label>
                    <input
                      type="text"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="phone-input"
                    />
                    <button
                      type="submit"
                      className="update-phone-btn"
                      disabled={isUpdatingPhone}
                    >
                      {isUpdatingPhone
                        ? isHindi
                          ? "अपडेट हो रहा..."
                          : "Updating..."
                        : isHindi
                          ? "नंबर सेव करें"
                          : "Save Number"}
                    </button>
                  </form>

                  <div className="action-buttons-group">
                    <button
                      onClick={handleSendTestNotification}
                      className="send-test-btn"
                      disabled={isSendingTestNotif}
                      title="Send test alert to mobile"
                    >
                      <Send size={15} />
                      <span>
                        {isSendingTestNotif
                          ? isHindi
                            ? "अलर्ट भेजा जा रहा है..."
                            : "Sending..."
                          : isHindi
                            ? "टेस्ट अलर्ट भेजें"
                            : "Test Alert"}
                      </span>
                    </button>

                    <button
                      onClick={handleTriggerClimateCheck}
                      className="check-climate-btn"
                      disabled={isCheckingClimate}
                      title="Evaluate weather & send climate warnings"
                    >
                      <CloudRain size={15} />
                      <span>
                        {isCheckingClimate
                          ? isHindi
                            ? "जांच हो रही है..."
                            : "Evaluating..."
                          : isHindi
                            ? "मौसम अलर्ट जांचें"
                            : "Check Climate Risks"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Simulated Climate Shocks Test Toolbar */}
                <div className="sim-shock-test-panel">
                  <div className="sim-panel-header">
                    <Sparkles size={16} className="text-amber" />
                    <strong>
                      {isHindi
                        ? "डमी मौसम डेटा से टेस्ट करें (Simulate Climate Shocks):"
                        : "Test with Simulated Dummy Weather Shocks:"}
                    </strong>
                    <span className="sim-badge">
                      {isHindi ? "लाइव टेस्ट" : "Live Test"}
                    </span>
                  </div>
                  <div className="sim-chips-container">
                    <button
                      type="button"
                      onClick={() => handleSimulateShock("HEAVY_RAIN")}
                      disabled={!!simulatingShock}
                      className={`sim-chip-btn rain ${simulatingShock === "HEAVY_RAIN" ? "loading" : ""}`}
                      title="Simulate 18.5mm heavy downpour"
                    >
                      🌧️{" "}
                      {simulatingShock === "HEAVY_RAIN"
                        ? isHindi
                          ? "भेजा जा रहा है..."
                          : "Sending..."
                        : isHindi
                          ? "भारी बारिश (18.5mm)"
                          : "Heavy Rain (18.5mm)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateShock("HEATWAVE")}
                      disabled={!!simulatingShock}
                      className={`sim-chip-btn heat ${simulatingShock === "HEATWAVE" ? "loading" : ""}`}
                      title="Simulate 41.5°C severe heatwave"
                    >
                      ☀️{" "}
                      {simulatingShock === "HEATWAVE"
                        ? isHindi
                          ? "भेजा जा रहा है..."
                          : "Sending..."
                        : isHindi
                          ? "अत्यधिक लू (41.5°C)"
                          : "Heatwave (41.5°C)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateShock("FROST_WARNING")}
                      disabled={!!simulatingShock}
                      className={`sim-chip-btn frost ${simulatingShock === "FROST_WARNING" ? "loading" : ""}`}
                      title="Simulate 1.8°C ground frost"
                    >
                      ❄️{" "}
                      {simulatingShock === "FROST_WARNING"
                        ? isHindi
                          ? "भेजा जा रहा है..."
                          : "Sending..."
                        : isHindi
                          ? "पाला (1.8°C)"
                          : "Ground Frost (1.8°C)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateShock("FUNGAL_RISK")}
                      disabled={!!simulatingShock}
                      className={`sim-chip-btn fungal ${simulatingShock === "FUNGAL_RISK" ? "loading" : ""}`}
                      title="Simulate 92% humidity microclimate"
                    >
                      🌫️{" "}
                      {simulatingShock === "FUNGAL_RISK"
                        ? isHindi
                          ? "भेजा जा रहा है..."
                          : "Sending..."
                        : isHindi
                          ? "फफूंद खतरा (92% नमी)"
                          : "Fungal Risk (92% RH)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateShock("STORM_WIND")}
                      disabled={!!simulatingShock}
                      className={`sim-chip-btn storm ${simulatingShock === "STORM_WIND" ? "loading" : ""}`}
                      title="Simulate 42 km/h gale winds"
                    >
                      💨{" "}
                      {simulatingShock === "STORM_WIND"
                        ? isHindi
                          ? "भेजा जा रहा है..."
                          : "Sending..."
                        : isHindi
                          ? "आंधी-तूफान (42 km/h)"
                          : "Gale Storm (42 km/h)"}
                    </button>
                  </div>
                </div>

                {testNotifResult && (
                  <div
                    className={`notif-status-banner ${testNotifResult.type}`}
                  >
                    {testNotifResult.msg}
                  </div>
                )}
                {climateCheckResult && (
                  <div
                    className={`notif-status-banner ${climateCheckResult.type}`}
                  >
                    {climateCheckResult.msg}
                  </div>
                )}

                <div className="notifications-history-wrapper">
                  <div className="history-header">
                    <h4>
                      {isHindi ? "हालिया अलर्ट इतिहास" : "Recent Alert Logs"}
                    </h4>
                    <button
                      onClick={fetchNotifications}
                      className="history-refresh-btn"
                      disabled={loadingNotifications}
                    >
                      <RefreshCw
                        size={14}
                        className={loadingNotifications ? "spin-icon" : ""}
                      />
                      <span>{isHindi ? "रीफ्रेश करें" : "Refresh"}</span>
                    </button>
                  </div>

                  {loadingNotifications ? (
                    <p className="loading-text">
                      {isHindi
                        ? "अलर्ट लोड हो रहे हैं..."
                        : "Loading alerts..."}
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="no-notifs-text">
                      {isHindi
                        ? "इस खेत के लिए अभी कोई अलर्ट इतिहास नहीं है।"
                        : "No alerts dispatched yet for this field."}
                    </p>
                  ) : (
                    <div className="notifs-list">
                      {notifications.map((n) => (
                        <div key={n.id} className="notif-log-item">
                          <div className="notif-log-header">
                            <div className="notif-header-left">
                              <span
                                className={`notif-type-tag ${String(n.alert_type || "test").toLowerCase()}`}
                              >
                                {n.alert_type === "DISEASE"
                                  ? "⚠️ DISEASE"
                                  : n.alert_type === "PEST"
                                    ? "🐛 PEST"
                                    : n.alert_type === "CLIMATE"
                                      ? "⛈️ CLIMATE"
                                      : "🔔 TEST"}
                              </span>
                              {n.recipient_phone && (
                                <span className="notif-phone-badge">
                                  {n.recipient_phone}
                                </span>
                              )}
                            </div>
                            <span className="notif-time-tag">
                              {n.sent_at || n.created_at}
                            </span>
                          </div>

                          <div className="notif-body">
                            <p className="notif-message-text">
                              {isHindi && n.message_hi
                                ? n.message_hi
                                : n.message_en ||
                                  n.title ||
                                  "Notification message dispatched."}
                            </p>
                          </div>

                          <div className="notif-channels-meta">
                            <div className="channel-pill sms">
                              <span className="pill-dot"></span>
                              <span>SMS:</span>
                              <strong>{n.sms_status || "Delivered"}</strong>
                            </div>
                            <div className="channel-pill whatsapp">
                              <span className="pill-dot"></span>
                              <span>WhatsApp:</span>
                              <strong>
                                {n.whatsapp_status || "Delivered"}
                              </strong>
                            </div>

                            <div className="notif-direct-actions">
                              <a
                                href={`https://api.whatsapp.com/send?phone=${encodeURIComponent((n.recipient_phone || editingPhone || "").replace(/[^0-9]/g, ""))}&text=${encodeURIComponent(
                                  (n.title ? `*${n.title}*\n\n` : "") +
                                    (isHindi && n.message_hi
                                      ? n.message_hi
                                      : n.message_en || n.title || ""),
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="direct-action-btn wa-direct-btn"
                                title="Open WhatsApp chat with this message"
                              >
                                <MessageCircle size={14} />
                                <span>
                                  {isHindi
                                    ? "व्हाट्सएप पर भेजें"
                                    : "Send on WhatsApp"}
                                </span>
                              </a>

                              <button
                                onClick={() => handleDirectSendSms(n)}
                                disabled={sendingSmsId === n.id}
                                className={`direct-action-btn sms-direct-btn ${sentSmsIds[n.id] ? "sent" : ""}`}
                                title="Send live SMS directly to mobile via SIM Gateway"
                              >
                                {sendingSmsId === n.id ? (
                                  <>
                                    <RefreshCw
                                      size={13}
                                      className="spin-icon"
                                    />
                                    <span>
                                      {isHindi
                                        ? "भेज रहे हैं..."
                                        : "Sending..."}
                                    </span>
                                  </>
                                ) : sentSmsIds[n.id] ? (
                                  <>
                                    <CheckCircle2 size={13} />
                                    <span>
                                      {isHindi ? "✓ भेजा गया!" : "✓ Sent!"}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Smartphone size={14} />
                                    <span>
                                      {isHindi ? "एसएमएस भेजें" : "Send SMS"}
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Field Modal */}
      {showEditModal && field && (
        <EditFieldModal
          field={field}
          onSave={handleEditFieldSave}
          onClose={() => setShowEditModal(false)}
          language={language}
        />
      )}

      {/* Delete Field Confirmation Modal */}
      {showDeleteConfirm && field && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-card delete-confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-header">
              <AlertTriangle size={28} className="delete-warning-icon" />
              <h3>
                {isHindi ? "खेत हटाने की पुष्टि करें" : "Confirm Delete Field"}
              </h3>
            </div>
            <p className="delete-modal-text">
              {isHindi
                ? `क्या आप वाकई खेत "${translateProfileText(field.field_name, language)}" को हटाना चाहते हैं? इसके सभी संबंधित अलर्ट और डेटा हटा दिए जाएंगे।`
                : `Are you sure you want to delete field "${field.field_name}"? All associated data and alerts will be permanently removed.`}
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                <Trash2 size={16} />
                <span>
                  {actionLoading
                    ? isHindi
                      ? "हटाया जा रहा है..."
                      : "Deleting..."
                    : isHindi
                      ? "हाँ, हटाएं"
                      : "Yes, Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
