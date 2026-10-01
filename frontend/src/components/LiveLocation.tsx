import {
  MapContainer,
  TileLayer,
  Marker,
  useMap
} from "react-leaflet";
import "./ComplaintForm.css";

import "leaflet/dist/leaflet.css";


interface LiveLocationProps {
  latitude: number;
  longitude: number;
}

function MapUpdater({
  latitude,
  longitude
}: LiveLocationProps) {

  const map = useMap();

  map.setView(
    [latitude, longitude],
    16
  );

  return null;
}

function LiveLocation({
  latitude,
  longitude
}: LiveLocationProps) {

  const position: [number, number] = [
    latitude,
    longitude
  ];


  return (
    <div className="map-container">

      <MapContainer
        center={position}
        zoom={16}
        style={{
          height: "350px",
          width: "100%"
        }}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={position}
        />

        <MapUpdater
          latitude={latitude}
          longitude={longitude}
        />

      </MapContainer>

    </div>
  );
}

export default LiveLocation;