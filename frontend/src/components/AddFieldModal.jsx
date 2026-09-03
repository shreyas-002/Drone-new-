import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Check,
  X,
  Sprout,
  Calendar,
  Layers,
  Droplet,
  Hash,
} from "lucide-react";
import LocationMapPicker from "./LocationMapPicker";
import "../styles/AddFieldModal.css";

export default function AddFieldModal({ onSave, onClose, language = "hi" }) {
  const isHindi = language === "hi";

  const [fieldName, setFieldName] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("acres");
  const [crop, setCrop] = useState("Wheat");
  const [sowingDate, setSowingDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [soilType, setSoilType] = useState("Alluvial");
  const [irrigationType, setIrrigationType] = useState("Canal");

  // Location mode: 'gps' or 'map'
  const [locationMode, setLocationMode] = useState("map");
  const [latitude, setLatitude] = useState(26.9124);
  const [longitude, setLongitude] = useState(75.7873);
  const [gpsStatus, setGpsStatus] = useState("");

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(
        isHindi
          ? "ब्राउज़र GPS समर्थित नहीं है"
          : "Browser Geolocation not supported",
      );
      return;
    }
    setGpsStatus(
      isHindi ? "GPS स्थान प्राप्त हो रहा है..." : "Fetching GPS location...",
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsStatus(
          isHindi ? "✓ GPS स्थान प्राप्त हो गया" : "✓ GPS location acquired",
        );
      },
      (error) => {
        setGpsStatus(
          isHindi
            ? "GPS प्राप्त करने में विफल। कृपया नक्शा चुनें।"
            : "GPS failed. Please use map picker.",
        );
      },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedArea = parseFloat(area);
    if (!fieldName || !area || isNaN(parsedArea) || parsedArea <= 0 || !crop || !sowingDate) return;

    onSave({
      field_name: fieldName,
      area: parsedArea,
      area_unit: areaUnit,
      crop: crop,
      sowing_date: sowingDate,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      soil_type: soilType,
      irrigation_type: irrigationType,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card add-field-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-title">
            <Sprout size={24} className="modal-icon" />
            <h2>{isHindi ? "नया खेत पंजीकृत करें" : "Register New Field"}</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-field-form">
          {/* SECTION 1: बुनियादी विवरण */}
          <div className="form-section-card">
            <h3 className="form-section-header-title">
              <Sprout size={18} className="sec-icon" />
              <span>{isHindi ? "बुनियादी खेत विवरण" : "Basic Field Info"}</span>
            </h3>

            <div className="form-grid-2">
              <div className="form-field">
                <label>
                  <span>{isHindi ? "खेत का नाम" : "Field Name"} *</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    isHindi ? "उदा. खेत 1" : "e.g. Field 1 / North Farm"
                  }
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  <span>{isHindi ? "मुख्य फसल" : "Crop"} *</span>
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="form-select"
                >
                  <option value="Wheat">
                    {isHindi ? "गेहूं (Wheat)" : "Wheat"}
                  </option>
                  <option value="Rice">
                    {isHindi ? "चावल / धान (Rice)" : "Rice / Paddy"}
                  </option>
                  <option value="Cotton">
                    {isHindi ? "कपास (Cotton)" : "Cotton"}
                  </option>
                  <option value="Mustard">
                    {isHindi ? "सरसों (Mustard)" : "Mustard"}
                  </option>
                  <option value="Tomato">
                    {isHindi ? "टमाटर (Tomato)" : "Tomato"}
                  </option>
                  <option value="Potato">
                    {isHindi ? "आलू (Potato)" : "Potato"}
                  </option>
                  <option value="Maize">
                    {isHindi ? "मक्का (Maize)" : "Maize"}
                  </option>
                  <option value="Sugarcane">
                    {isHindi ? "गन्ना (Sugarcane)" : "Sugarcane"}
                  </option>
                  <option value="Gram">
                    {isHindi ? "चना (Gram)" : "Gram"}
                  </option>
                  <option value="Soybean">
                    {isHindi ? "सोयाबीन (Soybean)" : "Soybean"}
                  </option>
                  <option value="Onion">
                    {isHindi ? "प्याज (Onion)" : "Onion"}
                  </option>
                  <option value="Chilli">
                    {isHindi ? "मिर्च (Chilli)" : "Chilli"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: क्षेत्रफल एवं बुवाई */}
          <div className="form-section-card">
            <h3 className="form-section-header-title">
              <Hash size={18} className="sec-icon" />
              <span>{isHindi ? "क्षेत्रफल एवं बुआई" : "Area & Sowing"}</span>
            </h3>

            <div className="form-grid-3">
              <div className="form-field">
                <label>
                  <span>{isHindi ? "क्षेत्रफल" : "Field Area"} *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="2.5"
                  value={area}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseFloat(val) >= 0) {
                      setArea(val);
                    }
                  }}
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  <span>{isHindi ? "इकाई" : "Area Unit"} *</span>
                </label>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="form-select"
                >
                  <option value="acres">
                    {isHindi ? "एकड़ (Acres)" : "Acres"}
                  </option>
                  <option value="hectares">
                    {isHindi ? "हेक्टेयर (Hectares)" : "Hectares"}
                  </option>
                  <option value="bigha">
                    {isHindi ? "बीघा (Bigha)" : "Bigha"}
                  </option>
                  <option value="sq_km">
                    {isHindi ? "वर्ग किमी (Sq. Km)" : "Sq. Km"}
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  <Calendar size={16} />
                  <span>
                    {isHindi ? "बुआई की तारीख" : "Sowing Date"} *
                  </span>
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: मिट्टी एवं सिंचाई */}
          <div className="form-section-card">
            <h3 className="form-section-header-title">
              <Layers size={18} className="sec-icon" />
              <span>{isHindi ? "मिट्टी एवं सिंचाई प्रणाली" : "Soil & Irrigation"}</span>
            </h3>

            <div className="form-grid-2">
              <div className="form-field">
                <label>
                  <span>
                    {isHindi ? "मिट्टी का प्रकार" : "Soil Type"}
                  </span>
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="form-select"
                >
                  <option value="Alluvial">
                    {isHindi ? "जलोढ़ मिट्टी (Alluvial)" : "Alluvial Soil"}
                  </option>
                  <option value="Black Soil">
                    {isHindi ? "काली मिट्टी (Black Soil)" : "Black Soil"}
                  </option>
                  <option value="Loamy Soil">
                    {isHindi ? "दोमट मिट्टी (Loamy Soil)" : "Loamy Soil"}
                  </option>
                  <option value="Clay Soil">
                    {isHindi ? "चिकनी मिट्टी (Clay Soil)" : "Clay Soil"}
                  </option>
                  <option value="Sandy Soil">
                    {isHindi ? "बलुई मिट्टी (Sandy Soil)" : "Sandy Soil"}
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>
                  <span>
                    {isHindi ? "सिंचाई का स्रोत" : "Irrigation Source"}
                  </span>
                </label>
                <select
                  value={irrigationType}
                  onChange={(e) => setIrrigationType(e.target.value)}
                  className="form-select"
                >
                  <option value="Canal">
                    {isHindi ? "नहरी सिंचाई (Canal)" : "Canal Irrigation"}
                  </option>
                  <option value="Tubewell">
                    {isHindi ? "नलकूप / बोरवेल (Tubewell)" : "Tubewell / Borewell"}
                  </option>
                  <option value="Drip">
                    {isHindi ? "ड्रिप सिंचाई (Drip)" : "Drip Irrigation"}
                  </option>
                  <option value="Sprinkler">
                    {isHindi ? "फव्वारा सिंचाई (Sprinkler)" : "Sprinkler"}
                  </option>
                  <option value="Rainfed">
                    {isHindi ? "वर्षा आधारित (Rainfed)" : "Rainfed"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: भौगोलिक स्थान */}
          <div className="location-section-box">
            <div className="location-top-bar">
              <h3 className="form-section-header-title" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <MapPin size={18} className="sec-icon" />
                <span>{isHindi ? "खेत का सटीक स्थान" : "Field Location"}</span>
              </h3>

              <div className="location-mode-buttons-row">
                <button
                  type="button"
                  className={`location-mode-btn ${locationMode === "map" ? "active" : ""}`}
                  onClick={() => setLocationMode("map")}
                >
                  <MapPin size={15} />
                  <span>{isHindi ? "नक्शे पर चुनें" : "Select on Map"}</span>
                </button>
                <button
                  type="button"
                  className={`location-mode-btn ${locationMode === "gps" ? "active" : ""}`}
                  onClick={() => {
                    setLocationMode("gps");
                    handleUseGps();
                  }}
                >
                  <Navigation size={15} />
                  <span>{isHindi ? "वर्तमान GPS स्थान" : "Use GPS"}</span>
                </button>
              </div>
            </div>

            {gpsStatus && <p className="gps-status-text">{gpsStatus}</p>}

            <div className="map-picker-wrapper">
              <LocationMapPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                language={language}
              />
            </div>

            <div className="coords-display-strip">
              <span>
                {isHindi ? "अक्षांश (Lat):" : "Latitude:"}{" "}
                <strong>{latitude.toFixed(5)}</strong>
              </span>
              <span>
                {isHindi ? "देशांतर (Lng):" : "Longitude:"}{" "}
                <strong>{longitude.toFixed(5)}</strong>
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              {isHindi ? "रद्द करें" : "Cancel"}
            </button>
            <button type="submit" className="btn-save-field">
              <Check size={18} />
              <span>{isHindi ? "खेत सहेजें" : "Save Field"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
