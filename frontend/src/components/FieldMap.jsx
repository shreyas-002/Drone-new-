import React, { useEffect, useRef } from "react";
import "../styles/FieldMap.css";

export default function FieldMap({ lat, lng, fieldName = "Field", crop = "" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window.L === "undefined") return;

    const L = window.L;

    // Initialize or update map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(mapInstanceRef.current);

      // Add field marker
      const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      marker
        .bindPopup(
          `<b>${fieldName}</b><br/>Crop: ${crop}<br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        )
        .openPopup();
    } else {
      mapInstanceRef.current.setView([lat, lng], 14);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, fieldName, crop]);

  return <div className="field-map-container" ref={mapRef}></div>;
}
