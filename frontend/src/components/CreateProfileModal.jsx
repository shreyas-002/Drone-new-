import React, { useState } from 'react'
import { User, MapPin, Phone, Check, X, Sprout, Hash, Loader2 } from 'lucide-react'
import { translateProfileText } from '../utils/transliterate'
import { INDIAN_STATES, DISTRICTS_BY_STATE, fetchPincodeDetails } from '../utils/indiaRegions'
import SearchableSelect from './SearchableSelect'
import '../styles/CreateProfileModal.css'

export default function CreateProfileModal({ initialProfile, onSave, onClose, language = 'hi' }) {
  const isHindi = language === 'hi'

  const [name, setName] = useState(initialProfile?.name || '')
  const [selectedState, setSelectedState] = useState(initialProfile?.state || 'Punjab')
  const [district, setDistrict] = useState(initialProfile?.district || 'Ludhiana')
  const [pincode, setPincode] = useState(initialProfile?.pincode || '141001')
  const [phone, setPhone] = useState(initialProfile?.phone || '+91 98765 43210')

  const [isSearchingPincode, setIsSearchingPincode] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState('')

  // Formatted State Options for SearchableSelect
  const stateOptions = INDIAN_STATES.map((st) => ({
    value: st.en,
    label: st.en,
    subLabel: st.hi,
    displayLabel: isHindi ? `${st.hi} (${st.en})` : `${st.en} (${st.hi})`
  }))

  // Formatted District Options based on selected State
  const currentDistrictList = DISTRICTS_BY_STATE[selectedState] || [
    { en: district, hi: translateProfileText(district, 'hi') }
  ]
  const districtOptions = currentDistrictList.map((d) => ({
    value: d.en,
    label: d.en,
    subLabel: d.hi,
    displayLabel: isHindi ? `${d.hi} (${d.en})` : `${d.en} (${d.hi})`
  }))

  // Handle Pincode Auto Lookup
  const handlePincodeChange = async (e) => {
    const val = e.target.value
    setPincode(val)
    setPincodeStatus('')

    if (val.length === 6 && !isNaN(val)) {
      setIsSearchingPincode(true)
      const details = await fetchPincodeDetails(val)
      setIsSearchingPincode(false)

      if (details) {
        if (details.state) setSelectedState(details.state)
        if (details.district) setDistrict(details.district)
        setPincodeStatus(
          isHindi
            ? `✓ मिला: ${details.district}, ${details.state}`
            : `✓ Found: ${details.district}, ${details.state}`
        )
      } else {
        setPincodeStatus(
          isHindi
            ? 'पिनकोड की जानकारी प्राप्त हो रही है...'
            : 'Pincode API lookup active'
        )
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !selectedState || !district || !phone) return

    const locationString = `${district}, ${selectedState}`

    onSave({
      name,
      location: locationString,
      state: selectedState,
      district,
      pincode,
      phone,
      isCreated: true
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-header-title">
            <Sprout size={24} className="modal-icon" />
            <h2>{isHindi ? 'किसान प्रोफाइल दर्ज करें' : 'Create Farmer Profile'}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="modal-close-btn">
              <X size={20} />
            </button>
          )}
        </div>

        <p className="modal-subtitle">
          {isHindi
            ? 'टाइप करके अपना राज्य, जिला और विवरण चुनें।'
            : 'Type to search and select your region, district, and details.'}
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Farmer Name */}
          <div className="form-field">
            <label>
              <User size={16} />
              <span>{isHindi ? 'आपका नाम (Farmer Name)' : 'Full Name'}</span>
            </label>
            <input
              type="text"
              placeholder={isHindi ? 'उदा. अनंत' : 'e.g. Anant'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Searchable State / Region Dropdown */}
          <div className="form-field">
            <label>
              <MapPin size={16} />
              <span>{isHindi ? 'राज्य / क्षेत्र (State / Region)' : 'State / Region'}</span>
            </label>
            <SearchableSelect
              options={stateOptions}
              value={selectedState}
              onChange={(newState) => {
                setSelectedState(newState)
                const firstDist = DISTRICTS_BY_STATE[newState]?.[0]?.en || ''
                if (firstDist) setDistrict(firstDist)
              }}
              placeholder={isHindi ? 'राज्य खोजें...' : 'Search State...'}
              isHindi={isHindi}
            />
          </div>

          {/* Searchable District / City Dropdown */}
          <div className="form-field">
            <label>
              <MapPin size={16} />
              <span>{isHindi ? 'जिला / शहर (District / City)' : 'District / City'}</span>
            </label>
            <SearchableSelect
              options={districtOptions}
              value={district}
              onChange={(newDist) => setDistrict(newDist)}
              placeholder={isHindi ? 'जिला खोजें...' : 'Search District...'}
              isHindi={isHindi}
            />
          </div>

          {/* Pincode Field with API Auto-lookup */}
          <div className="form-field">
            <label>
              <Hash size={16} />
              <span>{isHindi ? 'पिनकोड (Pincode)' : 'Pincode'}</span>
            </label>
            <div className="input-with-loader">
              <input
                type="text"
                maxLength={6}
                placeholder="141001"
                value={pincode}
                onChange={handlePincodeChange}
                required
              />
              {isSearchingPincode && <Loader2 size={18} className="pincode-spinner" />}
            </div>
            {pincodeStatus && <span className="pincode-status-msg">{pincodeStatus}</span>}
          </div>

          {/* Contact Number */}
          <div className="form-field">
            <label>
              <Phone size={16} />
              <span>{isHindi ? 'संपर्क नंबर (Contact Number)' : 'Contact Number'}</span>
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-profile-btn">
              <Check size={18} />
              <span>{isHindi ? 'प्रोफाइल सहेजें (Save Profile)' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
