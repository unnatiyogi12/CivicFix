import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "./LocationDetail.css";

interface LocationDetailProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  ward?: string;
  zone?: string;
}

const LocationDetail: React.FC<LocationDetailProps> = ({
  latitude,
  longitude,
  address,
  ward,
  zone,
}) => {
  // Default Gwalior location if coordinates are not available
  const lat = latitude ?? 26.2183;
  const lng = longitude ?? 78.1828;

  const position: [number, number] = [lat, lng];

  // Fix Leaflet default marker icon
  const markerIcon = new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className="map-container">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "350px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position} icon={markerIcon}>
          <Popup>
            <div>
              <strong>Complaint Location</strong>

              {address && (
                <p>
                  <strong>Address:</strong> {address}
                </p>
              )}

              {ward && (
                <p>
                  <strong>Ward:</strong> {ward}
                </p>
              )}

              {zone && (
                <p>
                  <strong>Zone:</strong> {zone}
                </p>
              )}

              <p>
                <strong>Coordinates:</strong>
                <br />
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationDetail;