import { useState } from "react";

import "./ComplaintForm.css";

import ImageUpload from "./ImageUpload";
import GeoLocation from "./GeoLocation";
import LiveLocation from "./LiveLocation";
import AddressInput from "./AddressInput";
import MyComplaints from "./MyComplaints";

function ComplaintForm() {
  // ====================================================
  // COMPLAINT FORM STATES
  // ====================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");

  // ====================================================
  // LOCATION STATES
  // ====================================================

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  // ====================================================
  // UI STATES
  // ====================================================

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ====================================================
  // FORM RESET KEY
  // ====================================================

  /*
   * Changing this key forces child components
   * like ImageUpload / GeoLocation / AddressInput
   * to mount fresh after successful submission.
   */
  const [formKey, setFormKey] = useState(0);

  // ====================================================
  // ACTIVE VIEW
  // ====================================================

  const [activeView, setActiveView] = useState<
    "report" | "complaints"
  >("report");

  // ====================================================
  // RESET FORM COMPLETELY
  // ====================================================

  const resetComplaintForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Other");

    setAddress("");

    setLatitude(null);
    setLongitude(null);

    // Force child components to reset
    setFormKey((prev) => prev + 1);
  };

  // ====================================================
  // OPEN REPORT VIEW
  // ====================================================

  const openReportView = () => {
    setActiveView("report");
    setSuccess("");
    setError("");
  };

  // ====================================================
  // OPEN MY COMPLAINTS
  // ====================================================

  const openMyComplaints = () => {
    setActiveView("complaints");
  };

  // ====================================================
  // LOCATION CHANGE
  // ====================================================

  const handleLocationChange = (
    lat: number,
    lng: number
  ) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // ====================================================
  // SUBMIT COMPLAINT
  // ====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !title.trim() ||
      !description.trim() ||
      !address.trim()
    ) {
      setError(
        "Please fill title, description and address."
      );

      return;
    }

    // ==================================================
    // GET JWT TOKEN
    // ==================================================

    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "You are not logged in. Please login again."
      );

      return;
    }

    try {
      setLoading(true);

      // =================================================
      // SEND COMPLAINT TO BACKEND
      // =================================================

      console.log(
        "🤖 Sending complaint to CivicFix AI..."
      );

      console.log("Title:", title);

      console.log(
        "Description:",
        description
      );

      const response = await fetch(
        "https://civicfix-backend-ce2z.onrender.com/api/complaints",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            description,
            category,

            location: {
              address,
              latitude,
              longitude,
            },
          }),
        }
      );

      // =================================================
      // READ BACKEND RESPONSE
      // =================================================

      const data = await response.json();

      // =================================================
      // HANDLE ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to submit complaint."
        );
      }

      console.log(
        "✅ Complaint submitted successfully:",
        data
      );

      // =================================================
      // SUCCESS MESSAGE
      // =================================================

      setSuccess(
        "Complaint submitted successfully! 🎉"
      );

      // =================================================
      // COMPLETE FORM RESET
      // =================================================

      resetComplaintForm();

    } catch (error) {
      console.error(
        "❌ Complaint submission error:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="complaint-box">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="complaint-navigation">

        <button
          type="button"
          className={
            activeView === "report"
              ? "active"
              : ""
          }
          onClick={openReportView}
        >
          Report Issue
        </button>

        <button
          type="button"
          className={
            activeView === "complaints"
              ? "active"
              : ""
          }
          onClick={openMyComplaints}
        >
          My Complaints
        </button>

      </div>

      {/* =================================================
          REPORT ISSUE VIEW
      ================================================= */}

      {activeView === "report" ? (

        <>

          <h2>
            Report a Civic Issue
          </h2>

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (

            <div className="complaint-success">

              <strong>
                {success}
              </strong>

              <p>
                Your complaint has been registered
                successfully.
              </p>

              <button
                type="button"
                onClick={openMyComplaints}
              >
                View My Complaints
              </button>

            </div>

          )}

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (

            <p className="complaint-error">
              {error}
            </p>

          )}

          {/* =================================================
              COMPLAINT FORM
          ================================================= */}

          <form
            key={formKey}
            onSubmit={handleSubmit}
          >

            {/* ============================================
                TITLE
            ============================================= */}

            <label htmlFor="title">
              Complaint Title
            </label>

            <input
              id="title"
              type="text"
              placeholder="e.g. Large pothole near college"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              disabled={loading}
            />

            {/* ============================================
                DESCRIPTION
            ============================================= */}

            <label htmlFor="description">
              Describe the Issue
            </label>

            <textarea
              id="description"
              placeholder="Describe the problem in detail..."
              rows={5}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              disabled={loading}
            />

            {/* ============================================
                CATEGORY
            ============================================= */}

            <label htmlFor="category">
              Issue Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              disabled={loading}
            >

              <option value="Other">
                Other
              </option>

              <option value="Pothole">
                Pothole
              </option>

              <option value="Garbage">
                Garbage
              </option>

              <option value="Streetlight">
                Streetlight
              </option>

              <option value="Water Leakage">
                Water Leakage
              </option>

              <option value="Drainage">
                Drainage
              </option>

              <option value="Road Damage">
                Road Damage
              </option>

            </select>

            {/* ============================================
                IMAGE UPLOAD
            ============================================= */}

            <ImageUpload />

            {/* ============================================
                GEO LOCATION
            ============================================= */}

            <GeoLocation
              onLocationChange={
                handleLocationChange
              }
            />

            {/* ============================================
                ADDRESS
            ============================================= */}

            <AddressInput
              address={address}
              onAddressChange={
                setAddress
              }
            />

            {/* ============================================
                COORDINATES
            ============================================= */}

            {latitude !== null &&
              longitude !== null && (

                <>
                  <div className="coordinates">

                    <p>
                      <strong>
                        Latitude:
                      </strong>{" "}
                      {latitude}
                    </p>

                    <p>
                      <strong>
                        Longitude:
                      </strong>{" "}
                      {longitude}
                    </p>

                  </div>

                  <LiveLocation
                    latitude={latitude}
                    longitude={longitude}
                  />

                </>

              )}

            {/* ============================================
                SUBMIT BUTTON
            ============================================= */}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >

              {loading
                ? "Analyzing & Submitting..."
                : "Submit Complaint"}

            </button>

          </form>

        </>

      ) : (

        /* =================================================
           MY COMPLAINTS
        ================================================= */

        <MyComplaints />

      )}

    </div>
  );
}

export default ComplaintForm;