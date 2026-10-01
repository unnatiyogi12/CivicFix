import mongoose from "mongoose";

const governmentServiceSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // SERVICE INFORMATION
    // --------------------------------------------------

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceCategory: {
      type: String,
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // AUTHORITY / DEPARTMENT
    // --------------------------------------------------

    authorityName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // JURISDICTION
    // --------------------------------------------------

    state: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    municipality: {
      type: String,
      trim: true,
      default: "",
    },

    ward: {
      type: String,
      trim: true,
      default: "",
    },

    zone: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // OFFICIAL SOURCE
    // --------------------------------------------------

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovernmentSource",
      default: null,
    },

    officialUrl: {
      type: String,
      trim: true,
      default: "",
    },

    sourceEvidence: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // ROUTING
    // --------------------------------------------------

    routingStatus: {
      type: String,
      enum: [
        "verified",
        "jurisdiction_required",
        "needs_verification",
      ],
      default: "needs_verification",
    },

    // --------------------------------------------------
    // COMPLAINT CHANNEL
    // --------------------------------------------------

    complaintChannel: {
      type: String,
      trim: true,
      default: "",
    },

    complaintUrl: {
      type: String,
      trim: true,
      default: "",
    },

    complaintPhone: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // FUTURE RAG SUPPORT
    // --------------------------------------------------

    ragEnabled: {
      type: Boolean,
      default: false,
    },

    ragNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // --------------------------------------------------
    // VERIFICATION
    // --------------------------------------------------

    lastVerified: {
      type: Date,
      default: Date.now,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

governmentServiceSchema.index({
  city: 1,
  district: 1,
  serviceCategory: 1,
});

governmentServiceSchema.index({
  authorityName: 1,
});

governmentServiceSchema.index({
  routingStatus: 1,
});

governmentServiceSchema.index({
  active: 1,
});

// --------------------------------------------------
// MODEL
// --------------------------------------------------

const GovernmentService = mongoose.model(
  "GovernmentService",
  governmentServiceSchema
);

export default GovernmentService;