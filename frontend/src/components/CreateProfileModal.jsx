import React, { useState } from "react";
import {
  User,
  MapPin,
  Phone,
  Check,
  X,
  Sprout,
  Hash,
  Loader2,
} from "lucide-react";
import { translateProfileText } from "../utils/transliterate";
import {
  INDIAN_STATES,
  DISTRICTS_BY_STATE,
  fetchPincodeDetails,
} from "../utils/indiaRegions";
import SearchableSelect from "./SearchableSelect";
import "../styles/CreateProfileModal.css";

export default function CreateProfileModal({
  initialProfile,
  onSave,
  onClose,
  language = "hi",
}) {
  const isHindi = language === "hi";

  const [name, setName] = useState(
    initialProfile?.name &&
      initialProfile.name.toLowerCase() !== "anant" &&
      initialProfile.name.toLowerCase() !== "farmer"
      ? initialProfile.name
      : "",
  );
  const [selectedState, setSelectedState] = useState(
    initialProfile?.state || "",
  );
  const [district, setDistrict] = useState(initialProfile?.district || "");
  const [pincode, setPincode] = useState(
    initialProfile?.pincode && initialProfile.pincode !== "141001"
      ? initialProfile.pincode
      : "",
  );
  const [phone, setPhone] = useState(
    initialProfile?.phone || "+91 9981087718",
  );

  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState("");

  // Formatted State Options for SearchableSelect
  const stateOptions = INDIAN_STATES.map((st) => ({
    value: st.en,
    label: st.en,
    subLabel: st.hi,
    displayLabel: isHindi ? `${st.hi} (${st.en})` : `${st.en} (${st.hi})`,
  }));

  // Formatted District Options based on selected State
  const currentDistrictList = selectedState
    ? DISTRICTS_BY_STATE[selectedState] || []
    : [];
  const districtOptions = currentDistrictList.map((d) => ({
    value: d.en,
    label: d.en,
    subLabel: d.hi,
    displayLabel: isHindi ? `${d.hi} (${d.en})` : `${d.en} (${d.hi})`,
  }));

  // Handle Pincode Auto Lookup
  const handlePincodeChange = async (e) => {
    const val = e.target.value;
    setPincode(val);
    setPincodeStatus("");

    if (val.length === 6 && !isNaN(val)) {
      setIsSearchingPincode(true);
      const details = await fetchPincodeDetails(val);
      setIsSearchingPincode(false);

      if (details) {
        if (details.state) setSelectedState(details.state);
        if (details.district) setDistrict(details.district);
        setPincodeStatus(
          isHindi
            ? `✓ मिला: ${details.district}, ${details.state}`
            : `✓ Found: ${details.district}, ${details.state}`,
        );
      } else {
        setPincodeStatus(
          isHindi
            ? "पिनकोड की जानकारी प्राप्त हो रही है..."
            : "Pincode API lookup active",
        );
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    const locationString =
      district && selectedState
        ? `${district}, ${selectedState}`
        : selectedState || district || "";

    onSave({
      name: name.trim(),
      location: locationString,
      state: selectedState,
      district,
      pincode: pincode.trim(),
      phone: phone.trim(),
      isCreated: true,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-header-title">
            <Sprout size={24} className="modal-icon" />
            <h2>
              {isHindi ? "किसान प्रोफाइल दर्ज करें" : "Create Farmer Profile"}
            </h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="modal-close-btn">
              <X size={20} />
            </button>
          )}
        </div>

        <p className="modal-subtitle">
          {isHindi
            ? "अपना नाम, राज्य, जिला और संपर्क विवरण दर्ज करें।"
            : "Enter your name, state, district, and contact details."}
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Farmer Name */}
          <div className="form-field">
            <label>
              <User size={16} />
              <span>{isHindi ? "आपका नाम (Farmer Name)" : "Full Name"}</span>
            </label>
            <input
              type="text"
              placeholder={
                isHindi ? "अपना पूरा नाम दर्ज करें" : "Enter your full name"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Searchable State / Region Dropdown */}
          <div className="form-field">
            <label>
              <MapPin size={16} />
              <span>
                {isHindi
                  ? "राज्य / क्षेत्र (State / Region)"
                  : "State / Region"}
              </span>
            </label>
            <SearchableSelect
              options={stateOptions}
              value={selectedState}
              onChange={(newState) => {
                setSelectedState(newState);
                const firstDist = DISTRICTS_BY_STATE[newState]?.[0]?.en || "";
                if (firstDist) setDistrict(firstDist);
              }}
              placeholder={
                isHindi
                  ? "राज्य चुनें या खोजें..."
                  : "Select or search state..."
              }
              isHindi={isHindi}
            />
          </div>

          {/* Searchable District / City Dropdown */}
          <div className="form-field">
            <label>
              <MapPin size={16} />
              <span>
                {isHindi ? "जिला / शहर (District / City)" : "District / City"}
              </span>
            </label>
            <SearchableSelect
              options={districtOptions}
              value={district}
              onChange={(newDist) => setDistrict(newDist)}
              placeholder={
                isHindi
                  ? "जिला चुनें या खोजें..."
                  : "Select or search district..."
              }
              isHindi={isHindi}
            />
          </div>

          {/* Pincode Field with API Auto-lookup */}
          <div className="form-field">
            <label>
              <Hash size={16} />
              <span>{isHindi ? "पिनकोड (Pincode)" : "Pincode"}</span>
            </label>
            <div className="input-with-loader">
              <input
                type="text"
                maxLength={6}
                placeholder={
                  isHindi
                    ? "6 अंकों का पिनकोड (उदा. 141001)"
                    : "6-digit pincode (e.g. 141001)"
                }
                value={pincode}
                onChange={handlePincodeChange}
              />
              {isSearchingPincode && (
                <Loader2 size={18} className="pincode-spinner" />
              )}
            </div>
            {pincodeStatus && (
              <span className="pincode-status-msg">{pincodeStatus}</span>
            )}
          </div>

          {/* Contact Number */}
          <div className="form-field">
            <label>
              <Phone size={16} />
              <span>
                {isHindi ? "संपर्क नंबर (Contact Number)" : "Contact Number"}
              </span>
            </label>
            <input
              type="tel"
              placeholder={
                isHindi
                  ? "मोबाइल नंबर (उदा. +91 9981087718)"
                  : "Mobile number (e.g. +91 9981087718)"
              }
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              <Check size={18} />
              <span>
                {isHindi ? "प्रोफाइल सहेजें (Save Profile)" : "Save Profile"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
