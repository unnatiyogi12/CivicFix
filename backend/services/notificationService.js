import Notification from "../models/notification.js";
import User from "../models/User.js";

// =========================================================
// CREATE ONE NOTIFICATION
// =========================================================

export const createNotification = async ({
  userId,
  complaintId = null,
  title,
  message,
  type = "system",
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  try {
    return await Notification.create({
      userId,
      complaintId,
      title,
      message,
      type,
    });
  } catch (error) {
    // Notification failure must never break the complaint workflow.
    console.error("⚠️ Notification creation failed:", error.message);
    return null;
  }
};

// =========================================================
// NOTIFY CITIZEN
// =========================================================

export const notifyCitizen = async ({
  complaint,
  title,
  message,
  type = "status_update",
}) => {
  if (!complaint?.userId) {
    return null;
  }

  const userId =
    typeof complaint.userId === "object"
      ? complaint.userId._id
      : complaint.userId;

  return createNotification({
    userId,
    complaintId: complaint._id,
    title,
    message,
    type,
  });
};

// =========================================================
// NOTIFY ALL ADMINS
// =========================================================

export const notifyAdmins = async ({
  complaintId = null,
  title,
  message,
  type = "system",
}) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");

    if (!admins.length) {
      return [];
    }

    return await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          complaintId,
          title,
          message,
          type,
        })
      )
    );
  } catch (error) {
    console.error("⚠️ Admin notification failed:", error.message);
    return [];
  }
};

// =========================================================
// NOTIFY ALL GOVERNMENT USERS
// =========================================================

export const notifyGovernmentUsers = async ({
  complaintId = null,
  title,
  message,
  type = "government_update",
}) => {
  try {
    const governmentUsers = await User.find({
      role: "government",
    }).select("_id");

    if (!governmentUsers.length) {
      return [];
    }

    return await Promise.all(
      governmentUsers.map((governmentUser) =>
        createNotification({
          userId: governmentUser._id,
          complaintId,
          title,
          message,
          type,
        })
      )
    );
  } catch (error) {
    console.error("⚠️ Government notification failed:", error.message);
    return [];
  }
};

// =========================================================
// STATUS MESSAGE HELPERS
// =========================================================

export const notifyCitizenForStatus = async (complaint, status) => {
  const messages = {
    "Under Review": {
      title: "Complaint Under Review",
      message: `Your complaint "${complaint.title}" is now under review.`,
      type: "status_update",
    },

    Verified: {
      title: "Complaint Verified",
      message: `Your complaint "${complaint.title}" has been verified.`,
      type: "status_update",
    },

    Rejected: {
      title: "Complaint Rejected",
      message: `Your complaint "${complaint.title}" has been rejected.`,
      type: "status_update",
    },

    Forwarded: {
      title: "Complaint Forwarded",
      message: `Your complaint "${complaint.title}" has been forwarded for government handling.`,
      type: "government_update",
    },

    Resolved: {
      title: "Complaint Resolved",
      message: `Your complaint "${complaint.title}" has been marked as resolved.`,
      type: "resolution",
    },

    Reopened: {
      title: "Complaint Reopened",
      message: `Your complaint "${complaint.title}" has been reopened for further action.`,
      type: "reopened",
    },
  };

  const notification = messages[status];

  if (!notification) {
    return null;
  }

  return notifyCitizen({
    complaint,
    ...notification,
  });
};
