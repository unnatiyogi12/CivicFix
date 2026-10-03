import { useEffect, useState } from "react";
import AdminComplaints from "./AdminComplaints";
import AdminAnalytics from "./AdminAnalytics";
import "./AdminDashboard.css";

interface Complaint {
  _id: string;
  title: string;
  description?: string;

  status?: string;
  civicFixStatus?: string;
  governmentStatus?: string;
  citizenVerification?: string;

  severity?: string;
  priority?: string;
  priorityScore?: number;

  category?: string;

  aiClassification?: {
    isCivic?: boolean | null;
    area?: string;
    subcategory?: string;
    severity?: string;
    department?: string;
  };

  location?: {
    address?: string;
    ward?: string;
    zone?: string;
    municipality?: string;
    district?: string;
    state?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

type DashboardView =
  | "overview"
  | "complaints"
  | "analytics";

function AdminDashboard() {
  const [activeView, setActiveView] =
    useState<DashboardView>("overview");

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // FETCH ADMIN COMPLAINTS
  // =========================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Admin authentication required."
        );
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/complaints/admin/all",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch complaints."
        );
      }

      setComplaints(
        Array.isArray(data.complaints)
          ? data.complaints
          : []
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =========================================================
  // CALCULATE DASHBOARD STATISTICS
  // =========================================================

  const totalComplaints =
    complaints.length;

  const resolvedComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Resolved"
    ).length;

  const reopenedComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Reopened"
    ).length;

  const rejectedComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Rejected"
    ).length;

  const forwardedComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Forwarded"
    ).length;

  const underReviewComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Under Review"
    ).length;

  const verifiedComplaints =
    complaints.filter(
      (complaint) =>
        (complaint.civicFixStatus ||
          complaint.status) ===
        "Verified"
    ).length;

  const openComplaints =
    complaints.filter((complaint) => {
      const status =
        complaint.civicFixStatus ||
        complaint.status;

      return (
        status !== "Resolved" &&
        status !== "Rejected"
      );
    }).length;

  const citizenConfirmed =
    complaints.filter(
      (complaint) =>
        complaint.citizenVerification ===
        "Confirmed"
    ).length;

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    await fetchComplaints();
  };

  // =========================================================
  // OPEN COMPLAINTS
  // =========================================================

  const openComplaintsPage = () => {
    setActiveView("complaints");
  };

  // =========================================================
  // OPEN ANALYTICS
  // =========================================================

  const openAnalyticsPage = () => {
    setActiveView("analytics");
  };

  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  const handleBackToDashboard = () => {
    setActiveView("overview");

    // Refresh latest complaint data
    fetchComplaints();
  };

  // =========================================================
  // IF COMPLAINT PAGE IS OPEN
  // =========================================================

  if (activeView === "complaints") {
    return (
      <AdminComplaints
        onBack={
          handleBackToDashboard
        }
      />
    );
  }

  // =========================================================
  // IF ANALYTICS PAGE IS OPEN
  // =========================================================

  if (activeView === "analytics") {
    return (
      <div className="admin-dashboard-wrapper">

        <div className="admin-page-topbar">

          <button
            type="button"
            className="admin-topbar-back"
            onClick={
              handleBackToDashboard
            }
          >
            ← Dashboard
          </button>

          <div className="admin-topbar-title">
            <span>
              CIVICFIX AI
            </span>

            <h2>
              Analytics & Intelligence
            </h2>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={
              handleRefresh
            }
          >
            ↻ Refresh
          </button>

        </div>

        <AdminAnalytics />

      </div>
    );
  }

  // =========================================================
  // MAIN ADMIN DASHBOARD
  // =========================================================

  return (
    <div className="admin-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-dashboard-header">

        <div className="admin-brand-section">

          <div className="admin-logo">
            CF
          </div>

          <div>
            <span className="admin-eyebrow">
              CIVICFIX AI
            </span>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Civic complaint intelligence,
              verification and resolution
              management.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={
            handleRefresh
          }
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </header>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="admin-dashboard-error">
          ⚠️ {error}
        </div>
      )}


      {/* =====================================================
          QUICK NAVIGATION
      ===================================================== */}

      <section className="admin-navigation">

        <button
          type="button"
          className="admin-nav-card complaints"
          onClick={
            openComplaintsPage
          }
        >
          <div className="admin-nav-icon">
            📋
          </div>

          <div>
            <strong>
              All Complaints
            </strong>

            <span>
              Review and manage
              citizen complaints
            </span>
          </div>

          <div className="admin-nav-arrow">
            →
          </div>
        </button>


        <button
          type="button"
          className="admin-nav-card analytics"
          onClick={
            openAnalyticsPage
          }
        >
          <div className="admin-nav-icon">
            📊
          </div>

          <div>
            <strong>
              Analytics & Intelligence
            </strong>

            <span>
              Hotspots, trends and
              anomaly detection
            </span>
          </div>

          <div className="admin-nav-arrow">
            →
          </div>
        </button>

      </section>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>
            <span>
              CIVICFIX OVERVIEW
            </span>

            <h2>
              Complaint Overview
            </h2>
          </div>

          <p>
            Current state of all
            reported civic issues.
          </p>

        </div>


        <div className="admin-stat-grid">

          {/* TOTAL */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon blue">
              📋
            </div>

            <div>
              <span>
                Total Complaints
              </span>

              <strong>
                {totalComplaints}
              </strong>
            </div>

          </div>


          {/* OPEN */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon orange">
              🔄
            </div>

            <div>
              <span>
                Open Complaints
              </span>

              <strong>
                {openComplaints}
              </strong>
            </div>

          </div>


          {/* UNDER REVIEW */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon purple">
              🔎
            </div>

            <div>
              <span>
                Under Review
              </span>

              <strong>
                {underReviewComplaints}
              </strong>
            </div>

          </div>


          {/* VERIFIED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon teal">
              ✓
            </div>

            <div>
              <span>
                Verified
              </span>

              <strong>
                {verifiedComplaints}
              </strong>
            </div>

          </div>


          {/* FORWARDED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon indigo">
              📤
            </div>

            <div>
              <span>
                Forwarded
              </span>

              <strong>
                {forwardedComplaints}
              </strong>
            </div>

          </div>


          {/* RESOLVED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Resolved
              </span>

              <strong>
                {resolvedComplaints}
              </strong>
            </div>

          </div>


          {/* REOPENED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon red">
              ↩
            </div>

            <div>
              <span>
                Reopened
              </span>

              <strong>
                {reopenedComplaints}
              </strong>
            </div>

          </div>


          {/* CITIZEN CONFIRMED */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon emerald">
              👍
            </div>

            <div>
              <span>
                Citizen Confirmed
              </span>

              <strong>
                {citizenConfirmed}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>
            <span>
              WORKFLOW
            </span>

            <h2>
              Complaint Lifecycle
            </h2>
          </div>

          <p>
            CivicFix separates platform
            verification from government
            operational work.
          </p>

        </div>


        <div className="admin-workflow">

          <div className="workflow-step">
            <span>1</span>
            <strong>Reported</strong>
            <small>
              Citizen submits issue
            </small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>2</span>
            <strong>Under Review</strong>
            <small>
              Admin reviews report
            </small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>3</span>
            <strong>Verified</strong>
            <small>
              Complaint verified
            </small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>4</span>
            <strong>Forwarded</strong>
            <small>
              Sent to government workflow
            </small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>5</span>
            <strong>Resolved</strong>
            <small>
              Resolution approved
            </small>
          </div>

        </div>

      </section>


      {/* =====================================================
          SPECIAL ATTENTION
      ===================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>
            <span>
              ATTENTION REQUIRED
            </span>

            <h2>
              Cases Requiring Attention
            </h2>
          </div>

          <p>
            Quickly identify complaints
            that need administrative action.
          </p>

        </div>


        <div className="admin-attention-grid">

          <div className="attention-card">

            <div className="attention-icon">
              ↩
            </div>

            <div>
              <strong>
                Reopened Complaints
              </strong>

              <span>
                Citizens reported that
                a previous resolution
                did not solve the issue.
              </span>
            </div>

            <b>
              {reopenedComplaints}
            </b>

          </div>


          <div className="attention-card">

            <div className="attention-icon">
              ⏳
            </div>

            <div>
              <strong>
                Under Review
              </strong>

              <span>
                Complaints waiting for
                administrative verification.
              </span>
            </div>

            <b>
              {underReviewComplaints}
            </b>

          </div>


          <div className="attention-card">

            <div className="attention-icon">
              ⚠️
            </div>

            <div>
              <strong>
                Rejected
              </strong>

              <span>
                Complaints that were
                rejected during review.
              </span>
            </div>

            <b>
              {rejectedComplaints}
            </b>

          </div>

        </div>

      </section>


      {/* =====================================================
          AI INTELLIGENCE
      ===================================================== */}

      <section className="admin-ai-banner">

        <div className="admin-ai-icon">
          ✦
        </div>

        <div>

          <span>
            AI CIVIC INTELLIGENCE
          </span>

          <h2>
            Understand what is
            happening across the city
          </h2>

          <p>
            Use AI-assisted classification,
            severity, priority, duplicate
            detection, hotspots and
            emerging-issue analytics to
            support administrative review.
          </p>

        </div>

        <button
          type="button"
          onClick={
            openAnalyticsPage
          }
        >
          Open Analytics →
        </button>

      </section>


      {/* =====================================================
          FOOTER INFO
      ===================================================== */}

      <footer className="admin-dashboard-footer">

        <span>
          CivicFix AI
        </span>

        <p>
          AI-powered civic complaint
          management and intelligence
          platform.
        </p>

      </footer>

    </div>
  );
}

export default AdminDashboard;