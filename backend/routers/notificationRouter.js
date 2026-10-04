import express from "express";

import Notification from "../models/notification.js";

import authMiddleware
    from "../middlewares/authMiddleware.js";


const router = express.Router();


// =========================================================
// GET NOTIFICATIONS
// GET /api/notifications
// =========================================================

router.get(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            // Your CivicFix auth middleware uses userId.
            const userId =
                req.user?.userId ||
                req.user?._id ||
                req.user?.id;


            console.log(
                "\n========================================"
            );

            console.log(
                "🔔 NOTIFICATION FETCH"
            );

            console.log(
                "Logged-in user:",
                userId
            );

            console.log(
                "Role:",
                req.user?.role
            );


            if (!userId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authenticated user ID not found"

                });

            }


            // =================================================
            // FETCH NOTIFICATIONS
            // =================================================

            const notifications =
                await Notification.find({
                    userId: userId
                })
                .sort({
                    createdAt: -1
                })
                .limit(50);


            // =================================================
            // COUNT UNREAD
            // =================================================

            const unreadCount =
                await Notification.countDocuments({

                    userId: userId,

                    isRead: false

                });


            console.log(
                "📋 Notifications found:",
                notifications.length
            );

            console.log(
                "🔴 UNREAD COUNT:",
                unreadCount
            );


            if (notifications.length > 0) {

                console.log(
                    "🔔 Latest notification:",
                    {
                        id:
                            notifications[0]._id,

                        title:
                            notifications[0].title,

                        isRead:
                            notifications[0].isRead,

                        userId:
                            notifications[0].userId
                    }
                );

            }


            console.log(
                "========================================\n"
            );


            return res.status(200).json({

                success: true,

                notifications,

                unreadCount

            });


        } catch (error) {

            console.error(
                "❌ Notification fetch error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch notifications",

                error:
                    error.message

            });

        }

    }
);



// =========================================================
// MARK ONE NOTIFICATION AS READ
// =========================================================

router.patch(
    "/:notificationId/read",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user?.userId ||
                req.user?._id ||
                req.user?.id;


            const notification =
                await Notification.findOneAndUpdate(

                    {
                        _id:
                            req.params.notificationId,

                        userId:
                            userId
                    },

                    {
                        $set: {
                            isRead: true
                        }
                    },

                    {
                        new: true
                    }

                );


            if (!notification) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }


            return res.status(200).json({

                success: true,

                notification

            });


        } catch (error) {

            console.error(
                "❌ Mark notification read error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to mark notification as read",

                error:
                    error.message

            });

        }

    }
);



// =========================================================
// MARK ALL NOTIFICATIONS AS READ
// =========================================================

router.patch(
    "/read-all",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user?.userId ||
                req.user?._id ||
                req.user?.id;


            const result =
                await Notification.updateMany(

                    {
                        userId:
                            userId,

                        isRead:
                            false
                    },

                    {
                        $set: {
                            isRead: true
                        }
                    }

                );


            console.log(
                "✅ Notifications marked read:",
                result.modifiedCount
            );


            return res.status(200).json({

                success: true,

                modifiedCount:
                    result.modifiedCount

            });


        } catch (error) {

            console.error(
                "❌ Mark all notifications error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to mark notifications as read",

                error:
                    error.message

            });

        }

    }
);


export default router;