import { useState } from "react";
import "./GeoLocation.css";

interface GeoLocationProps {
  onLocationChange: (latitude: number, longitude: number) => void;
}

interface TestLocation {
  name: string;
  latitude: number;
  longitude: number;
}

const TEST_LOCATIONS: TestLocation[] = [
  {
    name: "Gwalior",
    latitude: 26.2183,
    longitude: 78.1828,
  },
  {
    name: "Dabra",
    latitude: 25.8914,
    longitude: 78.3322,
  },
  {
    name: "Bhopal",
    latitude: 23.2599,
    longitude: 77.4126,
  },
];

function GeoLocation({
  onLocationChange,
}: GeoLocationProps) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [testMode, setTestMode] = useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState("Gwalior");

  const [customLatitude, setCustomLatitude] =
    useState("");

  const [customLongitude, setCustomLongitude] =
    useState("");

  const [selectedCoordinates, setSelectedCoordinates] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);


  // =====================================================
  // CURRENT LOCATION
  // =====================================================

  const getCurrentLocation = () => {

    if (!navigator.geolocation) {

      setError(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(

      // SUCCESS
      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        console.log(
          "📍 Current Location:",
          latitude,
          longitude
        );

        onLocationChange(
          latitude,
          longitude
        );

        setSelectedCoordinates({
          latitude,
          longitude,
        });

        setLoading(false);
      },

      // ERROR
      (error) => {

        console.error(
          "Location Error:",
          error
        );

        setLoading(false);

        if (error.code === 1) {

          setError(
            "Location permission denied. Please allow location access."
          );

        } else if (error.code === 2) {

          setError(
            "Location is currently unavailable."
          );

        } else if (error.code === 3) {

          setError(
            "Location request timed out."
          );

        } else {

          setError(
            "Unable to get your location."
          );
        }
      },

      // OPTIONS
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };


  // =====================================================
  // TEST LOCATION
  // =====================================================

  const useTestLocation = () => {

    setError("");

    const location =
      TEST_LOCATIONS.find(
        (item) =>
          item.name === selectedLocation
      );

    if (!location) {

      setError(
        "Please select a test location."
      );

      return;
    }

    console.log(
      "🧪 Test Location:",
      location.name
    );

    console.log(
      "Latitude:",
      location.latitude
    );

    console.log(
      "Longitude:",
      location.longitude
    );

    onLocationChange(
      location.latitude,
      location.longitude
    );

    setSelectedCoordinates({
      latitude:
        location.latitude,

      longitude:
        location.longitude,
    });
  };


  // =====================================================
  // CUSTOM LOCATION
  // =====================================================

  const useCustomLocation = () => {

    setError("");

    const latitude =
      Number(customLatitude);

    const longitude =
      Number(customLongitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {

      setError(
        "Please enter a valid latitude between -90 and 90."
      );

      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {

      setError(
        "Please enter a valid longitude between -180 and 180."
      );

      return;
    }

    console.log(
      "🧪 Custom Test Location:",
      latitude,
      longitude
    );

    onLocationChange(
      latitude,
      longitude
    );

    setSelectedCoordinates({
      latitude,
      longitude,
    });
  };


  return (
    <div className="location-section">

      <h3>
        📍 Complaint Location
      </h3>


      {/* ================================================= */}
      {/* CURRENT LOCATION */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
      >
        {loading
          ? "Detecting Location..."
          : "📍 Use My Current Location"
        }
      </button>


      {/* ================================================= */}
      {/* TEST MODE */}
      {/* ================================================= */}

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >

          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) =>
              setTestMode(
                e.target.checked
              )
            }
          />

          🧪 Test / Simulate Location
        </label>


        {testMode && (

          <div
            style={{
              marginTop: "12px",
            }}
          >

            {/* ----------------------------------------- */}
            {/* PREDEFINED LOCATIONS */}
            {/* ----------------------------------------- */}

            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 500,
              }}
            >
              Select Test Location
            </label>

            <select
              value={selectedLocation}
              onChange={(e) =>
                setSelectedLocation(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginBottom: "10px",
              }}
            >

              {TEST_LOCATIONS.map(
                (location) => (

                  <option
                    key={location.name}
                    value={location.name}
                  >
                    {location.name}
                  </option>
                )
              )}

            </select>


            <button
              type="button"
              onClick={useTestLocation}
            >
              🧪 Use Selected Test Location
            </button>


            {/* ----------------------------------------- */}
            {/* CUSTOM COORDINATES */}
            {/* ----------------------------------------- */}

            <div
              style={{
                marginTop: "18px",
              }}
            >

              <p
                style={{
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Or enter any coordinates manually
              </p>


              <input
                type="number"
                step="any"
                placeholder="Latitude e.g. 23.2599"
                value={customLatitude}
                onChange={(e) =>
                  setCustomLatitude(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginBottom: "8px",
                  boxSizing: "border-box",
                }}
              />


              <input
                type="number"
                step="any"
                placeholder="Longitude e.g. 77.4126"
                value={customLongitude}
                onChange={(e) =>
                  setCustomLongitude(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginBottom: "8px",
                  boxSizing: "border-box",
                }}
              />


              <button
                type="button"
                onClick={
                  useCustomLocation
                }
              >
                📌 Use Custom Coordinates
              </button>

            </div>

          </div>
        )}

      </div>


      {/* ================================================= */}
      {/* SELECTED COORDINATES */}
      {/* ================================================= */}

      {selectedCoordinates && (

        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#f5f7fa",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >

          <strong>
            Selected Coordinates
          </strong>

          <div>
            Latitude:{" "}
            {selectedCoordinates.latitude}
          </div>

          <div>
            Longitude:{" "}
            {selectedCoordinates.longitude}
          </div>

        </div>
      )}


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <p className="location-error">
          {error}
        </p>
      )}

    </div>
  );
}

export default GeoLocation;