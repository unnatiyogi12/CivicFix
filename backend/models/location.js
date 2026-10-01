import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        address: {
            type: String,
            default: ""
        },

        ward: {
            type: String,
            default: ""
        },

        zone: {
            type: String,
            default: ""
        },

        municipality: {
            type: String,
            default: ""
        },

        district: {
            type: String,
            default: ""
        },

        state: {
            type: String,
            default: ""
        },

        jurisdiction: {
            type: String,
            default: ""
        },

        source: {
            type: String,
            default: "unknown"
        }
    },
    {
        timestamps: true
    }
);

const Location = mongoose.model(
    "Location",
    locationSchema
);

export default Location;