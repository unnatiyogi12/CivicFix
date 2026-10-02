import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./AdminComplaints.css";


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

  civicFixStatus?: string;
  governmentStatus?: string;
  citizenVerification?: string;

  governmentAction?: {
    receivedAt?: string | null;
    acceptedAt?: string | null;
    workStartedAt?: string | null;
    resolutionSubmittedAt?: string | null;
    resolutionNote?: string;
    proofUrls?: string[];
    lastUpdatedAt?: string | null;
    lastUpdatedBy?: { name?: string; email?: string } | string | null;
  };

  resolutionReview?: {
    status?: string;
    reviewedAt?: string | null;
    reviewedBy?: { name?: string; email?: string } | string | null;
    note?: string;
  };

  imageUrl?: string;

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

  incidentId?: Incident | string | null;

  incidentStatus?: string;

  governmentRouting?: {
    status?: string;
    serviceId?: string | null;
    serviceName?: string;
    authorityName?: string;
    department?: string;
    officialUrl?: string;
    complaintChannel?: string;
    complaintUrl?: string;
    complaintPhone?: string;
    sourceId?: string | null;
    sourceName?: string;
    routingMessage?: string;
    matchedAt?: string;
  };

  governmentForwarding?: {
    status?: string;
    forwardedAt?: string;
    forwardedBy?: string | null;
    channel?: string;
    destination?: string;
    referenceId?: string;
    adminNote?: string;
  };

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
  };

  userId?: {
    name: string;

    email: string;
  };

  createdAt: string;

  updatedAt?: string;
}


// =========================================================
// PROPS
// =========================================================

interface AdminComplaintsProps {
  complaints?: Complaint[];

  onBack: () => void;
}


// =========================================================
// STATUS FLOW
// =========================================================

const statusFlow = [
  "Reported",
  "Under Review",
  "Verified",
  "Forwarded",
  "Resolved",
];


// =========================================================
// COMPONENT
// =========================================================

function AdminComplaints({
  onBack,
}: AdminComplaintsProps) {

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [complaintList, setComplaintList] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const fetchAllComplaints = async () => {
    try {
      setLoading(true);
      setStatusError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setStatusError("Admin authentication required.");
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

      setComplaintList(fetchedComplaints);
    } catch (error) {
      console.error(
        "Fetch admin complaints error:",
        error
      );

      if (error instanceof Error) {
        setStatusError(error.message);
      } else {
        setStatusError("Failed to load complaints.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState("");

  const [statusSuccess, setStatusSuccess] =
    useState("");

  // =======================================================
  // DOWNLOAD EXCEL REPORT
  // =======================================================

  const downloadExcelReport = () => {
    if (complaintList.length === 0) {
      setStatusError("There are no complaints available to export.");
      return;
    }

    const excelRows = complaintList.map((complaint) => {
      const incident =
        complaint.incidentId &&
        typeof complaint.incidentId === "object"
          ? complaint.incidentId
          : null;

      return {
        "Complaint ID": complaint._id || "",
        "Title": complaint.title || "",
        "Description": complaint.description || "",
        "Citizen Name": complaint.userId?.name || "",
        "Citizen Email": complaint.userId?.email || "",
        "Category": complaint.category || "",
        "Civic / Non-Civic":
          complaint.aiClassification?.isCivic === true
            ? "Civic"
            : complaint.aiClassification?.isCivic === false
              ? "Non-Civic"
              : "Unknown",
        "Area": complaint.aiClassification?.area || "",
        "Subcategory":
          complaint.aiClassification?.subcategory || "",
        "Classification Source":
          complaint.aiClassification?.subcategorySource || "",
        "Severity": complaint.severity || "",
        "AI Severity":
          complaint.aiClassification?.severity || "",
        "Priority Score": complaint.priorityScore ?? "",
        "Priority": complaint.priority || "",
        "Department":
          complaint.aiClassification?.department || "",
        "Recommended Action":
          complaint.recommendedAction || "",
        "Status": complaint.civicFixStatus || complaint.status || "",
        "Government Status": complaint.governmentStatus || "Not Received",
        "Citizen Verification": complaint.citizenVerification || "Pending",
        "Incident ID":
          incident?.incidentId ||
          (typeof complaint.incidentId === "string"
            ? complaint.incidentId
            : ""),
        "Incident Status":
          incident?.status || complaint.incidentStatus || "",
        "Incident Complaint Count":
          incident?.complaintCount ?? "",
        "Duplicate":
          complaint.duplicateDetection?.isDuplicate
            ? "Yes"
            : "No",
        "Similarity Score":
          complaint.duplicateDetection?.similarityScore != null
            ? (
                complaint.duplicateDetection.similarityScore *
                100
              ).toFixed(1) + "%"
            : "",
        "Matched Complaint ID":
          complaint.duplicateDetection?.matchedComplaintId ||
          "",
        "Duplicate Message":
          complaint.duplicateDetection?.message || "",
        "Address": complaint.location?.address || "",
        "Latitude": complaint.location?.latitude ?? "",
        "Longitude": complaint.location?.longitude ?? "",
        "Ward": complaint.location?.ward || "",
        "Ward Code": complaint.location?.wardCode || "",
        "Zone": complaint.location?.zone || "",
        "Municipality / ULB":
          complaint.location?.municipality || "",
        "ULB Code": complaint.location?.ulbCode || "",
        "District": complaint.location?.district || "",
        "State": complaint.location?.state || "",
        "Jurisdiction":
          complaint.location?.jurisdiction || "",
        "Image URL": complaint.imageUrl || "",
        "Created At": complaint.createdAt
          ? new Date(complaint.createdAt).toLocaleString("en-IN")
          : "",
        "Updated At": complaint.updatedAt
          ? new Date(complaint.updatedAt).toLocaleString("en-IN")
          : "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 26 },
      { wch: 35 },
      { wch: 50 },
      { wch: 22 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 30 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 15 },
      { wch: 14 },
      { wch: 28 },
      { wch: 45 },
      { wch: 16 },
      { wch: 25 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 25 },
      { wch: 28 },
      { wch: 45 },
      { wch: 45 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 35 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Complaints"
    );

    const date = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(
      workbook,
      `CivicFix_Complaints_Report_${date}.xlsx`
    );

    setStatusSuccess(
      `${complaintList.length} complaints exported successfully.`
    );
    setStatusError("");
  };

  // =======================================================
  // UPDATE STATUS
  // =======================================================

  const updateComplaintStatus = async (
    complaintId: string,
    newStatus: string
  ) => {

    try {

      setUpdatingStatus(true);

      setStatusError("");

      setStatusSuccess("");


      const token =
        localStorage.getItem("token");


      if (!token) {

        setStatusError(
          "Admin authentication required."
        );

        return;
      }


      const response =
        await fetch(
          `http://localhost:5000/api/complaints/admin/${complaintId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to update complaint status."
        );

      }


      // ===================================================
      // UPDATED COMPLAINT
      // ===================================================

      const updatedComplaint =
        data.complaint;


      // ===================================================
      // UPDATE LIST
      // ===================================================

      setComplaintList(
        (previousComplaints) =>
          previousComplaints.map(
            (complaint) =>
              complaint._id === complaintId
                ? updatedComplaint
                : complaint
          )
      );


      // ===================================================
      // UPDATE SELECTED COMPLAINT
      // ===================================================

      setSelectedComplaint(
        updatedComplaint
      );

      await fetchAllComplaints();

      setStatusSuccess(
        `Complaint status updated to ${newStatus}.`
      );


    } catch (error) {

      if (error instanceof Error) {

        setStatusError(
          error.message
        );

      } else {

        setStatusError(
          "Something went wrong while updating status."
        );

      }

    } finally {

      setUpdatingStatus(false);

    }

  };


  // =======================================================
  // FORWARD COMPLAINT TO GOVERNMENT
  // =======================================================

  const forwardComplaintToGovernment = async (
    complaintId: string
  ) => {
    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setStatusError("Admin authentication required.");
        return;
      }

      const complaint = complaintList.find(
        (item) => item._id === complaintId
      );

      if (!complaint) {
        setStatusError("Complaint not found.");
        return;
      }

      if (complaint.status !== "Verified") {
        setStatusError(
          "Complaint must be Verified before forwarding."
        );
        return;
      }

      if (
        complaint.governmentRouting?.status !==
        "verified"
      ) {
        setStatusError(
          "A verified government route is required before forwarding."
        );
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to record this complaint as forwarded to the official government channel?"
      );

      if (!confirmed) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/admin/${complaintId}/government-forward`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel:
              complaint.governmentRouting?.complaintChannel || "",
            destination:
              complaint.governmentRouting?.authorityName || "",
            referenceId: "",
            adminNote:
              "Complaint forwarded through the official government channel.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to forward complaint."
        );
      }

      const updatedComplaint: Complaint =
        data.complaint || {
          ...complaint,
          civicFixStatus: "Forwarded",
          status: "Forwarded",
          governmentForwarding: data.governmentForwarding,
        };

      setSelectedComplaint(updatedComplaint);

      setComplaintList((previousComplaints) =>
        previousComplaints.map((item) =>
          item._id === complaintId
            ? updatedComplaint
            : item
        )
      );

      await fetchAllComplaints();

      setStatusSuccess(
        "Complaint forwarding recorded successfully."
      );
    } catch (error) {
      console.error(
        "Government forwarding error:",
        error
      );

      if (error instanceof Error) {
        setStatusError(error.message);
      } else {
        setStatusError(
          "Something went wrong while forwarding the complaint."
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };


  // =======================================================
  // REVIEW GOVERNMENT RESOLUTION
  // =======================================================

  const reviewGovernmentResolution = async (
    complaintId: string,
    decision: "approve" | "reject"
  ) => {
    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setStatusError("Admin authentication required.");
        return;
      }

      const note =
        decision === "reject"
          ? window.prompt(
              "Why is the government resolution being rejected?",
              "Please provide clearer proof or complete the required work."
            ) || ""
          : "Government resolution and proof verified by CivicFix admin.";

      if (decision === "reject" && !note.trim()) {
        setStatusError("A rejection reason is required.");
        return;
      }

      const confirmed = window.confirm(
        decision === "approve"
          ? "Approve the government resolution and mark this complaint Resolved?"
          : "Reject this resolution and return the complaint to Government In Progress?"
      );

      if (!confirmed) return;

      const response = await fetch(
        `http://localhost:5000/api/complaints/admin/${complaintId}/resolution-review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision, note }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to review government resolution."
        );
      }

      const updatedComplaint: Complaint = data.complaint;
      setSelectedComplaint(updatedComplaint);
      setComplaintList((previousComplaints) =>
        previousComplaints.map((item) =>
          item._id === complaintId ? updatedComplaint : item
        )
      );
      await fetchAllComplaints();
      setStatusSuccess(data.message || "Government resolution reviewed.");
    } catch (error) {
      console.error("Government resolution review error:", error);
      setStatusError(
        error instanceof Error
          ? error.message
          : "Something went wrong while reviewing the resolution."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };


  // =======================================================
  // GET ACTIONS BASED ON STATUS
  // =======================================================

  const getStatusActions = (
    status: string
  ) => {
    switch (status) {
      case "Reported":
        return [
          {
            label: "🔎 Start Review",
            status: "Under Review",
            className: "status-action progress",
          },
          {
            label: "✕ Reject",
            status: "Rejected",
            className: "status-action reject",
          },
        ];

      case "Under Review":
        return [
          {
            label: "✓ Verify Complaint",
            status: "Verified",
            className: "status-action verify",
          },
          {
            label: "✕ Reject",
            status: "Rejected",
            className: "status-action reject",
          },
        ];

      case "Verified":
        return [];


      case "Resolved":
      case "Routed":
      case "Forwarded":
      case "Rejected":
      default:
        return [];
    }
  };


  // =======================================================
  // STATUS TIMELINE
  // =======================================================

  const getStatusIndex = (
    status: string
  ) => {

    return statusFlow.indexOf(
      status
    );

  };


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    date?: string
  ) => {

    if (!date) {

      return "N/A";

    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",
      }
    );

  };


  // =======================================================
  // INCIDENT
  // =======================================================

  const incident =
    selectedComplaint?.incidentId &&
    typeof selectedComplaint.incidentId ===
      "object"
      ? selectedComplaint.incidentId
      : null;


  // =======================================================
  // DETAIL VIEW
  // =======================================================

  if (selectedComplaint) {

    const civicStatus =
      selectedComplaint.civicFixStatus ||
      selectedComplaint.status;

    const currentStatusIndex =
      getStatusIndex(
        civicStatus
      );


    const actions =
      getStatusActions(
        civicStatus
      );


    return (

      <div className="admin-complaints-page">

        {/* ===============================================
            DETAIL HEADER
        =============================================== */}

        <div className="admin-detail-header">

          <button
            type="button"
            className="admin-back-btn"
            onClick={() => {

              setSelectedComplaint(
                null
              );

              setStatusError("");

              setStatusSuccess("");

              onBack();

            }}
          >
            ← Back to Dashboard
          </button>


          <div>

            <span className="admin-eyebrow">
              COMPLAINT DETAILS
            </span>

            <h2>
              Complaint Intelligence
            </h2>

            <p>
              Review AI analysis, citizen information,
              location and resolution status.
            </p>

          </div>

        </div>


        {/* ===============================================
            STATUS MESSAGES
        =============================================== */}

        {statusSuccess && (

          <div className="admin-status-success">

            ✓ {statusSuccess}

          </div>

        )}


        {statusError && (

          <div className="admin-status-error">

            ⚠️ {statusError}

          </div>

        )}


        {/* ===============================================
            STATUS ACTION PANEL
        =============================================== */}

        <div className="admin-detail-card admin-action-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                ADMIN ACTION
              </span>

              <h3>
                Manage Complaint Status
              </h3>

            </div>


            <span
              className={`admin-status status-${civicStatus
                .toLowerCase()
                .replace(
                  /\s+/g,
                  "-"
                )}`}
            >
              {civicStatus}
            </span>

          </div>


          <div className="admin-status-action-content">

            <div className="admin-current-status">

              <span>
                Current Status
              </span>

              <strong>
                {civicStatus}
              </strong>

            </div>


            <div className="admin-status-actions">

              {actions.length === 0 ? (

                <div className="admin-no-actions">

                  {civicStatus === "Forwarded"
                    ? "🏛️ Forwarded to the government channel. Government action is tracked separately."
                    : civicStatus === "Routed"
                      ? "🧭 Routed for government handling. Government action is tracked separately."
                      : "No further CivicFix admin action is available at this stage."}

                </div>

              ) : (

                actions.map(
                  (action) => (

                    <button
                      key={
                        action.status
                      }

                      type="button"

                      className={
                        action.className
                      }

                      disabled={
                        updatingStatus
                      }

                      onClick={() =>
                        updateComplaintStatus(
                          selectedComplaint._id,
                          action.status
                        )
                      }
                    >

                      {updatingStatus
                        ? "Updating..."
                        : action.label}

                    </button>

                  )
                )

              )}

            </div>

          </div>

        </div>


        {/* ===============================================
            GOVERNMENT ACTION STATUS
        =============================================== */}

        <div className="admin-detail-card government-action-status-card">
          <div className="admin-detail-card-header">
            <div>
              <span>GOVERNMENT ACTION</span>
              <h3>Government-side Status</h3>
            </div>
            <span className="government-action-status-badge">
              {selectedComplaint.governmentStatus || "Not Received"}
            </span>
          </div>

          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span>CivicFix Status</span>
              <strong>{civicStatus}</strong>
            </div>
            <div className="admin-detail-item">
              <span>Government Status</span>
              <strong>{selectedComplaint.governmentStatus || "Not Received"}</strong>
            </div>
            <div className="admin-detail-item">
              <span>Citizen Verification</span>
              <strong>{selectedComplaint.citizenVerification || "Pending"}</strong>
            </div>
          </div>

          <div className="government-action-note">
            <strong>Role separation:</strong> Government controls the operational
            status after forwarding. CivicFix admin only reviews the submitted
            government resolution and proof before final closure.
          </div>

          {selectedComplaint.governmentStatus === "Resolution Submitted" && (
            <div className="government-resolution-review-card">
              <div className="government-resolution-review-header">
                <div>
                  <span>RESOLUTION SUBMITTED</span>
                  <h4>Government Resolution & Proof</h4>
                </div>
                <span className="government-resolution-pending-badge">
                  {selectedComplaint.resolutionReview?.status || "Pending"}
                </span>
              </div>

              <div className="government-resolution-note-box">
                <span>Action Taken</span>
                <p>
                  {selectedComplaint.governmentAction?.resolutionNote ||
                    "No resolution note provided."}
                </p>
              </div>

              <div className="government-proof-section">
                <span>Proof</span>
                {selectedComplaint.governmentAction?.proofUrls?.length ? (
                  <div className="government-proof-list">
                    {selectedComplaint.governmentAction.proofUrls.map(
                      (url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="government-proof-link"
                        >
                          📎 Proof {index + 1}
                        </a>
                      )
                    )}
                  </div>
                ) : (
                  <p>No proof submitted.</p>
                )}
              </div>

              <div className="government-resolution-review-actions">
                <button
                  type="button"
                  className="government-resolution-approve-btn"
                  disabled={updatingStatus}
                  onClick={() =>
                    reviewGovernmentResolution(
                      selectedComplaint._id,
                      "approve"
                    )
                  }
                >
                  {updatingStatus ? "Updating..." : "✓ Verify & Resolve"}
                </button>

                <button
                  type="button"
                  className="government-resolution-reject-btn"
                  disabled={updatingStatus}
                  onClick={() =>
                    reviewGovernmentResolution(
                      selectedComplaint._id,
                      "reject"
                    )
                  }
                >
                  ↩ Request Rework
                </button>
              </div>
            </div>
          )}

          {selectedComplaint.resolutionReview?.status === "Approved" && (
            <div className="government-resolution-approved-box">
              ✓ Government resolution was verified by CivicFix admin and the
              complaint is now Resolved.
            </div>
          )}

          {selectedComplaint.resolutionReview?.status === "Rejected" && (
            <div className="government-resolution-rejected-box">
              <strong>Rework requested</strong>
              <p>
                {selectedComplaint.resolutionReview.note ||
                  "Government needs to update the resolution."}
              </p>
            </div>
          )}
        </div>


        {/* ===============================================
            COMPLAINT OVERVIEW
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                COMPLAINT
              </span>

              <h3>
                {selectedComplaint.title}
              </h3>

            </div>

          </div>


          <div className="admin-detail-description">

            {selectedComplaint.description}

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Area
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.area ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Subcategory
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.subcategory ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Severity
              </span>

              <strong>
                {
                  selectedComplaint.severity ||
                  "Not available"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Category
              </span>

              <strong>
                {
                  selectedComplaint.category ||
                  "Other"
                }
              </strong>

            </div>

          </div>

        </div>


        {/* ===============================================
            STATUS TIMELINE
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                WORKFLOW
              </span>

              <h3>
                Complaint Status Timeline
              </h3>

            </div>

          </div>


          <div className="admin-status-timeline">

            {statusFlow.map(
              (status, index) => {

                const completed =
                  currentStatusIndex >=
                  index;

                const active =
                  selectedComplaint.status ===
                  status;


                return (

                  <div
                    className={`admin-timeline-item ${
                      completed
                        ? "completed"
                        : ""
                    } ${
                      active
                        ? "active"
                        : ""
                    }`}

                    key={status}
                  >

                    <div className="admin-timeline-dot">

                      {completed
                        ? "✓"
                        : index + 1}

                    </div>


                    <div className="admin-timeline-content">

                      <strong>
                        {status}
                      </strong>


                      {active && (

                        <span>
                          Current Status
                        </span>

                      )}

                    </div>

                  </div>

                );

              }
            )}

          </div>


          {civicStatus ===
            "Rejected" && (

            <div className="admin-rejected-status">

              <strong>
                Complaint Rejected
              </strong>

              <span>
                This complaint is no longer
                active in the normal resolution workflow.
              </span>

            </div>

          )}

        </div>


        {/* ===============================================
            CITIZEN INFORMATION
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                CITIZEN
              </span>

              <h3>
                Reported By
              </h3>

            </div>

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Name
              </span>

              <strong>
                {
                  selectedComplaint.userId
                    ?.name ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Email
              </span>

              <strong>
                {
                  selectedComplaint.userId
                    ?.email ||
                  "Unknown"
                }
              </strong>

            </div>

          </div>

        </div>


        {/* ===============================================
            AI CLASSIFICATION
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                ARTIFICIAL INTELLIGENCE
              </span>

              <h3>
                AI Classification
              </h3>

            </div>

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Civic Issue
              </span>

              <strong>

                {selectedComplaint
                  .aiClassification
                  ?.isCivic === true
                  ? "Yes"
                  : selectedComplaint
                      .aiClassification
                      ?.isCivic === false
                    ? "No"
                    : "Unknown"}

              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Area
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.area ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Subcategory
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.subcategory ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Classification Source
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.subcategorySource ||
                  "ml_model"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                AI Severity
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.severity ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Department
              </span>

              <strong>
                {
                  selectedComplaint
                    .aiClassification
                    ?.department ||
                  "Unassigned"
                }
              </strong>

            </div>

          </div>

        </div>


        {/* ===============================================
            PRIORITY
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                PRIORITY ENGINE
              </span>

              <h3>
                Priority & Recommended Action
              </h3>

            </div>

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Priority
              </span>

              <strong>
                {
                  selectedComplaint.priority ||
                  "Not calculated"
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Priority Score
              </span>

              <strong>
                {
                  selectedComplaint
                    .priorityScore ??
                  0
                }
                /100
              </strong>

            </div>

          </div>


          <div className="admin-recommended-action">

            <span>
              Recommended Action
            </span>

            <p>
              {
                selectedComplaint
                  .recommendedAction ||
                "No recommended action available."
              }
            </p>

          </div>

        </div>


        {/* ===============================================
            LOCATION
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                LOCATION INTELLIGENCE
              </span>

              <h3>
                Complaint Location
              </h3>

            </div>

          </div>


          <div className="admin-location-box">

            <div className="admin-location-main">

              <span>
                📍 Address
              </span>

              <strong>
                {
                  selectedComplaint
                    .location
                    ?.address ||
                  "Unknown"
                }
              </strong>

            </div>


            <div className="admin-detail-grid">

              <div className="admin-detail-item">

                <span>
                  Ward
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.ward ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  Ward Code
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.wardCode ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  Zone
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.zone ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  Municipality
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.municipality ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  District
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.district ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  State
                </span>

                <strong>
                  {
                    selectedComplaint
                      .location
                      ?.state ||
                    "Unknown"
                  }
                </strong>

              </div>

            </div>


            <div className="admin-coordinates">

              <span>
                Coordinates
              </span>

              <strong>

                {
                  selectedComplaint
                    .location
                    ?.latitude ??
                  "N/A"
                }

                {" , "}

                {
                  selectedComplaint
                    .location
                    ?.longitude ??
                  "N/A"
                }

              </strong>

            </div>

          </div>

        </div>


        {/* ===============================================
            GOVERNMENT ROUTING
        =============================================== */}

        <div className="admin-detail-card government-routing-card">

          <div className="admin-detail-card-header">

            <div>
              <span>
                GOVERNMENT INTEGRATION
              </span>

              <h3>
                🏛️ Government Routing
              </h3>
            </div>

            <span
              className={`government-routing-status ${
                selectedComplaint.governmentRouting?.status ===
                "verified"
                  ? "verified"
                  : "warning"
              }`}
            >
              {selectedComplaint.governmentRouting?.status ===
              "verified"
                ? "✓ Route Verified"
                : "⚠ Verification Required"}
            </span>

          </div>

          {selectedComplaint.governmentRouting ? (

            <div className="government-routing-content">

              <div className="admin-detail-grid">

                <div className="admin-detail-item">
                  <span>Government Service</span>
                  <strong>
                    {selectedComplaint.governmentRouting.serviceName ||
                      "Not identified"}
                  </strong>
                </div>

                <div className="admin-detail-item">
                  <span>Authority</span>
                  <strong>
                    {selectedComplaint.governmentRouting.authorityName ||
                      "Not identified"}
                  </strong>
                </div>

                <div className="admin-detail-item">
                  <span>Department</span>
                  <strong>
                    {selectedComplaint.governmentRouting.department ||
                      "Not identified"}
                  </strong>
                </div>

                <div className="admin-detail-item">
                  <span>Complaint Channel</span>
                  <strong>
                    {selectedComplaint.governmentRouting.complaintChannel ||
                      "Not available"}
                  </strong>
                </div>

                <div className="admin-detail-item">
                  <span>Contact</span>
                  <strong>
                    {selectedComplaint.governmentRouting.complaintPhone ||
                      "Not available"}
                  </strong>
                </div>

                <div className="admin-detail-item">
                  <span>Source</span>
                  <strong>
                    {selectedComplaint.governmentRouting.sourceName ||
                      "Not available"}
                  </strong>
                </div>

              </div>

              {selectedComplaint.governmentRouting.routingMessage && (
                <div className="government-routing-message">
                  <span>Routing Information</span>
                  <p>
                    {selectedComplaint.governmentRouting.routingMessage}
                  </p>
                </div>
              )}

              <div className="government-links">
                {selectedComplaint.governmentRouting.officialUrl && (
                  <a
                    href={selectedComplaint.governmentRouting.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="government-link"
                  >
                    🌐 Official Website
                  </a>
                )}

                {selectedComplaint.governmentRouting.complaintUrl && (
                  <a
                    href={selectedComplaint.governmentRouting.complaintUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="government-link"
                  >
                    📋 Complaint Channel
                  </a>
                )}
              </div>

              {selectedComplaint.governmentForwarding?.status ===
              "forwarded" ? (

                <div className="government-forwarded-box">

                  <div className="government-forwarded-header">
                    <strong>✓ Complaint Forwarded</strong>
                    <span>Official channel</span>
                  </div>

                  <div className="admin-detail-grid">

                    <div className="admin-detail-item">
                      <span>Destination</span>
                      <strong>
                        {selectedComplaint.governmentForwarding.destination ||
                          selectedComplaint.governmentRouting.authorityName ||
                          "Government Authority"}
                      </strong>
                    </div>

                    <div className="admin-detail-item">
                      <span>Channel</span>
                      <strong>
                        {selectedComplaint.governmentForwarding.channel ||
                          "Official Channel"}
                      </strong>
                    </div>

                    <div className="admin-detail-item">
                      <span>Reference ID</span>
                      <strong>
                        {selectedComplaint.governmentForwarding.referenceId ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="admin-detail-item">
                      <span>Forwarded At</span>
                      <strong>
                        {formatDate(
                          selectedComplaint.governmentForwarding.forwardedAt
                        )}
                      </strong>
                    </div>

                  </div>

                  {selectedComplaint.governmentForwarding.adminNote && (
                    <div className="government-routing-message">
                      <span>Admin Note</span>
                      <p>
                        {selectedComplaint.governmentForwarding.adminNote}
                      </p>
                    </div>
                  )}

                </div>

              ) : (

                <div className="government-forward-action">

                  {civicStatus === "Verified" &&
                  selectedComplaint.governmentRouting.status ===
                    "verified" ? (

                    <>
                      <div>
                        <strong>
                          Ready for Government Forwarding
                        </strong>
                        <p>
                          The complaint has been verified and a government
                          service has been identified.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="government-forward-btn"
                        disabled={updatingStatus}
                        onClick={() =>
                          forwardComplaintToGovernment(
                            selectedComplaint._id
                          )
                        }
                      >
                        {updatingStatus
                          ? "Forwarding..."
                          : "🏛️ Forward to Government"}
                      </button>
                    </>

                  ) : (

                    <div>
                      <strong>
                        Government forwarding unavailable
                      </strong>
                      <p>
                        Complaint must be verified and have a verified
                        government route before it can be forwarded.
                      </p>
                    </div>

                  )}

                </div>

              )}

            </div>

          ) : (

            <div className="admin-empty-detail">
              <span>🏛️</span>
              <p>
                Government routing information is not available for this
                complaint.
              </p>
            </div>

          )}

        </div>


        {/* ===============================================
            INCIDENT
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                INCIDENT INTELLIGENCE
              </span>

              <h3>
                Incident Information
              </h3>

            </div>

          </div>


          {incident ? (

            <div className="admin-detail-grid">

              <div className="admin-detail-item">

                <span>
                  Incident ID
                </span>

                <strong>
                  {
                    incident.incidentId ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  Incident Status
                </span>

                <strong>
                  {
                    incident.status ||
                    selectedComplaint
                      .incidentStatus ||
                    "Unknown"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <span>
                  Complaint Count
                </span>

                <strong>
                  {
                    incident
                      .complaintCount ??
                    "N/A"
                  }
                </strong>

              </div>

            </div>

          ) : (

            <div className="admin-empty-detail">

              <span>
                🔗
              </span>

              <p>
                This complaint is not currently
                linked to an incident.
              </p>

            </div>

          )}

        </div>


        {/* ===============================================
            DUPLICATE INTELLIGENCE
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                DUPLICATE INTELLIGENCE
              </span>

              <h3>
                Duplicate Detection
              </h3>

            </div>

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Possible Duplicate
              </span>

              <strong>

                {
                  selectedComplaint
                    .duplicateDetection
                    ?.isDuplicate
                    ? "Yes"
                    : "No"
                }

              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Similarity Score
              </span>

              <strong>

                {
                  (
                    (
                      selectedComplaint
                        .duplicateDetection
                        ?.similarityScore ||
                      0
                    ) * 100
                  ).toFixed(1)
                }%

              </strong>

            </div>

          </div>


          {selectedComplaint
            .duplicateDetection
            ?.message && (

            <div className="admin-recommended-action">

              <span>
                Detection Message
              </span>

              <p>
                {
                  selectedComplaint
                    .duplicateDetection
                    .message
                }
              </p>

            </div>

          )}

        </div>


        {/* ===============================================
            DATES
        =============================================== */}

        <div className="admin-detail-card">

          <div className="admin-detail-card-header">

            <div>

              <span>
                RECORD INFORMATION
              </span>

              <h3>
                Complaint Dates
              </h3>

            </div>

          </div>


          <div className="admin-detail-grid">

            <div className="admin-detail-item">

              <span>
                Reported On
              </span>

              <strong>
                {
                  formatDate(
                    selectedComplaint.createdAt
                  )
                }
              </strong>

            </div>


            <div className="admin-detail-item">

              <span>
                Last Updated
              </span>

              <strong>
                {
                  formatDate(
                    selectedComplaint.updatedAt
                  )
                }
              </strong>

            </div>

          </div>

        </div>


        {/* ===============================================
            BACK BUTTON
        =============================================== */}

        <div className="admin-detail-bottom">

          <button
            type="button"
            className="admin-back-btn"
            onClick={() => {

              setSelectedComplaint(
                null
              );

              setStatusError("");

              setStatusSuccess("");

              onBack();

            }}
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>

    );

  }


  // =======================================================
  // ALL COMPLAINTS LIST
  // =======================================================

  return (

    <div className="admin-complaints-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="admin-complaints-header">

        <div>

          <button
            type="button"
            className="admin-back-btn"
            onClick={onBack}
          >
            ← Dashboard
          </button>

        </div>


        <div className="admin-complaints-heading">

          <span className="admin-eyebrow">
            CIVICFIX AI
          </span>

          <h2>
            All Complaints
          </h2>

          <p>
            Review and manage all citizen complaints.
          </p>

        </div>


        <div className="admin-complaints-header-actions">

          <div className="admin-total-complaints">

            <span>
              Total Complaints
            </span>

            <strong>
              {complaintList.length}
            </strong>

          </div>

          <button
            type="button"
            className="admin-download-btn"
            onClick={downloadExcelReport}
            disabled={loading || complaintList.length === 0}
          >
            📊 Download Excel Report
          </button>

        </div>

      </div>


      {/* ===============================================
          COMPLAINT LIST
      =============================================== */}

      {loading ? (

        <div className="no-admin-complaints">

          <div className="empty-icon">
            ⏳
          </div>

          <h3>
            Loading complaints...
          </h3>

          <p>
            Fetching all complaints from server.
          </p>

        </div>

      ) : complaintList.length === 0 ? (

        <div className="no-admin-complaints">

          <div className="empty-icon">
            📋
          </div>

          <h3>
            No complaints found
          </h3>

          <p>
            There are currently no reported complaints.
          </p>

        </div>

      ) : (

        <div className="admin-complaints-list">

          {complaintList.map(
            (complaint) => (

              <div
                className="admin-complaint-card"
                key={complaint._id}
              >

                {/* ======================================
                    CARD TOP
                ====================================== */}

                <div className="admin-card-top">

                  <div>

                    <h3>
                      {complaint.title}
                    </h3>

                    <p className="admin-category">

                      {
                        complaint
                          .aiClassification
                          ?.area ||
                        complaint.category ||
                        "Other"
                      }

                      {" • "}

                      {
                        complaint
                          .aiClassification
                          ?.subcategory ||
                        complaint.category ||
                        "Other"
                      }

                    </p>

                  </div>


                  <span
                    className={`admin-status status-${complaint.status
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {complaint.status}
                  </span>

                </div>


                {/* ======================================
                    DESCRIPTION
                ====================================== */}

                <p className="admin-description">

                  {complaint.description}

                </p>


                {/* ======================================
                    INFO
                ====================================== */}

                <div className="admin-info">

                  <div>

                    <span>
                      Reported By
                    </span>

                    <strong>
                      {
                        complaint.userId
                          ?.name ||
                        "Unknown"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Department
                    </span>

                    <strong>
                      {
                        complaint
                          .aiClassification
                          ?.department ||
                        "Unassigned"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Priority
                    </span>

                    <strong>
                      {
                        complaint.priority ||
                        "Not calculated"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Location
                    </span>

                    <strong>
                      {
                        complaint.location
                          ?.address ||
                        "Unknown"
                      }
                    </strong>

                  </div>

                </div>


                {/* ======================================
                    CARD FOOTER
                ====================================== */}

                <div className="admin-card-footer">

                  <span>

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

                  </span>


                  <button
                    type="button"
                    className="admin-view-btn"
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

            )
          )}

        </div>

      )}

    </div>

  );

}


export default AdminComplaints;