import Notification from "../models/notification.js";
import User from "../models/User.js";


// =========================================================
// CREATE NOTIFICATION
// =========================================================

export const createNotification = async ({
    userId,
    complaintId = null,
    title,
    message,
    type = "general"
}) => {

    try {

        if (!userId) {

            console.error(
                "❌ Notification skipped: userId missing"
            );

            return null;
        }


        const notification =
            await Notification.create({

                userId,

                complaintId,

                title,

                message,

                type,

                // VERY IMPORTANT
                // Every newly created notification
                // starts as unread.
                isRead: false

            });


        console.log(
            "🔔 Notification created:",
            title,
            "| user:",
            userId.toString()
        );


        return notification;


    } catch (error) {

        console.error(
            "❌ Error creating notification:",
            error
        );

        return null;
    }
};



// =========================================================
// NOTIFY ALL ADMINS
// =========================================================

export const notifyAdmins = async ({
    complaintId,
    title,
    message,
    type = "general"
}) => {

    try {

        const admins =
            await User.find({
                role: "admin"
            }).select("_id");


        console.log(
            `🔔 Sending notification to ${admins.length} admin(s)`
        );


        await Promise.all(

            admins.map((admin) =>

                createNotification({

                    userId:
                        admin._id,

                    complaintId,

                    title,

                    message,

                    type

                })

            )

        );


        console.log(
            "✅ Admin notifications completed"
        );


    } catch (error) {

        console.error(
            "❌ Error notifying admins:",
            error
        );

    }
};



// =========================================================
// NOTIFY GOVERNMENT USERS
// =========================================================

export const notifyGovernmentUsers = async ({
    complaintId,
    title,
    message,
    type = "government_update",
    department
}) => {

    try {

        const filter = {
            role: "government"
        };


        // Department filtering only if
        // department exists in your User model.
        if (department) {
            filter.department = department;
        }


        const governmentUsers =
            await User.find(filter)
                .select("_id");


        console.log(
            `🏛️ Sending notification to ${governmentUsers.length} government user(s)`
        );


        await Promise.all(

            governmentUsers.map((user) =>

                createNotification({

                    userId:
                        user._id,

                    complaintId,

                    title,

                    message,

                    type

                })

            )

        );


        console.log(
            "✅ Government notifications completed"
        );


    } catch (error) {

        console.error(
            "❌ Error notifying government users:",
            error
        );

    }
};



// =========================================================
// NOTIFY CITIZEN
// =========================================================

export const notifyCitizen = async ({
    complaint,
    title,
    message,
    type = "general"
}) => {

    try {

        // Your Complaint model uses userId
        // for the citizen owner.
        const citizenId =
            complaint?.userId;


        if (!citizenId) {

            console.error(
                "❌ Citizen notification skipped: complaint.userId missing"
            );

            return null;
        }


        return await createNotification({

            userId:
                citizenId,

            complaintId:
                complaint._id,

            title,

            message,

            type

        });


    } catch (error) {

        console.error(
            "❌ Error notifying citizen:",
            error
        );

        return null;
    }
};



// =========================================================
// CITIZEN STATUS NOTIFICATION
// =========================================================

export const notifyCitizenForStatus = async (
    complaint,
    title,
    message,
    type = "status_update"
) => {

    return await notifyCitizen({

        complaint,

        title,

        message,

        type

    });

};