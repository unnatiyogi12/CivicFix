import { useEffect, useState } from "react";
import "./GovernmentDashboard.css";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category?: string;
  severity?: string;
  civicFixStatus?: string;
  status?: string;
  governmentStatus?: string;

  governmentAction?: {
    receivedAt?: string | null;
    acceptedAt?: string | null;
    workStartedAt?: string | null;
    resolutionSubmittedAt?: string | null;
    resolutionNote?: string;
    proofUrls?: string[];
    lastUpdatedAt?: string | null;
  };

  governmentRouting?: {
    serviceName?: string;
    authorityName?: string;
    department?: string;
    complaintChannel?: string;
    officialUrl?: string;
    complaintUrl?: string;
    complaintPhone?: string;
  };

  location?: {
    address?: string;
    ward?: string;
    wardCode?: string;
    zone?: string;
    municipality?: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };

  userId?: {
    name?: string;
    email?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

const GOVERNMENT_STATUSES = [
  "Not Received",
  "Received",
  "Accepted",
  "Work Started",
  "In Progress",
  "Resolution Submitted",
];

function GovernmentDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resolutionNote, setResolutionNote] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([""]);

  // =========================================================
  // FETCH FORWARDED COMPLAINTS
  // =========================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Government authentication required.");
        return;
      }

      /*
       * The existing admin/all endpoint is protected for admin,
       * so government dashboard uses the government complaints
       * endpoint below.
       *
       * If your backend does not yet expose this GET endpoint,
       * we will add it next.
       */

      const response = await fetch(
        "https://civicfix-backend-ce2z.onrender.com/api/complaints/government/all",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch government complaints."
        );
      }

      setComplaints(
        Array.isArray(data.complaints) ? data.complaints : []
      );
    } catch (err) {
      console.error("Government complaints error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load government complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =========================================================
  // GOVERNMENT STATUS UPDATE
  // =========================================================

  const updateGovernmentStatus = async (newStatus: string) => {
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Government authentication required.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/government/${selectedComplaint._id}/action`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update government status."
        );
      }

      const updatedComplaint: Complaint =
        data.complaint || {
          ...selectedComplaint,
          governmentStatus: newStatus,
        };

      setSelectedComplaint(updatedComplaint);

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint._id === selectedComplaint._id
            ? updatedComplaint
            : complaint
        )
      );

      setSuccess(`Status updated to "${newStatus}".`);

      await fetchComplaints();
    } catch (err) {
      console.error("Government status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update government status."
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // RESOLUTION SUBMISSION
  // =========================================================

  const submitResolution = async () => {
    if (!selectedComplaint) return;

    if (!resolutionNote.trim()) {
      setError("Please enter the resolution/action taken.");
      return;
    }

    const cleanedProofUrls = proofUrls
      .map((url) => url.trim())
      .filter(Boolean);

    if (cleanedProofUrls.length === 0) {
      setError("Please provide at least one proof URL.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Government authentication required.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/government/${selectedComplaint._id}/action`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Resolution Submitted",
            resolutionNote: resolutionNote.trim(),
            proofUrls: cleanedProofUrls,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit resolution."
        );
      }

      const updatedComplaint: Complaint = data.complaint;

      setSelectedComplaint(updatedComplaint);

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint._id === selectedComplaint._id
            ? updatedComplaint
            : complaint
        )
      );

      setResolutionNote("");
      setProofUrls([""]);

      setSuccess(
        "Resolution submitted successfully. It is now waiting for admin verification."
      );

      await fetchComplaints();
    } catch (err) {
      console.error("Resolution submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit resolution."
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // PROOF URL
  // =========================================================

  const addProofUrl = () => {
    if (proofUrls.length >= 10) return;

    setProofUrls([...proofUrls, ""]);
  };

  const removeProofUrl = (index: number) => {
    if (proofUrls.length === 1) {
      setProofUrls([""]);
      return;
    }

    setProofUrls(
      proofUrls.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const updateProofUrl = (index: number, value: string) => {
    setProofUrls(
      proofUrls.map((url, currentIndex) =>
        currentIndex === index ? value : url
      )
    );
  };

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const getStatusIndex = (status?: string) => {
    return GOVERNMENT_STATUSES.indexOf(status || "Not Received");
  };

  const getNextStatus = (status?: string) => {
    const currentIndex = getStatusIndex(status);

    if (
      currentIndex < 0 ||
      currentIndex >= GOVERNMENT_STATUSES.length - 2
    ) {
      return null;
    }

    return GOVERNMENT_STATUSES[currentIndex + 1];
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // DETAIL VIEW
  // =========================================================

  if (selectedComplaint) {
    const governmentStatus =
      selectedComplaint.governmentStatus || "Not Received";

    const statusIndex = getStatusIndex(governmentStatus);
    const nextStatus = getNextStatus(governmentStatus);

    return (
      <div className="government-page">

        {/* HEADER */}
        <div className="government-detail-header">

          <button
            type="button"
            className="government-back-btn"
            onClick={() => {
              setSelectedComplaint(null);
              setError("");
              setSuccess("");
            }}
          >
            ← Back to Complaints
          </button>

          <div className="government-heading">
            <span>GOVERNMENT PORTAL</span>
            <h1>Complaint Details</h1>
            <p>Manage the operational resolution of this complaint.</p>
          </div>

          <div className="government-role-badge">
            🏛️ Government
          </div>

        </div>

        {/* MESSAGES */}

        {success && (
          <div className="government-success">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="government-error">
            ⚠️ {error}
          </div>
        )}

        {/* STATUS CARD */}

        <div className="government-card">

          <div className="government-card-header">
            <div>
              <span>OPERATIONAL STATUS</span>
              <h2>{governmentStatus}</h2>
            </div>

            <div className="government-current-status">
              {governmentStatus}
            </div>
          </div>

          {/* TIMELINE */}

          <div className="government-timeline">

            {GOVERNMENT_STATUSES.map((status, index) => {

              const completed = index < statusIndex;
              const active = index === statusIndex;

              return (
                <div
                  key={status}
                  className={`government-timeline-item
                    ${completed ? "completed" : ""}
                    ${active ? "active" : ""}
                  `}
                >
                  <div className="government-timeline-dot">
                    {completed ? "✓" : index + 1}
                  </div>

                  <strong>{status}</strong>
                </div>
              );
            })}

          </div>

          {/* NEXT ACTION */}

          {nextStatus && governmentStatus !== "Resolution Submitted" && (
            <div className="government-next-action">

              <div>
                <span>Next Government Action</span>
                <strong>{nextStatus}</strong>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => updateGovernmentStatus(nextStatus)}
              >
                {updating
                  ? "Updating..."
                  : `Mark as ${nextStatus}`}
              </button>

            </div>
          )}

          {governmentStatus === "Resolution Submitted" && (
            <div className="government-waiting">
              ⏳ Resolution submitted. Waiting for CivicFix admin
              verification.
            </div>
          )}

        </div>

        {/* COMPLAINT INFORMATION */}

        <div className="government-card">

          <div className="government-card-header">
            <div>
              <span>COMPLAINT</span>
              <h2>{selectedComplaint.title}</h2>
            </div>
          </div>

          <div className="government-description">
            {selectedComplaint.description}
          </div>

          <div className="government-info-grid">

            <div>
              <span>Category</span>
              <strong>{selectedComplaint.category || "N/A"}</strong>
            </div>

            <div>
              <span>Severity</span>
              <strong>{selectedComplaint.severity || "N/A"}</strong>
            </div>

            <div>
              <span>Citizen</span>
              <strong>
                {selectedComplaint.userId?.name || "N/A"}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {selectedComplaint.userId?.email || "N/A"}
              </strong>
            </div>

            <div>
              <span>CivicFix Status</span>
              <strong>
                {selectedComplaint.civicFixStatus ||
                  selectedComplaint.status ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Created</span>
              <strong>
                {formatDate(selectedComplaint.createdAt)}
              </strong>
            </div>

          </div>

        </div>

        {/* LOCATION */}

        <div className="government-card">

          <div className="government-card-header">
            <div>
              <span>LOCATION</span>
              <h2>Complaint Location</h2>
            </div>
          </div>

          <div className="government-location">

            <strong>
              {selectedComplaint.location?.address ||
                "Address not available"}
            </strong>

            <div className="government-location-grid">

              <div>
                <span>Ward</span>
                <strong>
                  {selectedComplaint.location?.ward || "N/A"}
                </strong>
              </div>

              <div>
                <span>Ward Code</span>
                <strong>
                  {selectedComplaint.location?.wardCode || "N/A"}
                </strong>
              </div>

              <div>
                <span>Zone</span>
                <strong>
                  {selectedComplaint.location?.zone || "N/A"}
                </strong>
              </div>

              <div>
                <span>Municipality</span>
                <strong>
                  {selectedComplaint.location?.municipality || "N/A"}
                </strong>
              </div>

              <div>
                <span>District</span>
                <strong>
                  {selectedComplaint.location?.district || "N/A"}
                </strong>
              </div>

              <div>
                <span>State</span>
                <strong>
                  {selectedComplaint.location?.state || "N/A"}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* GOVERNMENT ROUTING */}

        <div className="government-card">

          <div className="government-card-header">
            <div>
              <span>ROUTING</span>
              <h2>Government Authority</h2>
            </div>
          </div>

          <div className="government-info-grid">

            <div>
              <span>Authority</span>
              <strong>
                {selectedComplaint.governmentRouting
                  ?.authorityName || "N/A"}
              </strong>
            </div>

            <div>
              <span>Department</span>
              <strong>
                {selectedComplaint.governmentRouting
                  ?.department || "N/A"}
              </strong>
            </div>

            <div>
              <span>Service</span>
              <strong>
                {selectedComplaint.governmentRouting
                  ?.serviceName || "N/A"}
              </strong>
            </div>

            <div>
              <span>Channel</span>
              <strong>
                {selectedComplaint.governmentRouting
                  ?.complaintChannel || "N/A"}
              </strong>
            </div>

          </div>

        </div>

        {/* RESOLUTION */}

        {governmentStatus === "In Progress" && (
          <div className="government-card government-resolution-card">

            <div className="government-card-header">
              <div>
                <span>RESOLUTION</span>
                <h2>Submit Completed Work</h2>
              </div>
            </div>

            <p className="government-resolution-help">
              Work complete hone ke baad action taken ka description
              aur proof submit karo. Admin isko verify karega.
            </p>

            <label>
              Action Taken / Resolution Note
            </label>

            <textarea
              value={resolutionNote}
              onChange={(event) =>
                setResolutionNote(event.target.value)
              }
              placeholder="Describe what work was completed..."
              rows={5}
            />

            <div className="government-proof-header">

              <label>Proof URLs</label>

              <button
                type="button"
                onClick={addProofUrl}
                disabled={proofUrls.length >= 10}
              >
                + Add Proof
              </button>

            </div>

            {proofUrls.map((url, index) => (
              <div
                className="government-proof-input"
                key={index}
              >

                <input
                  type="url"
                  value={url}
                  onChange={(event) =>
                    updateProofUrl(index, event.target.value)
                  }
                  placeholder={`Proof URL ${index + 1}`}
                />

                <button
                  type="button"
                  onClick={() => removeProofUrl(index)}
                >
                  Remove
                </button>

              </div>
            ))}

            <button
              type="button"
              className="government-submit-resolution"
              disabled={updating}
              onClick={submitResolution}
            >
              {updating
                ? "Submitting..."
                : "✓ Submit Resolution for Admin Review"}
            </button>

          </div>
        )}

        {/* PREVIOUS RESOLUTION */}

        {selectedComplaint.governmentAction?.resolutionNote && (
          <div className="government-card">

            <div className="government-card-header">
              <div>
                <span>SUBMITTED RESOLUTION</span>
                <h2>Resolution Information</h2>
              </div>
            </div>

            <div className="government-resolution-note">
              <span>Action Taken</span>
              <p>
                {selectedComplaint.governmentAction.resolutionNote}
              </p>
            </div>

            <div className="government-proof-display">

              <span>Proof</span>

              {selectedComplaint.governmentAction.proofUrls?.length ? (
                selectedComplaint.governmentAction.proofUrls.map(
                  (url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📎 Proof {index + 1}
                    </a>
                  )
                )
              ) : (
                <p>No proof submitted.</p>
              )}

            </div>

          </div>
        )}

      </div>
    );
  }

  // =========================================================
  // LIST VIEW
  // =========================================================

  return (
    <div className="government-page">

      <div className="government-header">

        <div>
          <span className="government-eyebrow">
            CIVICFIX GOVERNMENT PORTAL
          </span>

          <h1>Government Dashboard</h1>

          <p>
            Manage forwarded civic complaints and update operational
            resolution status.
          </p>
        </div>

        <div className="government-header-right">

          <div className="government-total">
            <span>Forwarded Complaints</span>
            <strong>{complaints.length}</strong>
          </div>

          <button
            type="button"
            className="government-refresh-btn"
            onClick={fetchComplaints}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </div>

      </div>

      {error && (
        <div className="government-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="government-success">
          ✓ {success}
        </div>
      )}

      {loading ? (
        <div className="government-empty">
          <div className="government-loading-icon">⏳</div>
          <h2>Loading complaints...</h2>
          <p>Please wait.</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="government-empty">
          <div className="government-empty-icon">🏛️</div>
          <h2>No Forwarded Complaints</h2>
          <p>
            Complaints forwarded by CivicFix admin will appear here.
          </p>
        </div>
      ) : (
        <div className="government-complaints-grid">

          {complaints.map((complaint) => {

            const governmentStatus =
              complaint.governmentStatus || "Not Received";

            return (
              <div
                className="government-complaint-card"
                key={complaint._id}
              >

                <div className="government-card-top">

                  <div>
                    <span className="government-card-category">
                      {complaint.category || "Civic Complaint"}
                    </span>

                    <h2>{complaint.title}</h2>
                  </div>

                  <span className="government-status-badge">
                    {governmentStatus}
                  </span>

                </div>

                <p className="government-card-description">
                  {complaint.description}
                </p>

                <div className="government-mini-info">

                  <div>
                    <span>Severity</span>
                    <strong>
                      {complaint.severity || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Ward</span>
                    <strong>
                      {complaint.location?.ward || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Citizen</span>
                    <strong>
                      {complaint.userId?.name || "N/A"}
                    </strong>
                  </div>

                </div>

                <div className="government-card-footer">

                  <span>
                    {formatDate(complaint.createdAt)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedComplaint(complaint)
                    }
                  >
                    Manage Complaint →
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default GovernmentDashboard;