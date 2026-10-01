import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
    {
        incidentId: {
            type: String,
            unique: true,
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        area: {
            type: String,
            default: ""
        },

        subcategory: {
            type: String,
            default: ""
        },

        department: {
            type: String,
            default: ""
        },

        priority: {
            type: String,
            enum: ["", "Low", "Medium", "High", "Critical"],
            default: ""
        },

        complaintCount: {
            type: Number,
            default: 1
        },

        complaints: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Complaint"
            }
        ],

        status: {
            type: String,
            enum: [
                "Open",
                "Under Review",
                "In Progress",
                "Resolved",
                "Closed"
            ],
            default: "Open"
        },

        location: {
            address: {
                type: String,
                default: ""
            },

            latitude: {
                type: Number
            },

            longitude: {
                type: Number
            }
        }
    },
    {
        timestamps: true
    }
);

const Incident = mongoose.model(
    "Incident",
    incidentSchema
);

export default Incident;