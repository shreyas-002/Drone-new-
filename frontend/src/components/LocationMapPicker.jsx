import React, { useEffect, useRef } from "react";
import "../styles/FieldMap.css";

export default function LocationMapPicker({
  initialLat = 26.9124,
  initialLng = 75.7873,
  onLocationSelect,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window.L === "undefined") return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [initialLat, initialLng],
        12,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(mapInstanceRef.current);

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(mapInstanceRef.current);
      markerRef.current
        .bindPopup("Selected Field Location. Drag pin or click map to change.")
        .openPopup();

      // Handle marker drag end
      markerRef.current.on("dragend", () => {
        const position = markerRef.current.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      // Handle map click
      mapInstanceRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        onLocationSelect(lat, lng);
      });
    } else {
      mapInstanceRef.current.setView([initialLat, initialLng], 12);
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng]);

  return (
    <div className="map-picker-wrapper">
      <div
        className="field-map-container"
        ref={mapRef}
        style={{ height: "320px" }}
      ></div>
      <p className="map-picker-instruction">
        📍 नक्शे पर कहीं भी क्लिक करें या पिन को अपने खेत के सटीक स्थान पर
        खींचें।
        <br />
        (Click anywhere on the map or drag the pin to pinpoint your field
        location)
      </p>
    </div>
  );
}
