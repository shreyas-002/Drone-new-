import React, { useState, useEffect } from "react";
import {
  Home,
  Globe,
  LogOut,
  User,
  MapPin,
  Phone,
  Edit3,
  Heart,
  Sprout,
  ShieldCheck,
  Plus,
  ArrowRight,
  Calendar,
  Users,
  Trash2,
  AlertTriangle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Droplet,
  Radio,
  Clock,
  Award,
  TrendingUp,
  Bell,
  Info,
} from "lucide-react";
import logoImg from "../assets/logo.png";
import farmerImg from "../assets/farmer.jpg";
import droneImg from "../assets/drone-tech.jpg";
import safeCropImg from "../assets/safe-crop.jpg";
import { translateProfileText } from "../utils/transliterate";
import {
  getFarmerFieldsApi,
  createFieldApi,
  updateFieldApi,
  deleteFieldApi,
} from "../services/api";
import AddFieldModal from "../components/AddFieldModal";
import EditFieldModal from "../components/EditFieldModal";
import "../styles/DashboardPage.css";

export default function DashboardPage({
  userProfile,
  onOpenProfileModal,
  onLogout,
  language = "hi",
  onToggleLanguage,
  onSelectField,
  onNavigateTab,
}) {
  const isHindi = language === "hi";

  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deletingField, setDeletingField] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Interactive Hero Accordion States
  const [activeHeroSections, setActiveHeroSections] = useState({
    drone: false,
    crops: false,
  });

  const toggleHeroSection = (sectionKey) => {
    setActiveHeroSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Determine current hero background photo
  const currentHeroBg =
    activeHeroSections.drone && !activeHeroSections.crops
      ? droneImg
      : activeHeroSections.crops && !activeHeroSections.drone
        ? safeCropImg
        : activeHeroSections.drone && activeHeroSections.crops
          ? droneImg
          : farmerImg;

  const displayName = userProfile?.name
    ? translateProfileText(userProfile.name, language)
    : isHindi
      ? "अनंत"
      : "Anant";

  const rawLocation = userProfile?.location || "Ludhiana, Punjab";
  const displayLocation =
    translateProfileText(rawLocation, language) ||
    (isHindi ? "लुधियाना, पंजाब" : "Ludhiana, Punjab");
  const displayPincode = userProfile?.pincode || "141001";

  // Load registered fields on mount
  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setLoadingFields(true);
    const data = await getFarmerFieldsApi();
    if (data) {
      setFields(data);
    }
    setLoadingFields(false);
  };

  const handleAddFieldSave = async (newFieldData) => {
    setShowAddFieldModal(false);
    setLoadingFields(true);
    const savedField = await createFieldApi(newFieldData);
    if (savedField) {
      await loadFields();
    } else {
      setLoadingFields(false);
    }
  };

  const handleEditFieldSave = async (updatedData) => {
    if (!editingField) return;
    setActionLoading(true);
    const res = await updateFieldApi(editingField.id, updatedData);
    if (res) {
      setEditingField(null);
      await loadFields();
    }
    setActionLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingField) return;
    setActionLoading(true);
    const res = await deleteFieldApi(deletingField.id);
    setDeletingField(null);
    await loadFields();
    setActionLoading(false);
  };

  return (
    <div className="dashboard-container">
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

          <button
            className="header-nav-btn active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
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

      {/* Main Content Area */}
      <main className="dashboard-main-content">
        {/* Farmer Profile Card */}
        <div className="farmer-profile-card">
          <div className="profile-info-group">
            <div className="profile-avatar-icon">
              <User size={26} />
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <User size={12} /> {isHindi ? "किसान का नाम" : "Farmer Name"}
              </span>
              <span className="profile-detail-value">{displayName}</span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <MapPin size={12} />{" "}
                {isHindi ? "खेत का स्थान" : "Field Location"}
              </span>
              <span className="profile-detail-value">{displayLocation}</span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <MapPin size={12} /> {isHindi ? "पिनकोड" : "Pincode"}
              </span>
              <span className="profile-detail-value">{displayPincode}</span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <Phone size={12} /> {isHindi ? "संपर्क नंबर" : "Contact Number"}
              </span>
              <span className="profile-detail-value">
                {userProfile?.phone || "+91 98765 43210"}
              </span>
            </div>
          </div>

          <button onClick={onOpenProfileModal} className="edit-profile-btn">
            <Edit3 size={15} />
            <span>{isHindi ? "प्रोफाइल संपादित करें" : "Edit Profile"}</span>
          </button>
        </div>

        {/* Indian Farmer Hero Showcase Section */}
        <div className="farmer-hero-showcase">
          <img
            src={currentHeroBg}
            alt="FarmHawk Agri Innovation"
            className="farmer-bg-img transition-fade"
          />
          <div className="farmer-hero-overlay"></div>

          <div className="farmer-hero-content">
            <div className="farmer-hero-badge">
              <Heart size={16} color="#34d399" />
              <span>
                {isHindi ? "जय जवान, जय किसान" : "Saluting Indian Farmers"}
              </span>
            </div>

            <h1 className="farmer-hero-title">
              {isHindi
                ? "देश के अन्नदाता, हमारी शान"
                : "Backbone of the Nation — Our Honored Farmers"}
            </h1>

            <p className="farmer-hero-quote">
              {isHindi
                ? "भारतीय किसानों की अटूट लगन और कठिन परिश्रम को हमारा नमन। FarmHawk आधुनिक स्वायत्त ड्रोन तकनीक, स्मार्ट जेस्चर कंट्रोल एवं AI फसल सुरक्षा के साथ आपकी हर फसल की समृद्धि के लिए सदैव तत्पर है।"
                : "Honoring the dedication and hard work of Indian farmers. FarmHawk empowers modern agriculture with autonomous precision drones, gesture control, and intelligent crop safety for greener, healthier crops."}
            </p>

            {/* Interactive Toggle Buttons */}
            <div className="farmer-hero-tags">
              <button
                type="button"
                className={`hero-interactive-tag-btn ${activeHeroSections.drone ? "active" : ""}`}
                onClick={() => toggleHeroSection("drone")}
              >
                <Sprout size={16} />
                <span>
                  {isHindi ? "सटीक कृषि तकनीक" : "Precision Agri Tech"}
                </span>
                <ChevronDown
                  size={16}
                  className={`tag-arrow ${activeHeroSections.drone ? "expanded" : ""}`}
                />
              </button>

              <button
                type="button"
                className={`hero-interactive-tag-btn ${activeHeroSections.crops ? "active" : ""}`}
                onClick={() => toggleHeroSection("crops")}
              >
                <ShieldCheck size={16} />
                <span>{isHindi ? "सुरक्षित फसल" : "Protected Harvest"}</span>
                <ChevronDown
                  size={16}
                  className={`tag-arrow ${activeHeroSections.crops ? "expanded" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDED SECTION 1: DRONE TECH (Always on TOP when opened) */}
        {activeHeroSections.drone && (
          <div className="hero-expanded-drawer drone-drawer slide-down">
            <div className="drawer-inner-layout">
              <div className="drawer-media-col">
                <div className="drawer-showcase-frame">
                  <img
                    src={droneImg}
                    alt="FarmHawk Agricultural Drone"
                    className="drawer-showcase-img"
                  />
                  <div className="drawer-media-badge-overlay">
                    <span className="drone-badge-title">
                      FARMHAWK Agri-Quadcopter
                    </span>
                    <p>
                      {isHindi
                        ? "स्मार्ट जेस्चर कंट्रोल, ऑनबोर्ड मृदा सेंसर एवं 4K AI कैमरे से लैस"
                        : "Smart Gesture Control, Onboard Soil Sensor & 4K AI Camera"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="drawer-info-col">
                <div className="drawer-header-row">
                  <div className="drawer-icon-wrap drone">
                    <Sprout size={24} />
                  </div>
                  <div>
                    <h3 className="drawer-heading">
                      {isHindi
                        ? "सटीक ड्रोन तकनीक से किसान क्या-क्या कर सकते हैं?"
                        : "What You Can Achieve With FarmHawk Drone Tech"}
                    </h3>
                    <p className="drawer-subheading">
                      {isHindi
                        ? "खेत के कोने-कोने की हवाई निगरानी, जेस्चर नियंत्रण और किफायती मृदा विश्लेषण"
                        : "Aerial surveillance, gesture-driven control, and cost-effective soil analytics"}
                    </p>
                  </div>
                </div>

                <div className="capabilities-grid-2x2">
                  <div className="cap-card">
                    <div className="cap-num">01</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "स्मार्ट जेस्चर / हाथ के इशारों से नियंत्रण"
                          : "Smart Hand Gesture Control"}
                      </h4>
                      <p>
                        {isHindi
                          ? "हाथ के सरल इशारों से ड्रोन का आसान टेकऑफ़, दिशा नियंत्रण और लैंडिंग, बिना किसी जटिल रिमोट के।"
                          : "Effortless drone takeoff, directional flight, and landing using simple intuitive hand gestures."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">02</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "ऑनबोर्ड लो-कॉस्ट मृदा स्वास्थ्य सेंसर"
                          : "Onboard Low-Cost Soil Sensor"}
                      </h4>
                      <p>
                        {isHindi
                          ? "ड्रोन पर लगे डिवाइस से उड़ते हुए मिट्टी की नमी, तापमान और उर्वरकता का सटीक विश्लेषण।"
                          : "Integrated payload sensing soil moisture, temperature, and fertility directly from the air to reduce costs."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">03</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "स्वायत्त हवाई सर्वेक्षण व मैपिंग"
                          : "Autonomous Aerial Mapping"}
                      </h4>
                      <p>
                        {isHindi
                          ? "कुछ ही मिनटों में पूरे खेत का उच्च-रिज़ॉल्यूशन स्कैन, पौधों का घनत्व और नमी का नक्शा।"
                          : "High-resolution multispectral scan of your entire field in minutes with moisture mapping."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">04</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "AI और YOLO द्वारा रोग व कीट पहचान"
                          : "Live YOLO Edge AI Pest Detection"}
                      </h4>
                      <p>
                        {isHindi
                          ? "उड़ान के दौरान पीला रतुआ, इल्ली, एफिड्स और फफूंद संक्रमण की पत्तियों पर तुरंत लाइव पहचान।"
                          : "Instant edge detection of yellow rust, armyworms, and leaf blights directly during flight."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">05</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "सटीक माइक्रो-डोज़ छिड़काव मार्गदर्शन"
                          : "Precision Micro-Dose Spray Guidance"}
                      </h4>
                      <p>
                        {isHindi
                          ? "केवल प्रभावित पौधों पर ही दवा छिड़काव की सिफारिश जिससे कीटनाशक खर्च 40% तक घटे।"
                          : "Targeted spot-spraying coordinates saving up to 40% in pesticide and fertilizer expenses."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">06</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "मोबाइल पर लाइव HD वीडियो फीड"
                          : "Direct HD Video Stream to Phone"}
                      </h4>
                      <p>
                        {isHindi
                          ? "घर बैठे या खेत की मेड़ से मोबाइल पर फसल की वास्तविक स्थिति और ड्रोन कैमरा स्ट्रीम देखें।"
                          : "Stream real-time HD video telemetry directly to your smartphone anywhere, anytime."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPANDED SECTION 2: SAFE CROPS (Always on BOTTOM when opened) */}
        {activeHeroSections.crops && (
          <div className="hero-expanded-drawer crops-drawer slide-down">
            <div className="drawer-inner-layout">
              <div className="drawer-media-col">
                <div className="drawer-showcase-frame">
                  <img
                    src={safeCropImg}
                    alt="Healthy Crop Harvest"
                    className="drawer-showcase-img"
                  />
                  <div className="drawer-media-badge-overlay harvest">
                    <span className="drone-badge-title">
                      100% Protected Yield
                    </span>
                    <p>
                      {isHindi
                        ? "रोगमुक्त, हरी-भरी और समृद्ध फसल की गारंटी"
                        : "Disease-Free, High-Yielding & Protected Harvest"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="drawer-info-col">
                <div className="drawer-header-row">
                  <div className="drawer-icon-wrap harvest">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="drawer-heading">
                      {isHindi
                        ? "सुरक्षित फसल प्रणाली द्वारा किसानों को क्या सुरक्षा मिलती है?"
                        : "How FarmHawk Protects Your Crop & Maximizes Yield"}
                    </h3>
                    <p className="drawer-subheading">
                      {isHindi
                        ? "बुआई से कटाई तक निरंतर सुरक्षा और वैज्ञानिक कृषि सलाह"
                        : "Continuous risk mitigation and evidence-based crop health safeguards"}
                    </p>
                  </div>
                </div>

                <div className="capabilities-grid-2x2">
                  <div className="cap-card">
                    <div className="cap-num">01</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "48 घंटे पहले बीमारी का पूर्व-अलर्ट"
                          : "48-Hour Early Risk Warning"}
                      </h4>
                      <p>
                        {isHindi
                          ? "मौसम और आर्द्रता बदलते ही फफूंद व कीट फैलने से 48 घंटे पहले मोबाइल पर चेतावनी संदेश।"
                          : "Predictive alerts dispatched 48 hours before climate triggers fungal spores or pest outbreaks."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">02</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "25% से 30% फसल नुकसान से पूर्ण बचाव"
                          : "25-30% Yield Loss Prevention"}
                      </h4>
                      <p>
                        {isHindi
                          ? "बुवाई से कटाई तक निरंतर विकास निगरानी से हर क्विंटल अनाज की बर्बादी रोकना।"
                          : "Continuous vegetative index tracking from sowing to harvest safeguarding every quintal."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">03</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "वैज्ञानिक एवं प्रमाणित उपचार सिफारिशें"
                          : "ICAR-Approved Evidence-Based Treatments"}
                      </h4>
                      <p>
                        {isHindi
                          ? "कृषि वैज्ञानिकों (ICAR) द्वारा अनुशंसित सही दवा, सही मात्रा और जैविक उपचार विधियां।"
                          : "Actionable chemical dosages and organic remedies verified by agricultural research scientists."}
                      </p>
                    </div>
                  </div>

                  <div className="cap-card">
                    <div className="cap-num">04</div>
                    <div className="cap-text">
                      <h4>
                        {isHindi
                          ? "स्वचालित एसएमएस और व्हाट्सएप अलर्ट्स"
                          : "Automated SMS & WhatsApp Alerts"}
                      </h4>
                      <p>
                        {isHindi
                          ? "गंभीर मौसम बदलाव, पाला या लू की स्थिति में तुरंत किसान के मोबाइल पर सीधा संदेश।"
                          : "Instant bilingual warning messages delivered straight to farmer phone for weather and pest risks."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registered Fields Section */}
        <div className="fields-section">
          <div className="fields-section-header">
            <div>
              <h2 className="fields-title">
                {isHindi ? "मेरे पंजीकृत खेत" : "My Registered Fields"}
              </h2>
              <p className="fields-subtitle">
                {isHindi
                  ? "वास्तविक मौसम, रोग जोखिम और फसल सलाह के लिए विवरण देखें पर क्लिक करें।"
                  : "Click on any field to view weather, crop risk, and advice."}
              </p>
            </div>

            <button
              onClick={() => setShowAddFieldModal(true)}
              className="add-field-btn"
            >
              <Plus size={18} />
              <span>{isHindi ? "नया खेत जोड़ें" : "Add New Field"}</span>
            </button>
          </div>

          {loadingFields ? (
            <div className="fields-loading">
              {isHindi
                ? "डेटाबेस से खेत लोड हो रहे हैं..."
                : "Fetching fields from database..."}
            </div>
          ) : fields.length > 0 ? (
            <div className="fields-grid">
              {fields.map((f) => (
                <div key={f.id} className="field-card">
                  <div className="field-card-header">
                    <div className="crop-pill">
                      {translateProfileText(f.crop, language)}
                    </div>
                    <div className="field-card-header-actions">
                      <span className="field-card-area">
                        {f.area} {translateProfileText(f.area_unit, language)}
                      </span>
                      <button
                        className="field-btn-icon edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingField(f);
                        }}
                        title={isHindi ? "खेत संपादित करें" : "Edit Field"}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="field-btn-icon delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingField(f);
                        }}
                        title={isHindi ? "खेत हटाएं" : "Delete Field"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="field-card-title">
                    {translateProfileText(f.field_name, language)}
                  </h3>

                  <div className="field-card-details">
                    <div className="field-detail-line">
                      <Calendar size={14} />
                      <span>
                        {isHindi ? "बुआई की तारीख:" : "Sowing Date:"}{" "}
                        {f.sowing_date}
                      </span>
                    </div>

                    <div className="field-detail-line">
                      <MapPin size={14} />
                      <span>
                        {isHindi ? "स्थान:" : "Location:"}{" "}
                        {f.latitude ? f.latitude.toFixed(3) : "26.912"},{" "}
                        {f.longitude ? f.longitude.toFixed(3) : "75.787"}
                      </span>
                    </div>
                  </div>

                  <div className="field-card-footer">
                    <button
                      onClick={() => onSelectField(f.id)}
                      className="see-more-btn"
                    >
                      <span>{isHindi ? "विवरण देखें" : "See Details"}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-fields-box">
              <Sprout size={48} color="#9ca3af" />
              <h3>
                {isHindi
                  ? "अभी कोई खेत पंजीकृत नहीं है"
                  : "No Fields Registered Yet"}
              </h3>
              <p>
                {isHindi
                  ? 'वास्तविक मौसम और फसल सलाह प्राप्त करने के लिए "नया खेत जोड़ें" पर क्लिक करें।'
                  : 'Click "Add New Field" above to register your first farm plot.'}
              </p>
              <button
                onClick={() => setShowAddFieldModal(true)}
                className="add-field-btn inline-btn"
              >
                <Plus size={18} />
                <span>{isHindi ? "नया खेत जोड़ें" : "Add New Field"}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <AddFieldModal
          onSave={handleAddFieldSave}
          onClose={() => setShowAddFieldModal(false)}
          language={language}
        />
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <EditFieldModal
          field={editingField}
          onSave={handleEditFieldSave}
          onClose={() => setEditingField(null)}
          language={language}
        />
      )}

      {/* Delete Field Confirmation Modal */}
      {deletingField && (
        <div className="modal-overlay" onClick={() => setDeletingField(null)}>
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
                ? `क्या आप वाकई खेत "${translateProfileText(deletingField.field_name, language)}" को हटाना चाहते हैं? इसके सभी संबंधित अलर्ट और डेटा हटा दिए जाएंगे।`
                : `Are you sure you want to delete field "${deletingField.field_name}"? All associated data and alerts will be permanently removed.`}
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeletingField(null)}
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
