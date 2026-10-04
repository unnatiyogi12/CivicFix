import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            default: null,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: [
                "general",
                "complaint_submitted",
                "status_update",
                "forwarded",
                "resolution_submitted",
                "resolved",
                "reopened",
                "government_update"
            ],
            default: "general"
        },

        // IMPORTANT:
        // New notification is always unread
        isRead: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Fast unread notification queries
notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1
});

const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default Notification;