import { useState } from "react";
import "./ComplaintForm.css";

import ImageUpload from "./ImageUpload";
import GeoLocation from "./GeoLocation";
import LiveLocation from "./LiveLocation";
import AddressInput from "./AddressInput";
import MyComplaints from "./MyComplaints";

// ======================================================
// AI CLASSIFICATION TYPE
// ======================================================

interface AIClassification {
  isCivic: boolean | null;
  area: string;
  subcategory: string;
  subcategorySource: string;
  severity: string;
  department: string;
  priorityScore: number;
  priority: string;
  recommendedAction: string;
}

// ======================================================
// LOCATION INTELLIGENCE TYPE
// ======================================================

interface LocationIntelligence {
  latitude: number | null;
  longitude: number | null;
  address: string;
  ward: string;
  wardCode: string;
  zone: string;
  municipality: string;
  ulbCode: string;
  district: string;
  state: string;
  jurisdiction: string;
  source: string;
}

// ======================================================
// DUPLICATE DETECTION TYPE
// ======================================================

interface DuplicateDetection {
  isDuplicate: boolean;
  similarityScore: number;
  matchedComplaintId: string | null;
  message: string;
}

// ======================================================
// INCIDENT TYPE
// ======================================================

interface Incident {
  id: string;
  incidentId: string;
  complaintCount: number;
  status: string;
}

// ======================================================
// COMPLETE AI RESULT
// ======================================================

interface AIResult {
  aiClassification: AIClassification;
  location: LocationIntelligence | null;
  duplicateDetection: DuplicateDetection;
  incident: Incident | null;
}

// ======================================================
// COMPONENT
// ======================================================

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
  // AI RESULT STATE
  // ====================================================

  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // ====================================================
  // FORM RESET KEY
  // ====================================================

  /*
   * Changing this key forces all child components
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

    // VERY IMPORTANT:
    // Clear all AI intelligence / mapping result
    setAiResult(null);

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

    // Clear any previous AI result before a new submission
    setAiResult(null);

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
        "https://civicfix-yrdw.onrender.com/api/complaints",
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
      // STORE AI RESULT TEMPORARILY
      // =================================================

      /*
       * We intentionally process the response here,
       * but immediately clear the result after the
       * complaint has been saved.
       *
       * The full result will be available in
       * My Complaints / Complaint Details.
       */

      let submittedAIResult: AIResult | null = null;

      if (data.aiClassification) {
        submittedAIResult = {
          aiClassification: {
            isCivic:
              data.aiClassification.isCivic ??
              null,

            area:
              data.aiClassification.area ??
              "",

            subcategory:
              data.aiClassification.subcategory ??
              "",

            subcategorySource:
              data.aiClassification.subcategorySource ??
              "ml_model",

            severity:
              data.aiClassification.severity ??
              "",

            department:
              data.aiClassification.department ??
              "",

            priorityScore:
              data.aiClassification.priorityScore ??
              data.priorityScore ??
              0,

            priority:
              data.aiClassification.priority ??
              data.priority ??
              "",

            recommendedAction:
              data.aiClassification.recommendedAction ??
              data.recommendedAction ??
              "",
          },

          // =================================================
          // LOCATION
          // =================================================

          location: data.location
            ? {
                latitude:
                  data.location.latitude ??
                  null,

                longitude:
                  data.location.longitude ??
                  null,

                address:
                  data.location.address ??
                  "",

                ward:
                  data.location.ward ??
                  "",

                wardCode:
                  data.location.wardCode ??
                  "",

                zone:
                  data.location.zone ??
                  "",

                municipality:
                  data.location.municipality ??
                  "",

                ulbCode:
                  data.location.ulbCode ??
                  "",

                district:
                  data.location.district ??
                  "",

                state:
                  data.location.state ??
                  "",

                jurisdiction:
                  data.location.jurisdiction ??
                  "",

                source:
                  data.location.source ??
                  "",
              }
            : null,

          // =================================================
          // DUPLICATE DETECTION
          // =================================================

          duplicateDetection:
            data.duplicateDetection
              ? {
                  isDuplicate:
                    data.duplicateDetection
                      .isDuplicate ??
                    false,

                  similarityScore:
                    data.duplicateDetection
                      .similarityScore ??
                    0,

                  matchedComplaintId:
                    data.duplicateDetection
                      .matchedComplaintId ??
                    null,

                  message:
                    data.duplicateDetection
                      .message ??
                    "",
                }
              : {
                  isDuplicate: false,

                  similarityScore: 0,

                  matchedComplaintId: null,

                  message:
                    "No duplicate information available.",
                },

          // =================================================
          // INCIDENT
          // =================================================

          incident: data.incident
            ? {
                id:
                  data.incident.id ??
                  "",

                incidentId:
                  data.incident.incidentId ??
                  "",

                complaintCount:
                  data.incident.complaintCount ??
                  0,

                status:
                  data.incident.status ??
                  "",
              }
            : null,
        };
      }

      console.log(
        "🤖 AI result processed:",
        submittedAIResult
      );

      // =================================================
      // IMPORTANT
      // =================================================
      //
      // We DO NOT keep AI result on the submission page.
      //
      // Complaint is already saved in MongoDB.
      // User can see complete AI intelligence from
      // My Complaints -> Complaint Details.
      // =================================================

      setAiResult(null);

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