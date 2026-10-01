import mongoose from "mongoose";

const governmentSourceSchema = new mongoose.Schema(
  {
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },

    organization: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
      default: "",
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

    department: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    sourceType: {
      type: String,
      enum: [
        "official_website",
        "official_dataset",
        "official_api",
        "official_pdf",
        "official_portal",
      ],
      required: true,
    },

    officialUrl: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    jurisdiction: {
      type: String,
      trim: true,
      default: "",
    },

    license: {
      type: String,
      trim: true,
      default: "",
    },

    lastVerified: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "needs_verification"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

governmentSourceSchema.index({
  organization: 1,
  state: 1,
  district: 1,
});

governmentSourceSchema.index({
  sourceType: 1,
});

governmentSourceSchema.index({
  status: 1,
});

const GovernmentSource = mongoose.model(
  "GovernmentSource",
  governmentSourceSchema
);

export default GovernmentSource;