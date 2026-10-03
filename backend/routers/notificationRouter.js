import express from "express";

import Notification from "../models/notification.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// =========================================================
// GET CURRENT USER NOTIFICATIONS
// GET /api/notifications
// =========================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("complaintId", "title status civicFixStatus");

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Fetch notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// =========================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:notificationId/read
// =========================================================

router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        userId: req.user.userId,
      },
      {
        $set: { isRead: true },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("❌ Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

// =========================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =========================================================

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("❌ Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
});

export default router;
