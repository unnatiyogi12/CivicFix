import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import AdminComplaints from "./AdminComplaints";

// =========================================================
// TYPES
// =========================================================

interface Incident {
  _id?: string;
  incidentId?: string;
  complaintCount?: number;
  status?: string;
}

interface Complaint {
  _id: string;

  title: string;

  description: string;

  category: string;

  severity: string;

  status: string;

  priorityScore?: number;

  priority?: string;

  recommendedAction?: string;

  aiClassification?: {
    isCivic?: boolean | null;
    area?: string;
    subcategory?: string;
    subcategorySource?: string;
    severity?: string;
    department?: string;
  };

  duplicateDetection?: {
    isDuplicate?: boolean;
    similarityScore?: number;
    matchedComplaintId?: string | null;
    message?: string;
  };

  incidentId?: Incident | string | null;

  incidentStatus?: string;

  location?: {
    address?: string;
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
  };

  userId?: {
    name?: string;
    email?: string;
  };

  createdAt: string;

  updatedAt?: string;
}

// =========================================================
// COMPONENT
// =========================================================

function AdminDashboard() {
  // =======================================================
  // STATE
  // =======================================================

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showAllComplaints, setShowAllComplaints] =
    useState(false);

  // =======================================================
  // FETCH COMPLAINTS
  // =======================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Admin authentication required.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/complaints/admin/all",
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

      const fetchedComplaints: Complaint[] =
        Array.isArray(data.complaints)
          ? data.complaints
          : [];

      setComplaints(fetchedComplaints);
    } catch (err) {
      console.error(
        "Admin dashboard fetch error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load complaints.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =======================================================
  // SORT COMPLAINTS
  // =======================================================

  const sortedComplaints = useMemo(() => {
    return [...complaints].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [complaints]);

  // =======================================================
  // ONLY LATEST 4 FOR DASHBOARD
  // =======================================================

  const recentComplaints = useMemo(() => {
    return sortedComplaints.slice(0, 4);
  }, [sortedComplaints]);

  // =======================================================
  // STATISTICS
  // =======================================================

  const totalComplaints = complaints.length;

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "In Progress"
  ).length;

  const pendingComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Reported" ||
      complaint.status === "Verified" ||
      complaint.status === "Assigned"
  ).length;

  const rejectedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Rejected"
  ).length;

  const highPriorityComplaints = complaints.filter(
    (complaint) =>
      complaint.priority === "High" ||
      complaint.priority === "Critical"
  ).length;

  const duplicateComplaints = complaints.filter(
    (complaint) =>
      complaint.duplicateDetection?.isDuplicate === true
  ).length;

  const civicComplaints = complaints.filter(
    (complaint) =>
      complaint.aiClassification?.isCivic === true
  ).length;

  // =======================================================
  // DEPARTMENT STATS
  // =======================================================

  const departmentStats = useMemo(() => {
    const stats: Record<string, number> = {};

    complaints.forEach((complaint) => {
      const department =
        complaint.aiClassification?.department ||
        "Unassigned";

      stats[department] =
        (stats[department] || 0) + 1;
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [complaints]);

  // =======================================================
  // AREA STATS
  // =======================================================

  const areaStats = useMemo(() => {
    const stats: Record<string, number> = {};

    complaints.forEach((complaint) => {
      const area =
        complaint.aiClassification?.area ||
        "Unknown";

      stats[area] =
        (stats[area] || 0) + 1;
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [complaints]);

  // =======================================================
  // WARD STATS
  // =======================================================

  const wardStats = useMemo(() => {
    const stats: Record<string, number> = {};

    complaints.forEach((complaint) => {
      const ward =
        complaint.location?.ward ||
        "Unknown";

      stats[ward] =
        (stats[ward] || 0) + 1;
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [complaints]);

  // =======================================================
  // DATE FORMAT
  // =======================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =======================================================
  // STATUS CLASS
  // =======================================================

  const getStatusClass = (status: string) => {
    return `status-${status
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  // =======================================================
  // OPEN ALL COMPLAINTS
  // =======================================================

  if (showAllComplaints) {
    return (
      <AdminComplaints

        onBack={() => {
          setShowAllComplaints(false);
          fetchComplaints();
        }}
      />
    );
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

  return (
    <div className="admin-dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-dashboard-header">

        <div>
          <span className="admin-eyebrow">
            CIVICFIX AI
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Monitor citizen complaints,
            AI intelligence and resolution
            progress.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={fetchComplaints}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="admin-status-error">
          ⚠️ {error}
        </div>
      )}

      {/* =================================================
          MAIN STATS
      ================================================= */}

      <div className="admin-stats-grid">

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Total Complaints
          </span>

          <strong className="admin-stat-number">
            {totalComplaints}
          </strong>

          <span className="admin-stat-description">
            All reported complaints
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Pending
          </span>

          <strong className="admin-stat-number">
            {pendingComplaints}
          </strong>

          <span className="admin-stat-description">
            Awaiting action
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            In Progress
          </span>

          <strong className="admin-stat-number">
            {inProgressComplaints}
          </strong>

          <span className="admin-stat-description">
            Currently being handled
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">
            Resolved
          </span>

          <strong className="admin-stat-number">
            {resolvedComplaints}
          </strong>

          <span className="admin-stat-description">
            Successfully resolved
          </span>
        </div>

      </div>

      {/* =================================================
          SECONDARY STATS
      ================================================= */}

      <div className="admin-secondary-stats">

        <div className="admin-mini-card">
          <span>
            Civic Issues
          </span>

          <strong>
            {civicComplaints}
          </strong>
        </div>

        <div className="admin-mini-card">
          <span>
            High / Critical
          </span>

          <strong>
            {highPriorityComplaints}
          </strong>
        </div>

        <div className="admin-mini-card">
          <span>
            Duplicates
          </span>

          <strong>
            {duplicateComplaints}
          </strong>
        </div>

        <div className="admin-mini-card">
          <span>
            Rejected
          </span>

          <strong>
            {rejectedComplaints}
          </strong>
        </div>

      </div>

      {/* =================================================
          AI INTELLIGENCE
      ================================================= */}

      <div className="admin-section">

        <div className="admin-section-header">

          <div>
            <span className="admin-eyebrow">
              AI INTELLIGENCE
            </span>

            <h2>
              Complaint Intelligence
            </h2>

            <p>
              AI-generated insights from reported
              citizen complaints.
            </p>
          </div>

        </div>

        <div className="admin-intelligence-grid">

          {/* Department */}

          <div className="admin-intelligence-card">

            <div className="admin-intelligence-card-header">
              <span>
                Department Distribution
              </span>
            </div>

            {departmentStats.length === 0 ? (
              <p className="admin-empty-text">
                No department data available.
              </p>
            ) : (
              <div className="admin-distribution-list">

                {departmentStats.map(
                  ([department, count]) => (
                    <div
                      className="admin-distribution-row"
                      key={department}
                    >
                      <span>
                        {department}
                      </span>

                      <strong>
                        {count}
                      </strong>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* Area */}

          <div className="admin-intelligence-card">

            <div className="admin-intelligence-card-header">
              <span>
                Area Distribution
              </span>
            </div>

            {areaStats.length === 0 ? (
              <p className="admin-empty-text">
                No area data available.
              </p>
            ) : (
              <div className="admin-distribution-list">

                {areaStats.map(
                  ([area, count]) => (
                    <div
                      className="admin-distribution-row"
                      key={area}
                    >
                      <span>
                        {area}
                      </span>

                      <strong>
                        {count}
                      </strong>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* Ward */}

          <div className="admin-intelligence-card">

            <div className="admin-intelligence-card-header">
              <span>
                Ward Distribution
              </span>
            </div>

            {wardStats.length === 0 ? (
              <p className="admin-empty-text">
                No ward data available.
              </p>
            ) : (
              <div className="admin-distribution-list">

                {wardStats.map(
                  ([ward, count]) => (
                    <div
                      className="admin-distribution-row"
                      key={ward}
                    >
                      <span>
                        {ward}
                      </span>

                      <strong>
                        {count}
                      </strong>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =================================================
          RECENT COMPLAINTS
      ================================================= */}

      <div className="admin-section">

        <div className="admin-section-header">

          <div>
            <span className="admin-eyebrow">
              RECENT ACTIVITY
            </span>

            <h2>
              Recent Complaints
            </h2>

            <p>
              Showing the latest 4 complaints.
            </p>
          </div>

          {/* IMPORTANT:
              View All is ONLY for opening
              the complete complaints page.
          */}

          <button
            type="button"
            className="admin-view-all-btn"
            onClick={() =>
              setShowAllComplaints(true)
            }
          >
            View All Complaints →
          </button>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="admin-dashboard-empty">

            <div className="admin-empty-icon">
              ⏳
            </div>

            <h3>
              Loading complaints...
            </h3>

            <p>
              Fetching latest complaints
              from server.
            </p>

          </div>

        ) : recentComplaints.length === 0 ? (

          <div className="admin-dashboard-empty">

            <div className="admin-empty-icon">
              📋
            </div>

            <h3>
              No complaints found
            </h3>

            <p>
              There are currently no
              reported complaints.
            </p>

          </div>

        ) : (

          <div className="admin-recent-complaints">

            {recentComplaints.map(
              (complaint) => (

                <div
                  className="admin-recent-card"
                  key={complaint._id}
                >

                  {/* TOP */}

                  <div className="admin-recent-card-top">

                    <div>

                      <h3>
                        {complaint.title}
                      </h3>

                      <p>
                        {complaint.aiClassification
                          ?.area ||
                          complaint.category ||
                          "Other"}

                        {" • "}

                        {complaint.aiClassification
                          ?.subcategory ||
                          "Other"}
                      </p>

                    </div>

                    <span
                      className={`admin-status ${getStatusClass(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>

                  </div>

                  {/* DESCRIPTION */}

                  <p className="admin-recent-description">
                    {complaint.description}
                  </p>

                  {/* INFO */}

                  <div className="admin-recent-info">

                    <div>
                      <span>
                        Department
                      </span>

                      <strong>
                        {complaint
                          .aiClassification
                          ?.department ||
                          "Unassigned"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Priority
                      </span>

                      <strong>
                        {complaint.priority ||
                          "Not calculated"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Reported By
                      </span>

                      <strong>
                        {complaint.userId
                          ?.name ||
                          "Unknown"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Date
                      </span>

                      <strong>
                        {formatDate(
                          complaint.createdAt
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* FOOTER */}

                  <div className="admin-recent-footer">

                    <span>
                      {complaint.location
                        ?.address ||
                        "Location unavailable"}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

        {/* =================================================
            VIEW ALL BUTTON
        ================================================= */}

        {complaints.length > 4 && (
          <div className="admin-view-all-bottom">

            <button
              type="button"
              className="admin-view-all-btn"
              onClick={() =>
                setShowAllComplaints(true)
              }
            >
              View All {complaints.length} Complaints →
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default AdminDashboard;