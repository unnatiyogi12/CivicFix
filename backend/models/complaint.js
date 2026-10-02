import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            default: "other"
        },

        imageUrl: {
            type: String,
            default: ""
        },

        location: {
            address: {
                type: String,
                required: true
            },
            latitude: { type: Number },
            longitude: { type: Number },
            ward: { type: String, default: "" },
            wardCode: { type: String, default: "" },
            zone: { type: String, default: "" },
            municipality: { type: String, default: "" },
            ulbCode: { type: String, default: "" },
            district: { type: String, default: "" },
            state: { type: String, default: "" },
            jurisdiction: { type: String, default: "" },
            source: { type: String, default: "" }
        },

        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low"
        },

        aiClassification: {
            isCivic: { type: Boolean, default: null },
            area: { type: String, default: "" },
            subcategory: { type: String, default: "" },
            subcategorySource: {
                type: String,
                enum: ["ml_model", "business_rule", ""],
                default: "ml_model"
            },
            severity: {
                type: String,
                enum: ["Low", "Medium", "High", "Critical", ""],
                default: ""
            },
            department: { type: String, default: "" }
        },

        priorityScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        priority: {
            type: String,
            enum: ["", "Low", "Medium", "High", "Critical"],
            default: ""
        },

        recommendedAction: {
            type: String,
            default: ""
        },

        duplicateDetection: {
            isDuplicate: { type: Boolean, default: false },
            similarityScore: {
                type: Number,
                default: 0,
                min: 0,
                max: 1
            },
            matchedComplaintId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Complaint",
                default: null
            },
            message: { type: String, default: "" }
        },

        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            default: null
        },

        incidentStatus: {
            type: String,
            enum: [
                "",
                "Open",
                "Under Review",
                "In Progress",
                "Resolved",
                "Closed"
            ],
            default: ""
        },

        governmentRouting: {
            status: {
                type: String,
                enum: [
                    "not_checked",
                    "verified",
                    "jurisdiction_required",
                    "needs_verification",
                    "no_verified_route",
                    "routing_error"
                ],
                default: "not_checked"
            },
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GovernmentService",
                default: null
            },
            serviceName: { type: String, default: "" },
            authorityName: { type: String, default: "" },
            department: { type: String, default: "" },
            officialUrl: { type: String, default: "" },
            complaintChannel: { type: String, default: "" },
            complaintUrl: { type: String, default: "" },
            complaintPhone: { type: String, default: "" },
            sourceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GovernmentSource",
                default: null
            },
            sourceName: { type: String, default: "" },
            routingMessage: { type: String, default: "" },
            matchedAt: { type: Date, default: null }
        },

        governmentForwarding: {
            status: {
                type: String,
                enum: [
                    "not_forwarded",
                    "ready",
                    "forwarded",
                    "manual_required",
                    "failed"
                ],
                default: "not_forwarded"
            },
            forwardedAt: { type: Date, default: null },
            forwardedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },
            channel: { type: String, default: "" },
            destination: { type: String, default: "" },
            referenceId: { type: String, default: "" },
            adminNote: { type: String, default: "" }
        },

        // =====================================================
        // CIVICFIX WORKFLOW STATUS
        // These statuses are controlled by the CivicFix platform/admin.
        // They must never claim that government work has been completed.
        // =====================================================
        civicFixStatus: {
            type: String,
            enum: [
                "Reported",
                "Under Review",
                "Verified",
                "Resolved",
                "Rejected",
                "Routed",
                "Forwarded"
            ],
            default: "Reported"
        },

        // =====================================================
        // GOVERNMENT ACTION STATUS
        // This represents action taken by the government side.
        // In the current demo, it remains "Not Received" until a
        // real authorized integration or government-side workflow exists.
        // =====================================================
        governmentStatus: {
            type: String,
            enum: [
                "Not Received",
                "Received",
                "Accepted",
                "Work Started",
                "In Progress",
                "Resolution Submitted"
            ],
            default: "Not Received"
        },

        governmentAction: {
            receivedAt: { type: Date, default: null },
            acceptedAt: { type: Date, default: null },
            workStartedAt: { type: Date, default: null },
            resolutionSubmittedAt: { type: Date, default: null },
            resolutionNote: { type: String, default: "" },
            proofUrls: {
                type: [String],
                default: []
            },
            lastUpdatedAt: { type: Date, default: null },
            lastUpdatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            }
        },

        resolutionReview: {
            status: {
                type: String,
                enum: ["Pending", "Approved", "Rejected"],
                default: "Pending"
            },
            reviewedAt: { type: Date, default: null },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },
            note: { type: String, default: "" }
        },

        // =====================================================
        // CITIZEN VERIFICATION
        // Citizen confirms/rejects a submitted resolution later.
        // =====================================================
        citizenVerification: {
            type: String,
            enum: ["Pending", "Confirmed", "Rejected"],
            default: "Pending"
        },


        // =====================================================
        // LEGACY STATUS FIELD
        // Kept temporarily so existing citizen/admin UI does not break.
        // Backend keeps this synchronized with civicFixStatus.
        // =====================================================
        status: {
            type: String,
            enum: [
                "Reported",
                "Under Review",
                "Verified",
                "Resolved",
                "Rejected",
                "Routed",
                "Forwarded"
            ],
            default: "Reported"
        }
    },
    { timestamps: true }
);

complaintSchema.index({ civicFixStatus: 1 });
complaintSchema.index({ governmentStatus: 1 });
complaintSchema.index({ citizenVerification: 1 });
complaintSchema.index({ "governmentRouting.status": 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
