import { useEffect, useRef, useState } from "react";
import "./NotificationBell.css";


interface NotificationItem {

    _id: string;

    title: string;

    message: string;

    type?: string;

    isRead: boolean;

    createdAt: string;

    complaintId?: {

        _id?: string;

        title?: string;

    } | null;
}


const API_BASE =
    "http://localhost:5000";



function NotificationBell() {

    const [
        notifications,
        setNotifications
    ] = useState<NotificationItem[]>([]);


    const [
        unreadCount,
        setUnreadCount
    ] = useState(0);


    const [
        isOpen,
        setIsOpen
    ] = useState(false);


    const [
        loading,
        setLoading
    ] = useState(false);


    const previousUnreadCount =
        useRef(0);


    const audioRef =
        useRef<HTMLAudioElement | null>(null);


    const wrapperRef =
        useRef<HTMLDivElement | null>(null);



    // =====================================================
    // NOTIFICATION SOUND
    // =====================================================

    useEffect(() => {

        audioRef.current =
            new Audio(
                "/sounds/notification.mp3"
            );

        audioRef.current.volume = 0.5;

    }, []);



    // =====================================================
    // FETCH NOTIFICATIONS
    // =====================================================

    const fetchNotifications =
        async (
            showLoading = false
        ) => {

            const token =
                localStorage.getItem(
                    "token"
                );


            if (!token) {

                console.warn(
                    "⚠️ No auth token found"
                );

                return;

            }


            try {

                if (showLoading) {
                    setLoading(true);
                }


                const response =
                    await fetch(
                        `${API_BASE}/api/notifications`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );


                const responseText =
                    await response.text();


                console.log(
                    "🔔 Notification API status:",
                    response.status
                );


                if (!response.ok) {

                    console.error(
                        "❌ Notification API:",
                        responseText
                    );

                    throw new Error(
                        responseText
                    );

                }


                const data =
                    JSON.parse(
                        responseText
                    );


                const list:
                    NotificationItem[] =
                    Array.isArray(
                        data.notifications
                    )
                        ? data.notifications
                        : [];


                const backendUnread =
                    Number(
                        data.unreadCount || 0
                    );


                // Extra safety:
                // calculate unread count directly
                // from notification list also.
                const calculatedUnread =
                    list.filter(
                        notification =>
                            notification.isRead === false
                    ).length;


                const finalUnread =
                    Math.max(
                        backendUnread,
                        calculatedUnread
                    );


                console.log(
                    "📋 Notifications:",
                    list.length
                );

                console.log(
                    "🔴 Backend unread:",
                    backendUnread
                );

                console.log(
                    "🔴 Calculated unread:",
                    calculatedUnread
                );

                console.log(
                    "🔴 FINAL BADGE COUNT:",
                    finalUnread
                );


                // =================================================
                // SOUND
                // =================================================

                if (
                    finalUnread >
                    previousUnreadCount.current
                ) {

                    // Browser may block autoplay.
                    // User interaction usually enables it.
                    audioRef.current
                        ?.play()
                        .catch(() => {});

                }


                previousUnreadCount.current =
                    finalUnread;


                setNotifications(
                    list
                );


                setUnreadCount(
                    finalUnread
                );


            } catch (error) {

                console.error(
                    "❌ Notification fetch error:",
                    error
                );

            } finally {

                if (showLoading) {
                    setLoading(false);
                }

            }

        };



    // =====================================================
    // INITIAL FETCH + POLLING
    // =====================================================

    useEffect(() => {

        fetchNotifications(true);


        const interval =
            window.setInterval(
                () => {
                    fetchNotifications(false);
                },
                5000
            );


        return () =>
            window.clearInterval(
                interval
            );

    }, []);



    // =====================================================
    // CLOSE ON OUTSIDE CLICK
    // =====================================================

    useEffect(() => {

        const handleOutsideClick =
            (event: MouseEvent) => {

                if (
                    wrapperRef.current &&
                    !wrapperRef.current.contains(
                        event.target as Node
                    )
                ) {

                    setIsOpen(false);

                }

            };


        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );


        return () =>
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

    }, []);



    // =====================================================
    // MARK ONE AS READ
    // =====================================================

    const markAsRead =
        async (
            notificationId: string
        ) => {

            const token =
                localStorage.getItem(
                    "token"
                );


            if (!token) return;


            try {

                const response =
                    await fetch(

                        `${API_BASE}/api/notifications/${notificationId}/read`,

                        {
                            method: "PATCH",

                            headers: {

                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"

                            }

                        }

                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to mark notification as read"
                    );

                }


                setNotifications(
                    current =>

                        current.map(
                            item =>

                                item._id ===
                                notificationId

                                    ? {
                                        ...item,
                                        isRead: true
                                    }

                                    : item
                        )
                );


                setUnreadCount(
                    current =>
                        Math.max(
                            0,
                            current - 1
                        )
                );


                previousUnreadCount.current =
                    Math.max(
                        0,
                        previousUnreadCount.current - 1
                    );


            } catch (error) {

                console.error(
                    "❌ Mark read error:",
                    error
                );

            }

        };



    // =====================================================
    // MARK ALL READ
    // =====================================================

    const markAllRead =
        async () => {

            const token =
                localStorage.getItem(
                    "token"
                );


            if (!token) return;


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/notifications/read-all`,
                        {
                            method: "PATCH",

                            headers: {

                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"

                            }
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Failed to mark all notifications as read"
                    );

                }


                setNotifications(
                    current =>
                        current.map(
                            item => ({
                                ...item,
                                isRead: true
                            })
                        )
                );


                setUnreadCount(0);

                previousUnreadCount.current = 0;


            } catch (error) {

                console.error(
                    "❌ Mark all read error:",
                    error
                );

            }

        };



    // =====================================================
    // BADGE COUNT
    // =====================================================

    const badgeCount =
        Math.max(
            unreadCount,
            notifications.filter(
                notification =>
                    !notification.isRead
            ).length
        );



    // =====================================================
    // ICON
    // =====================================================

    const getIcon =
        (type?: string) => {

            switch (type) {

                case "complaint_submitted":
                    return "📋";

                case "status_update":
                    return "🔵";

                case "forwarded":
                    return "🏛️";

                case "government_update":
                    return "🏛️";

                case "resolution_submitted":
                    return "📝";

                case "resolved":
                    return "✅";

                case "reopened":
                    return "↩️";

                default:
                    return "🔔";

            }

        };



    // =====================================================
    // TIME
    // =====================================================

    const formatTime =
        (value: string) => {

            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";

            }


            const diff =
                Date.now() -
                date.getTime();


            if (
                diff < 60_000
            ) {

                return "Just now";

            }


            if (
                diff < 3_600_000
            ) {

                return `${Math.floor(
                    diff / 60_000
                )} min ago`;

            }


            if (
                diff < 86_400_000
            ) {

                return `${Math.floor(
                    diff / 3_600_000
                )} hr ago`;

            }


            return date.toLocaleDateString();

        };



    return (

        <div
            className="notification-wrapper"
            ref={wrapperRef}
        >

            {/* =================================================
                BELL
            ================================================= */}

            <button
                type="button"
                className={
                    `notification-bell ${
                        isOpen
                            ? "notification-bell-active"
                            : ""
                    }`
                }
                onClick={() =>
                    setIsOpen(
                        current => !current
                    )
                }
                aria-label="Notifications"
            >

                <span
                    className="notification-bell-icon"
                >
                    🔔
                </span>


                {/* 🔴 RED BADGE */}

                {badgeCount > 0 && (

                    <span
                        className="notification-count"
                        aria-label={
                            `${badgeCount} unread notifications`
                        }
                    >

                        {
                            badgeCount > 99
                                ? "99+"
                                : badgeCount
                        }

                    </span>

                )}

            </button>



            {/* =================================================
                NOTIFICATION PANEL
            ================================================= */}

            {isOpen && (

                <div className="notification-panel">

                    <div
                        className="notification-panel-header"
                    >

                        <div>

                            <span
                                className="notification-eyebrow"
                            >
                                CIVICFIX
                            </span>

                            <h3>
                                Notifications
                            </h3>

                        </div>


                        <button
                            type="button"
                            className="notification-mark-all"
                            onClick={
                                markAllRead
                            }
                            disabled={
                                badgeCount === 0
                            }
                        >
                            Mark all read
                        </button>

                    </div>



                    <div
                        className="notification-list"
                    >

                        {loading ? (

                            <div
                                className="notification-empty"
                            >

                                <div
                                    className="notification-empty-icon"
                                >
                                    ⏳
                                </div>

                                <strong>
                                    Loading...
                                </strong>

                            </div>

                        ) : notifications.length === 0 ? (

                            <div
                                className="notification-empty"
                            >

                                <div
                                    className="notification-empty-icon"
                                >
                                    🔔
                                </div>

                                <strong>
                                    You're all caught up
                                </strong>

                                <span>
                                    New complaint updates
                                    will appear here.
                                </span>

                            </div>

                        ) : (

                            notifications.map(
                                notification => (

                                    <button
                                        type="button"
                                        key={
                                            notification._id
                                        }
                                        className={
                                            `notification-item ${
                                                !notification.isRead
                                                    ? "notification-item-unread"
                                                    : ""
                                            }`
                                        }
                                        onClick={() => {

                                            if (
                                                !notification.isRead
                                            ) {

                                                markAsRead(
                                                    notification._id
                                                );

                                            }

                                        }}
                                    >

                                        <div
                                            className="notification-icon"
                                        >
                                            {
                                                getIcon(
                                                    notification.type
                                                )
                                            }
                                        </div>


                                        <div
                                            className="notification-content"
                                        >

                                            <div
                                                className="notification-title-row"
                                            >

                                                <strong>
                                                    {
                                                        notification.title
                                                    }
                                                </strong>


                                                {!notification.isRead && (

                                                    <span
                                                        className="notification-unread-dot"
                                                    />

                                                )}

                                            </div>


                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>


                                            <span
                                                className="notification-time"
                                            >
                                                {
                                                    formatTime(
                                                        notification.createdAt
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </button>

                                )
                            )

                        )}

                    </div>

                </div>

            )}

        </div>

    );

}


export default NotificationBell;