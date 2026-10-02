import express from "express";
import Complaint from "../models/complaint.js";
import User from "../models/User.js";
import Incident from "../models/incident.js";
import GovernmentSource from "../models/GovernmentSource.js";
import GovernmentService from "../models/GovernmentService.js";

import {
    getLocationIntelligence
} from "../services/locationService.js";

import {
    findGovernmentRoute
} from "../services/governmentRoutingService.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import governmentMiddleware from "../middlewares/governmentMiddleware.js";

const router = express.Router();


// =========================================================
// CIVICFIX STATUS HELPERS
// =========================================================

const getCivicFixStatus = (complaint) => {
    if (complaint.civicFixStatus) {
        return complaint.civicFixStatus;
    }

    if (complaint.status === "Under Review") return "Under Review";
    if (complaint.status === "Verified") return "Verified";
    if (complaint.status === "Forwarded") return "Forwarded";
    if (complaint.status === "Resolved") return "Resolved";

    return "Reported";
};



// =========================================================
// CREATE COMPLAINT
// =========================================================

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                title,
                description,
                category,
                location,
                severity
            } = req.body;


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !title ||
                !description ||
                !location
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Please provide required fields"
                });

            }


            // =================================================
            // DEFAULT AI CLASSIFICATION
            // =================================================

            let aiClassification = {

                isCivic: null,

                area: "",

                subcategory: "",

                subcategorySource: "ml_model",

                severity: "",

                department: "",

                priorityScore: 0,

                priority: "",

                recommendedAction: ""

            };


            // =================================================
            // AI CLASSIFICATION
            // =================================================

            try {

                console.log(
                    "\n🤖 Sending complaint to CivicFix AI..."
                );

                console.log("Title:", title);
                console.log("Description:", description);


                const mlResponse = await fetch(
                    "http://localhost:8000/predict",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            title,
                            description
                        })
                    }
                );


                if (mlResponse.ok) {

                    const mlData =
                        await mlResponse.json();


                    console.log(
                        "✅ ML Response:",
                        mlData
                    );


                    aiClassification = {

                        isCivic:
                            mlData.isCivic ?? null,

                        area:
                            mlData.area ?? "",

                        subcategory:
                            mlData.subcategory ?? "",

                        subcategorySource:
                            mlData.subcategorySource ??
                            "ml_model",

                        severity:
                            mlData.severity ?? "",

                        department:
                            mlData.department ?? "",

                        priorityScore:
                            mlData.priorityScore ?? 0,

                        priority:
                            mlData.priority ?? "",

                        recommendedAction:
                            mlData.recommendedAction ?? ""

                    };

                } else {

                    console.log(
                        "❌ ML API returned status:",
                        mlResponse.status
                    );

                }

            } catch (mlError) {

                console.log(
                    "⚠️ ML API connection failed:",
                    mlError.message
                );

            }


            // =================================================
            // DUPLICATE DETECTION
            // =================================================

            let duplicateDetection = {

                isDuplicate: false,

                similarityScore: 0,

                matchedComplaintId: null,

                message: ""

            };


            try {

                console.log(
                    "\n🔎 Checking for duplicate complaints..."
                );


                const existingComplaints =
                    await Complaint.find({})
                        .select(
                            "_id title description aiClassification createdAt"
                        )
                        .sort({
                            createdAt: -1
                        })
                        .limit(100);


                const complaintCandidates =
                    existingComplaints.map(
                        (complaint) => ({

                            id:
                                complaint._id.toString(),

                            text:
                                `${complaint.title} ${complaint.description}`

                        })
                    );


                if (
                    complaintCandidates.length > 0
                ) {

                    const duplicateResponse =
                        await fetch(
                            "http://localhost:8000/duplicate-check",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    complaintText:
                                        `${title} ${description}`,

                                    existingComplaints:
                                        complaintCandidates

                                })
                            }
                        );


                    if (
                        duplicateResponse.ok
                    ) {

                        const duplicateData =
                            await duplicateResponse.json();


                        console.log(
                            "🔎 Duplicate Result:",
                            duplicateData
                        );


                        duplicateDetection = {

                            isDuplicate:
                                duplicateData.isDuplicate ??
                                false,

                            similarityScore:
                                duplicateData.similarityScore ??
                                0,

                            matchedComplaintId:
                                duplicateData.isDuplicate
                                    ? (
                                        duplicateData.matchedComplaintId ??
                                        null
                                    )
                                    : null,

                            message:
                                duplicateData.message ??
                                ""

                        };

                    } else {

                        console.log(
                            "❌ Duplicate API returned status:",
                            duplicateResponse.status
                        );

                    }

                } else {

                    console.log(
                        "ℹ️ No existing complaints available for duplicate check."
                    );

                }

            } catch (duplicateError) {

                console.log(
                    "⚠️ Duplicate detection failed:",
                    duplicateError.message
                );

            }


            // =================================================
            // LOCATION INTELLIGENCE
            // =================================================

            let processedLocation = location;


            try {

                const locationResult =
                    await getLocationIntelligence({

                        latitude:
                            location.latitude,

                        longitude:
                            location.longitude,

                        address:
                            location.address || ""

                    });


                if (
                    locationResult.success
                ) {

                    processedLocation =
                        locationResult.location;


                    console.log(
                        "📍 Location processed:",
                        processedLocation
                    );

                }

            } catch (locationError) {

                console.log(
                    "⚠️ Location intelligence failed:",
                    locationError.message
                );

            }


            // =================================================
            // GOVERNMENT ROUTING
            // =================================================

            let governmentRouting = {

                status: "not_checked",

                serviceId: null,

                serviceName: "",

                authorityName: "",

                department: "",

                officialUrl: "",

                complaintChannel: "",

                complaintUrl: "",

                complaintPhone: "",

                sourceId: null,

                sourceName: "",

                routingMessage: "",

                matchedAt: null

            };


            try {

                console.log(
                    "\n🏛️ Finding Government Service..."
                );


                const routingResult =
                    await findGovernmentRoute({

                        area:
                            aiClassification.area,

                        subcategory:
                            aiClassification.subcategory,

                        department:
                            aiClassification.department,

                        title,

                        description,

                        location:
                            processedLocation

                    });


                governmentRouting = {

                    status:
                        routingResult.status,

                    serviceId:
                        routingResult.service?.id ||
                        null,

                    serviceName:
                        routingResult.service?.serviceName ||
                        "",

                    authorityName:
                        routingResult.service?.authorityName ||
                        "",

                    department:
                        routingResult.service?.department ||
                        aiClassification.department ||
                        "",

                    officialUrl:
                        routingResult.service?.officialUrl ||
                        "",

                    complaintChannel:
                        routingResult.service?.complaintChannel ||
                        "",

                    complaintUrl:
                        routingResult.service?.complaintUrl ||
                        "",

                    complaintPhone:
                        routingResult.service?.complaintPhone ||
                        "",

                    sourceId:
                        routingResult.source?.id ||
                        null,

                    sourceName:
                        routingResult.source?.sourceName ||
                        "",

                    routingMessage:
                        routingResult.message ||
                        "",

                    matchedAt:
                        new Date()

                };


                console.log(
                    "🏛️ Government Routing:",
                    governmentRouting
                );


            } catch (routingError) {

                console.log(
                    "⚠️ Government routing failed:",
                    routingError.message
                );

            }


            // =================================================
            // SAVE COMPLAINT
            // =================================================

            const complaint =
                await Complaint.create({

                    userId:
                        req.user.userId,

                    title,

                    description,

                    category,

                    location:
                        processedLocation,

                    severity:
                        aiClassification.severity ||
                        severity ||
                        "Low",


                    // =========================================
                    // AI CLASSIFICATION
                    // =========================================

                    aiClassification: {

                        isCivic:
                            aiClassification.isCivic,

                        area:
                            aiClassification.area,

                        subcategory:
                            aiClassification.subcategory,

                        subcategorySource:
                            aiClassification.subcategorySource,

                        severity:
                            aiClassification.severity,

                        department:
                            aiClassification.department

                    },


                    // =========================================
                    // PRIORITY
                    // =========================================

                    priorityScore:
                        aiClassification.priorityScore ||
                        0,

                    priority:
                        aiClassification.priority ||
                        "",

                    recommendedAction:
                        aiClassification.recommendedAction ||
                        "",


                    // =========================================
                    // DUPLICATE
                    // =========================================

                    duplicateDetection,


                    // =========================================
                    // GOVERNMENT ROUTING
                    // =========================================

                    governmentRouting

                });


            console.log(
                "\n✅ Complaint saved:",
                complaint._id
            );


            // =================================================
            // INCIDENT CLUSTERING
            // =================================================

            let incident = null;


            try {

                if (
                    duplicateDetection.isDuplicate &&
                    duplicateDetection.matchedComplaintId
                ) {

                    console.log(
                        "\n🔗 Possible duplicate found."
                    );


                    console.log(
                        "Matched Complaint:",
                        duplicateDetection.matchedComplaintId
                    );


                    const matchedComplaint =
                        await Complaint.findById(
                            duplicateDetection.matchedComplaintId
                        );


                    if (matchedComplaint) {


                        // =====================================
                        // EXISTING INCIDENT
                        // =====================================

                        if (
                            matchedComplaint.incidentId
                        ) {

                            incident =
                                await Incident.findById(
                                    matchedComplaint.incidentId
                                );


                            if (incident) {

                                const alreadyLinked =
                                    incident.complaints.some(
                                        (id) =>
                                            id.toString() ===
                                            complaint._id.toString()
                                    );


                                if (!alreadyLinked) {

                                    incident.complaints.push(
                                        complaint._id
                                    );

                                }


                                incident.complaintCount =
                                    incident.complaints.length;


                                await incident.save();


                                console.log(
                                    "🔗 Complaint added to existing incident:",
                                    incident.incidentId
                                );

                            }


                        }


                        // =====================================
                        // CREATE NEW INCIDENT
                        // =====================================

                        else {

                            const incidentNumber =
                                `INC-${Date.now()}`;


                            incident =
                                await Incident.create({

                                    incidentId:
                                        incidentNumber,

                                    title:
                                        matchedComplaint.title,

                                    area:
                                        matchedComplaint
                                            .aiClassification
                                            ?.area ||
                                        "",

                                    subcategory:
                                        matchedComplaint
                                            .aiClassification
                                            ?.subcategory ||
                                        "",

                                    department:
                                        matchedComplaint
                                            .aiClassification
                                            ?.department ||
                                        "",

                                    priority:
                                        matchedComplaint.priority ||
                                        "",

                                    complaintCount:
                                        2,

                                    complaints: [

                                        matchedComplaint._id,

                                        complaint._id

                                    ],

                                    status:
                                        "Open",

                                    location:
                                        matchedComplaint.location

                                });


                            matchedComplaint.incidentId =
                                incident._id;


                            matchedComplaint.incidentStatus =
                                incident.status;


                            await matchedComplaint.save();


                            console.log(
                                "🆕 New incident created:",
                                incident.incidentId
                            );

                        }

                    }

                }

            } catch (incidentError) {

                console.log(
                    "⚠️ Incident clustering failed:",
                    incidentError.message
                );

            }


            // =================================================
            // LINK NEW COMPLAINT TO INCIDENT
            // =================================================

            if (incident) {

                complaint.incidentId =
                    incident._id;

                complaint.incidentStatus =
                    incident.status;


                await complaint.save();


                console.log(
                    "🔗 New complaint linked to incident:",
                    incident.incidentId
                );

            }


            // =================================================
            // FINAL RESPONSE
            // =================================================

            res.status(201).json({

                success: true,

                message:
                    "Complaint created successfully",

                complaint,

                aiClassification,

                duplicateDetection,

                governmentRouting,

                location:
                    complaint.location,

                incident:

                    incident

                        ? {

                            id:
                                incident._id,

                            incidentId:
                                incident.incidentId,

                            complaintCount:
                                incident.complaintCount,

                            status:
                                incident.status

                        }

                        : null

            });


        } catch (error) {

            console.error(
                "❌ Complaint creation error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// GET MY COMPLAINTS
// =========================================================

router.get(
    "/my",
    authMiddleware,
    async (req, res) => {

        try {

            const complaints =
                await Complaint.find({

                    userId:
                        req.user.userId

                })

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                )

                .sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                complaints

            });


        } catch (error) {

            console.error(
                "Fetch complaints error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch complaints",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// ADMIN — ALL COMPLAINTS
// =========================================================

router.get(
    "/admin/all",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const complaints =
                await Complaint.find()

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                )

                .sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                count:
                    complaints.length,

                complaints

            });


        } catch (error) {

            console.error(
                "Admin complaints error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch complaints",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// ADMIN — ALL INCIDENTS
// =========================================================

router.get(
    "/admin/incidents",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const incidents =
                await Incident.find()

                .populate(
                    "complaints"
                )

                .sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                count:
                    incidents.length,

                incidents

            });


        } catch (error) {

            console.error(
                "Admin incidents error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch incidents",

                error:
                    error.message

            });

        }

    }
);
// =========================================================
// ADMIN — CIVICFIX STATUS UPDATE
// =========================================================
// Admin can control only the CivicFix-side workflow.
// Government action statuses are intentionally excluded.

router.patch(
    "/admin/:complaintId/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { complaintId } = req.params;
            const { status: requestedStatus } = req.body;

            const allowedStatuses = [
                "Reported",
                "Under Review",
                "Verified",
                "Resolved",
                "Rejected",
                "Routed",
                "Forwarded"
            ];

            if (!allowedStatuses.includes(requestedStatus)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid CivicFix status. Government action statuses cannot be changed by admin."
                });
            }

            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            const currentStatus = getCivicFixStatus(complaint);

            const transitionMap = {
                "Reported": ["Under Review", "Rejected"],
                "Under Review": ["Verified", "Rejected"],
                "Verified": ["Rejected"],
                "Forwarded": [],
                "Resolved": [],
                "Rejected": [],
                "Routed": []
            };

            if (requestedStatus === currentStatus) {
                return res.status(200).json({
                    success: true,
                    message: "Complaint is already at this CivicFix status.",
                    complaint
                });
            }

            if (!(transitionMap[currentStatus] || []).includes(requestedStatus)) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid CivicFix status transition: ${currentStatus} → ${requestedStatus}.`,
                    civicFixStatus: currentStatus,
                    governmentStatus: complaint.governmentStatus || "Not Received"
                });
            }

            complaint.civicFixStatus = requestedStatus;
            complaint.status = requestedStatus;

            await complaint.save();

            const updatedComplaint = await Complaint.findById(complaint._id)
                .populate("userId", "name email")
                .populate("incidentId")
                .populate("governmentRouting.serviceId")
                .populate("governmentRouting.sourceId");

            return res.status(200).json({
                success: true,
                message: `CivicFix status updated to ${requestedStatus}.`,
                complaint: updatedComplaint
            });
        } catch (error) {
            console.error("❌ CivicFix status update error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to update CivicFix complaint status",
                error: error.message
            });
        }
    }
);


// =========================================================
// ADMIN — GOVERNMENT FORWARDING
// =========================================================

// =========================================================

router.patch(
    "/admin/:complaintId/government-forward",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { complaintId } = req.params;

            const {
                referenceId = "",
                adminNote = "",
                channel = "",
                destination = ""
            } = req.body;

            // =====================================================
            // FIND COMPLAINT
            // =====================================================

            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            // =====================================================
            // COMPLAINT MUST BE VERIFIED
            // =====================================================

            const currentCivicFixStatus = getCivicFixStatus(complaint);

            if (currentCivicFixStatus !== "Verified") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Complaint must be Verified before forwarding to government."
                });
            }

            // =====================================================
            // GOVERNMENT ROUTE MUST EXIST
            // =====================================================

            if (
                !complaint.governmentRouting ||
                complaint.governmentRouting.status !== "verified"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "A verified government route is required before forwarding.",
                    governmentRouting:
                        complaint.governmentRouting || null
                });
            }

            // =====================================================
            // GOVERNMENT SERVICE VALIDATION
            // =====================================================

            const governmentService =
                complaint.governmentRouting.serviceId
                    ? await GovernmentService.findById(
                          complaint.governmentRouting.serviceId
                      )
                    : null;

            // =====================================================
            // DETERMINE CHANNEL
            // =====================================================

            const forwardingChannel =
                channel ||
                complaint.governmentRouting.complaintChannel ||
                "Official Government Channel";

            // =====================================================
            // DETERMINE DESTINATION
            // =====================================================

            const forwardingDestination =
                destination ||
                complaint.governmentRouting.authorityName ||
                "Government Authority";

            // =====================================================
            // UPDATE GOVERNMENT FORWARDING
            // =====================================================

            complaint.governmentForwarding = {
                status: "forwarded",

                forwardedAt: new Date(),

                forwardedBy: req.user.userId,

                channel: forwardingChannel,

                destination: forwardingDestination,

                referenceId: referenceId.trim(),

                adminNote: adminNote.trim()
            };

            // This is only a CivicFix forwarding record.
            // It does NOT mean the government has accepted, started,
            // or resolved the complaint.
            complaint.civicFixStatus = "Forwarded";
            complaint.status = "Forwarded";

            // Keep government action untouched until an authorized
            // government integration reports an actual action.
            if (!complaint.governmentStatus) {
                complaint.governmentStatus = "Not Received";
            }

            await complaint.save();

            // =====================================================
            // RESPONSE
            // =====================================================

            console.log(
                "\n🏛️ Complaint marked as forwarded to government"
            );

            console.log(
                "Complaint ID:",
                complaint._id.toString()
            );

            console.log(
                "Authority:",
                forwardingDestination
            );

            console.log(
                "Channel:",
                forwardingChannel
            );

            console.log(
                "Reference ID:",
                referenceId || "Not provided"
            );

            res.status(200).json({
                success: true,

                message:
                    "Complaint forwarding recorded successfully.",

                complaint,

                governmentForwarding:
                    complaint.governmentForwarding,

                governmentRouting:
                    complaint.governmentRouting,

                governmentService
            });

        } catch (error) {
            console.error(
                "❌ Government forwarding error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to record government forwarding.",
                error: error.message
            });
        }
    }
);


// =========================================================
// GOVERNMENT — ACTION WORKFLOW
// Government owns the operational status after CivicFix forwards
// the complaint. Admin cannot change these statuses.
// =========================================================

const governmentTransitionMap = {
    "Not Received": ["Received"],
    "Received": ["Accepted"],
    "Accepted": ["Work Started"],
    "Work Started": ["In Progress"],
    "In Progress": ["Resolution Submitted"],
    "Resolution Submitted": [],
};

router.patch(
    "/government/:complaintId/action",
    authMiddleware,
    governmentMiddleware,
    async (req, res) => {
        try {
            const { complaintId } = req.params;
            const { status, resolutionNote = "", proofUrls = [] } = req.body;

            const allowedStatuses = Object.keys(governmentTransitionMap);
            const requestedStatus = String(status || "").trim();

            if (!allowedStatuses.includes(requestedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid government action status."
                });
            }

            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            if (getCivicFixStatus(complaint) !== "Forwarded") {
                return res.status(400).json({
                    success: false,
                    message: "Government action can start only after CivicFix forwards the complaint."
                });
            }

            const currentGovernmentStatus = complaint.governmentStatus || "Not Received";

            if (requestedStatus === currentGovernmentStatus) {
                return res.status(400).json({
                    success: false,
                    message: `Government status is already ${currentGovernmentStatus}.`
                });
            }

            if (!(governmentTransitionMap[currentGovernmentStatus] || []).includes(requestedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid government status transition: ${currentGovernmentStatus} → ${requestedStatus}.`,
                    governmentStatus: currentGovernmentStatus
                });
            }

            const now = new Date();
            complaint.governmentStatus = requestedStatus;
            complaint.governmentAction.lastUpdatedAt = now;
            complaint.governmentAction.lastUpdatedBy = req.user.userId;

            if (requestedStatus === "Received") {
                complaint.governmentAction.receivedAt = now;
            }

            if (requestedStatus === "Accepted") {
                complaint.governmentAction.acceptedAt = now;
            }

            if (requestedStatus === "Work Started") {
                complaint.governmentAction.workStartedAt = now;
            }

            if (requestedStatus === "Resolution Submitted") {
                const cleanNote = String(resolutionNote || "").trim();

                if (!cleanNote) {
                    return res.status(400).json({
                        success: false,
                        message: "Resolution note is required before submitting a resolution."
                    });
                }

                if (!Array.isArray(proofUrls) || proofUrls.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "At least one proof URL is required before submitting a resolution."
                    });
                }

                const cleanProofUrls = proofUrls
                    .map((url) => String(url || "").trim())
                    .filter(Boolean)
                    .slice(0, 10);

                if (cleanProofUrls.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "At least one valid proof URL is required."
                    });
                }

                complaint.governmentAction.resolutionSubmittedAt = now;
                complaint.governmentAction.resolutionNote = cleanNote;
                complaint.governmentAction.proofUrls = cleanProofUrls;
                complaint.resolutionReview = {
                    status: "Pending",
                    reviewedAt: null,
                    reviewedBy: null,
                    note: ""
                };
            }

            await complaint.save();

            const updatedComplaint = await Complaint.findById(complaint._id)
                .populate("userId", "name email")
                .populate("incidentId")
                .populate("governmentRouting.serviceId")
                .populate("governmentRouting.sourceId")
                .populate("governmentAction.lastUpdatedBy", "name email")
                .populate("resolutionReview.reviewedBy", "name email");

            return res.status(200).json({
                success: true,
                message: `Government status updated to ${requestedStatus}.`,
                complaint: updatedComplaint
            });
        } catch (error) {
            console.error("❌ Government action update error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update government action.",
                error: error.message
            });
        }
    }
);

// =========================================================
// ADMIN — VERIFY GOVERNMENT RESOLUTION
// =========================================================

router.patch(
    "/admin/:complaintId/resolution-review",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { complaintId } = req.params;
            const { decision, note = "" } = req.body;
            const normalizedDecision = String(decision || "").trim().toLowerCase();
            const reviewNote = String(note || "").trim();

            if (!["approve", "reject"].includes(normalizedDecision)) {
                return res.status(400).json({
                    success: false,
                    message: "Decision must be approve or reject."
                });
            }

            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            if (getCivicFixStatus(complaint) !== "Forwarded") {
                return res.status(400).json({
                    success: false,
                    message: "Only forwarded complaints can have a government resolution reviewed."
                });
            }

            if (complaint.governmentStatus !== "Resolution Submitted") {
                return res.status(400).json({
                    success: false,
                    message: "Government must submit a resolution before admin review."
                });
            }

            if (!complaint.governmentAction?.resolutionNote?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Resolution note is missing."
                });
            }

            if (!Array.isArray(complaint.governmentAction?.proofUrls) || complaint.governmentAction.proofUrls.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Resolution proof is required before admin approval."
                });
            }

            const now = new Date();

            if (normalizedDecision === "approve") {
                complaint.civicFixStatus = "Resolved";
                complaint.status = "Resolved";
                complaint.resolutionReview = {
                    status: "Approved",
                    reviewedAt: now,
                    reviewedBy: req.user.userId,
                    note: reviewNote
                };
            } else {
                complaint.governmentStatus = "In Progress";
                complaint.governmentAction.resolutionSubmittedAt = null;
                complaint.governmentAction.lastUpdatedAt = now;
                complaint.governmentAction.lastUpdatedBy = req.user.userId;
                complaint.resolutionReview = {
                    status: "Rejected",
                    reviewedAt: now,
                    reviewedBy: req.user.userId,
                    note: reviewNote || "Please review and resubmit the resolution with sufficient proof."
                };
            }

            await complaint.save();

            const updatedComplaint = await Complaint.findById(complaint._id)
                .populate("userId", "name email")
                .populate("incidentId")
                .populate("governmentRouting.serviceId")
                .populate("governmentRouting.sourceId")
                .populate("governmentAction.lastUpdatedBy", "name email")
                .populate("resolutionReview.reviewedBy", "name email");

            return res.status(200).json({
                success: true,
                message:
                    normalizedDecision === "approve"
                        ? "Government resolution approved and complaint marked Resolved."
                        : "Resolution rejected. Complaint returned to government In Progress status.",
                complaint: updatedComplaint
            });
        } catch (error) {
            console.error("❌ Government resolution review error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to review government resolution.",
                error: error.message
            });
        }
    }
);

export default router;