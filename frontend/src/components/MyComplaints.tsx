import { useEffect, useState } from "react";
import "./MyComplaints.css";
import ComplaintDetails from "./ComplaintDetails";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;

  aiClassification?: {
    isCivic?: boolean | null;
    area?: string;
    subcategory?: string;
    subcategorySource?: string;
    severity?: string;
    department?: string;
  };

  priorityScore?: number;
  priority?: string;
  recommendedAction?: string;

  duplicateDetection?: {
    isDuplicate?: boolean;
    similarityScore?: number;
    matchedComplaintId?: string | null;
    message?: string;
  };

  incidentId?: {
    _id?: string;
    incidentId?: string;
    complaintCount?: number;
    status?: string;
  } | null;

  incidentStatus?: string;

  location: {
    address: string;
    latitude?: number;
    longitude?: number;
    ward?: string;
    wardCode?: string;
    zone?: string;
    municipality?: string;
    district?: string;
    state?: string;
    jurisdiction?: string;
  };

  createdAt: string;
  updatedAt?: string;
}

function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your complaints.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/complaints/my",
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
          data.message || "Failed to fetch complaints."
        );
      }

      setComplaints(data.complaints || []);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div className="my-complaints">
        <div className="complaints-header">
          <h2>My Complaints</h2>
          <p>Track the civic issues you have reported.</p>
        </div>

        <div className="complaints-loading">
          <div className="loading-spinner"></div>
          <p>Loading your complaints...</p>
        </div>
      </div>
    );
  }

  /* =========================
     Error
  ========================= */

  if (error) {
    return (
      <div className="my-complaints">
        <div className="complaints-error-box">
          <span>⚠️</span>
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchComplaints}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     Complaint Details
  ========================= */

  if (selectedComplaint) {
    return (
      <ComplaintDetails
        complaint={selectedComplaint}
        onBack={() => setSelectedComplaint(null)}
      />
    );
  }

  /* =========================
     Helpers
  ========================= */

  const getPriorityClass = (priority?: string) => {
    return (priority || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  const getSeverityClass = (severity?: string) => {
    return (severity || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  /* =========================
     My Complaints
  ========================= */

  return (
    <div className="my-complaints">

      {/* HEADER */}

      <div className="complaints-header">
        <div>
          <h2>My Complaints</h2>

          <p>
            Track the civic issues you have reported.
          </p>
        </div>

        <div className="complaint-count">
          <strong>{complaints.length}</strong>
          <span>
            {complaints.length === 1
              ? "Complaint"
              : "Complaints"}
          </span>
        </div>
      </div>

      {/* EMPTY STATE */}

      {complaints.length === 0 ? (
        <div className="no-complaints">

          <div className="empty-icon">
            📋
          </div>

          <h3>No complaints yet</h3>

          <p>
            You haven't reported any civic issues yet.
          </p>

        </div>
      ) : (

        /* COMPLAINT LIST */

        <div className="complaints-list">

          {complaints.map((complaint) => {

            const department =
              complaint.aiClassification
                ?.department;

            const area =
              complaint.aiClassification
                ?.area;

            const subcategory =
              complaint.aiClassification
                ?.subcategory;

            const priority =
              complaint.priority ||
              "Not calculated";

            const severity =
              complaint.severity ||
              complaint.aiClassification
                ?.severity ||
              "Unknown";

            const hasIncident =
              !!complaint.incidentId;

            return (

              <div
                className="complaint-card"
                key={complaint._id}
              >

                {/* CARD HEADER */}

                <div className="complaint-card-top">

                  <div className="complaint-title-section">

                    <div className="complaint-category-icon">
                      🏛️
                    </div>

                    <div>
                      <h3>
                        {complaint.title}
                      </h3>

                      <span className="complaint-id">
                        ID: {complaint._id}
                      </span>
                    </div>

                  </div>

                  <span
                    className={`status status-${complaint.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {complaint.status}
                  </span>

                </div>

                {/* DESCRIPTION */}

                <p className="complaint-description">
                  {complaint.description}
                </p>

                {/* AI CLASSIFICATION */}

                <div className="complaint-info">

                  <div className="complaint-info-item">
                    <strong>Area</strong>

                    <span>
                      {area || "Not classified"}
                    </span>
                  </div>

                  <div className="complaint-info-item">
                    <strong>Subcategory</strong>

                    <span>
                      {subcategory ||
                        complaint.category ||
                        "Other"}
                    </span>
                  </div>

                  <div className="complaint-info-item">
                    <strong>Department</strong>

                    <span>
                      {department ||
                        "Not assigned"}
                    </span>
                  </div>

                </div>

                {/* PRIORITY + SEVERITY */}

                <div className="complaint-meta-row">

                  <div className="meta-item">

                    <span>
                      Priority
                    </span>

                    <strong
                      className={`priority-badge priority-${getPriorityClass(
                        priority
                      )}`}
                    >
                      {priority}
                    </strong>

                  </div>

                  <div className="meta-item">

                    <span>
                      Severity
                    </span>

                    <strong
                      className={`severity-badge severity-${getSeverityClass(
                        severity
                      )}`}
                    >
                      {severity}
                    </strong>

                  </div>

                  <div className="meta-item">

                    <span>
                      Priority Score
                    </span>

                    <strong>
                      {complaint.priorityScore ??
                        0}
                      /100
                    </strong>

                  </div>

                </div>

                {/* LOCATION */}

                <div className="complaint-location">

                  <span className="location-icon">
                    📍
                  </span>

                  <div>

                    <strong>
                      {complaint.location.address}
                    </strong>

                    <p>
                      {complaint.location.ward
                        ? `Ward: ${complaint.location.ward}`
                        : ""}

                      {complaint.location.wardCode
                        ? ` • ${complaint.location.wardCode}`
                        : ""}

                      {complaint.location.zone
                        ? ` • Zone: ${complaint.location.zone}`
                        : ""}
                    </p>

                  </div>

                </div>

                {/* INCIDENT */}

                {hasIncident && (
                  <div className="incident-summary">

                    <div className="incident-icon">
                      🚨
                    </div>

                    <div>

                      <strong>
                        Linked to Incident
                      </strong>

                      <p>
                        {complaint.incidentId
                          ?.incidentId ||
                          "Incident created"}

                        {" • "}

                        {complaint.incidentId
                          ?.complaintCount ||
                          0}{" "}
                        complaints linked
                      </p>

                    </div>

                  </div>
                )}

                {/* DUPLICATE */}

                {complaint.duplicateDetection
                  ?.isDuplicate && (
                  <div className="duplicate-summary">

                    ⚠️ Possible duplicate complaint

                    <span>
                      {(
                        (complaint
                          .duplicateDetection
                          .similarityScore ||
                          0) * 100
                      ).toFixed(1)}
                      % similarity
                    </span>

                  </div>
                )}

                {/* FOOTER */}

                <div className="complaint-card-footer">

                  <p className="complaint-date">

                    🗓 Reported on{" "}

                    {new Date(
                      complaint.createdAt
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}

                  </p>

                  <button
                    type="button"
                    className="view-details-btn"
                    onClick={() =>
                      setSelectedComplaint(
                        complaint
                      )
                    }
                  >
                    View Details →
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

export default MyComplaints;