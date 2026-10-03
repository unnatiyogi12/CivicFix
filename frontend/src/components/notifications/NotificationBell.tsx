import { useEffect, useRef, useState } from "react";
import "./NotificationBell.css";

type NotificationItem = {
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
};

const API_BASE = "http://localhost:5000";

const getIcon = (type?: string) => {
  switch (type) {
    case "resolution":
      return "✅";
    case "reopened":
      return "↩️";
    case "government_update":
      return "🏛️";
    case "complaint_submitted":
      return "📋";
    case "status_update":
      return "🔵";
    default:
      return "🔔";
  }
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();

  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} min ago`;
  }

  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} hr ago`;
  }

  if (diff < 604_800_000) {
    return `${Math.floor(diff / 86_400_000)} day ago`;
  }

  return date.toLocaleDateString();
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async (showLoading = false) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Notification fetch error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    const interval = window.setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await fetch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications error:", error);
    }
  };

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`notification-bell ${
          open ? "notification-bell-active" : ""
        }`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
      >
        <span className="notification-bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <div>
              <span className="notification-eyebrow">CIVICFIX</span>
              <h3>Notifications</h3>
            </div>

            <button
              type="button"
              className="notification-mark-all"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">⏳</div>
                <strong>Loading...</strong>
                <span>Fetching your latest updates.</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔔</div>
                <strong>You're all caught up</strong>
                <span>New complaint updates will appear here.</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={`notification-item ${
                    !notification.isRead
                      ? "notification-item-unread"
                      : ""
                  }`}
                  onClick={() =>
                    !notification.isRead &&
                    markAsRead(notification._id)
                  }
                >
                  <div className="notification-icon">
                    {getIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <strong>{notification.title}</strong>

                      {!notification.isRead && (
                        <span className="notification-unread-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
