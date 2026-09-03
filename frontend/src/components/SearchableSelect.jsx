import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import "../styles/SearchableSelect.css";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  isHindi = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      opt.label.toLowerCase().includes(search) ||
      opt.subLabel?.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selected-value-text">
          {selectedOption
            ? selectedOption.displayLabel || selectedOption.label
            : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`chevron-icon ${isOpen ? "rotated" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="dropdown-search-input"
              placeholder={
                isHindi ? "खोजें (Type to search)..." : "Type to search..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    className={`option-item ${isSelected ? "selected" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                  >
                    <span>{opt.displayLabel || opt.label}</span>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </li>
                );
              })
            ) : (
              <li className="no-options-found">
                {isHindi ? "कोई परिणाम नहीं मिला" : "No matching results found"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
