import "./ComplaintDetails.css";

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
    ulbCode?: string;
    district?: string;
    state?: string;
    jurisdiction?: string;
    source?: string;
  };

  createdAt: string;
  updatedAt?: string;
}

interface ComplaintDetailsProps {
  complaint: Complaint;
  onBack: () => void;
}

function ComplaintDetails({
  complaint,
  onBack,
}: ComplaintDetailsProps) {

  const statusOrder = [
    "Reported",
    "Verified",
    "Assigned",
    "In Progress",
    "Resolved",
  ];

  const currentStatusIndex =
    statusOrder.indexOf(complaint.status);

  const getStatusClass = (status: string) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

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

  return (
    <div className="complaint-details">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="details-header">

        <button
          type="button"
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Complaints
        </button>

        <div className="details-title">
          <span>Complaint Details</span>

          <small>
            ID: {complaint._id}
          </small>
        </div>

      </div>


      {/* =====================================================
          MAIN COMPLAINT CARD
      ===================================================== */}

      <div className="details-main-card">

        <div className="details-main-top">

          <div>
            <span className="details-category">
              🏛️ CIVIC COMPLAINT
            </span>

            <h2>
              {complaint.title}
            </h2>
          </div>

          <span
            className={`details-status status-${getStatusClass(
              complaint.status
            )}`}
          >
            {complaint.status}
          </span>

        </div>


        <div className="details-description">

          <span>
            DESCRIPTION
          </span>

          <p>
            {complaint.description}
          </p>

        </div>

      </div>


      {/* =====================================================
          STATUS TIMELINE
      ===================================================== */}

      <div className="details-card">

        <div className="details-card-header">

          <div>
            <span className="section-label">
              TRACKING
            </span>

            <h3>
              Complaint Timeline
            </h3>
          </div>

        </div>


        <div className="status-timeline">

          {statusOrder.map(
            (status, index) => {

              const isCompleted =
                currentStatusIndex >= index;

              const isCurrent =
                currentStatusIndex === index;

              return (
                <div
                  className={`timeline-item ${
                    isCompleted
                      ? "completed"
                      : ""
                  } ${
                    isCurrent
                      ? "current"
                      : ""
                  }`}
                  key={status}
                >

                  <div className="timeline-marker">

                    {isCompleted
                      ? "✓"
                      : index + 1}

                  </div>

                  <div className="timeline-content">

                    <strong>
                      {status ===
                        "Reported" &&
                        "Complaint Submitted"}

                      {status ===
                        "Verified" &&
                        "Complaint Verified"}

                      {status ===
                        "Assigned" &&
                        "Department Assigned"}

                      {status ===
                        "In Progress" &&
                        "Work In Progress"}

                      {status ===
                        "Resolved" &&
                        "Complaint Resolved"}
                    </strong>

                    {isCurrent && (
                      <span>
                        Current status
                      </span>
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>


      {/* =====================================================
          AI INTELLIGENCE
      ===================================================== */}

      <div className="details-card">

        <div className="details-card-header">

          <div>
            <span className="section-label">
              ARTIFICIAL INTELLIGENCE
            </span>

            <h3>
              AI Complaint Intelligence
            </h3>
          </div>

          <span className="ai-badge">
            🤖 AI
          </span>

        </div>


        <div className="details-grid">

          <div className="detail-item">

            <span>
              Civic Status
            </span>

            <strong
              className={
                complaint.aiClassification
                  ?.isCivic === true
                  ? "text-success"
                  : complaint.aiClassification
                      ?.isCivic === false
                  ? "text-danger"
                  : ""
              }
            >
              {complaint.aiClassification
                ?.isCivic === true
                ? "✓ Civic Issue"
                : complaint.aiClassification
                    ?.isCivic === false
                ? "✕ Non-Civic"
                : "Unknown"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Area
            </span>

            <strong>
              {complaint.aiClassification
                ?.area ||
                "Not classified"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Subcategory
            </span>

            <strong>
              {complaint.aiClassification
                ?.subcategory ||
                complaint.category ||
                "Other"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Department
            </span>

            <strong>
              {complaint.aiClassification
                ?.department ||
                "Not assigned"}
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================================
          PRIORITY
      ===================================================== */}

      <div className="details-card">

        <div className="details-card-header">

          <div>
            <span className="section-label">
              PRIORITY INTELLIGENCE
            </span>

            <h3>
              AI Priority
            </h3>
          </div>

          <strong className="priority-number">
            {complaint.priorityScore ??
              0}
            <small>/100</small>
          </strong>

        </div>


        <div className="priority-details">

          <div>

            <span>
              Priority Level
            </span>

            <strong
              className={`priority-badge priority-${getPriorityClass(
                complaint.priority
              )}`}
            >
              {complaint.priority ||
                "Not calculated"}
            </strong>

          </div>


          <div>

            <span>
              Severity
            </span>

            <strong
              className={`severity-badge severity-${getSeverityClass(
                complaint.severity
              )}`}
            >
              {complaint.severity ||
                "Unknown"}
            </strong>

          </div>

        </div>


        <div className="priority-progress">

          <div
            style={{
              width: `${Math.min(
                Math.max(
                  complaint.priorityScore ||
                    0,
                  0
                ),
                100
              )}%`,
            }}
          />

        </div>


        {complaint.recommendedAction && (
          <div className="recommended-action">

            <span>
              ⚡ Recommended Action
            </span>

            <p>
              {complaint.recommendedAction}
            </p>

          </div>
        )}

      </div>


      {/* =====================================================
          LOCATION INTELLIGENCE
      ===================================================== */}

      <div className="details-card">

        <div className="details-card-header">

          <div>
            <span className="section-label">
              LOCATION INTELLIGENCE
            </span>

            <h3>
              📍 Complaint Location
            </h3>
          </div>

        </div>


        <div className="location-address">

          <strong>
            {complaint.location.address}
          </strong>

        </div>


        <div className="details-grid">

          <div className="detail-item">

            <span>
              Ward
            </span>

            <strong>
              {complaint.location.ward ||
                "Not found"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Ward Code
            </span>

            <strong>
              {complaint.location.wardCode ||
                "Not found"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Zone
            </span>

            <strong>
              {complaint.location.zone ||
                "Not mapped"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Municipality
            </span>

            <strong>
              {complaint.location
                .municipality ||
                "Not found"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              District
            </span>

            <strong>
              {complaint.location.district ||
                "Not found"}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              State
            </span>

            <strong>
              {complaint.location.state ||
                "Not found"}
            </strong>

          </div>

        </div>


        {complaint.location.latitude !==
          undefined &&
          complaint.location.longitude !==
            undefined && (

            <div className="coordinates-box">

              <span>
                Latitude
              </span>

              <strong>
                {complaint.location.latitude}
              </strong>

              <span>
                Longitude
              </span>

              <strong>
                {complaint.location.longitude}
              </strong>

            </div>

          )}

      </div>


      {/* =====================================================
          INCIDENT INTELLIGENCE
      ===================================================== */}

      {complaint.incidentId && (

        <div className="details-card incident-card">

          <div className="details-card-header">

            <div>
              <span className="section-label">
                INCIDENT INTELLIGENCE
              </span>

              <h3>
                🚨 Linked Incident
              </h3>
            </div>

          </div>


          <div className="incident-box">

            <div>
              <span>
                Incident ID
              </span>

              <strong>
                {complaint.incidentId
                  .incidentId ||
                  "Available"}
              </strong>
            </div>


            <div>
              <span>
                Complaints
              </span>

              <strong>
                {complaint.incidentId
                  .complaintCount ||
                  0}
              </strong>
            </div>


            <div>
              <span>
                Incident Status
              </span>

              <strong>
                {complaint.incidentId
                  .status ||
                  complaint.incidentStatus ||
                  "Open"}
              </strong>
            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DUPLICATE INTELLIGENCE
      ===================================================== */}

      <div className="details-card">

        <div className="details-card-header">

          <div>
            <span className="section-label">
              DUPLICATE INTELLIGENCE
            </span>

            <h3>
              🔎 Similar Complaint Check
            </h3>
          </div>

        </div>


        {complaint.duplicateDetection
          ?.isDuplicate ? (

          <div className="duplicate-warning">

            <strong>
              ⚠️ Possible Duplicate Complaint
            </strong>

            <span>
              Similarity:{" "}
              {(
                (complaint
                  .duplicateDetection
                  .similarityScore ||
                  0) * 100
              ).toFixed(1)}
              %
            </span>

          </div>

        ) : (

          <div className="duplicate-safe">

            <strong>
              ✓ No strong duplicate found
            </strong>

            <span>
              Similarity:{" "}
              {(
                (complaint
                  .duplicateDetection
                  ?.similarityScore ||
                  0) * 100
              ).toFixed(1)}
              %
            </span>

          </div>

        )}

      </div>


      {/* =====================================================
          DATES
      ===================================================== */}

      <div className="details-card dates-card">

        <div className="date-row">

          <div>
            <span>
              Reported On
            </span>

            <strong>
              {new Date(
                complaint.createdAt
              ).toLocaleString("en-IN")}
            </strong>
          </div>


          {complaint.updatedAt && (
            <div>
              <span>
                Last Updated
              </span>

              <strong>
                {new Date(
                  complaint.updatedAt
                ).toLocaleString("en-IN")}
              </strong>
            </div>
          )}

        </div>

      </div>


      {/* =====================================================
          BOTTOM BACK BUTTON
      ===================================================== */}

      <button
        type="button"
        className="bottom-back-btn"
        onClick={onBack}
      >
        ← Back to My Complaints
      </button>

    </div>
  );
}

export default ComplaintDetails;