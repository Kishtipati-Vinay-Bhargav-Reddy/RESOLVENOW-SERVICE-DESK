import React, { useEffect, useState } from "react";
import { 
  RotateCw, 
  CheckCheck
} from "lucide-react";
import AppShell from "../components/AppShell";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import NotificationList from "../components/NotificationList";
import { useNotificationCount } from "../components/NotificationCountContext";
import { useToast } from "../components/ToastContext";
import { 
  getCollection, 
  getErrorMessage, 
  getNotifications, 
  markAllNotificationsRead, 
  markNotificationRead 
} from "../services/api";

function Notifications({ username, user, onLogout }) {
  const showToast = useToast();
  const { unreadCount, refreshUnreadCount } = useNotificationCount();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterMode, setFilterMode] = useState("ALL"); // "ALL" or "UNREAD"

  useEffect(() => {
    let active = true;
    getNotifications()
      .then((response) => {
        if (active) setNotifications(getCollection(response));
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setIsLoading(true);
    setError("");
    setRefreshKey((v) => v + 1);
  };

  const markRead = async (notificationId) => {
    setMarkingIds((curr) => [...curr, notificationId]);
    setError("");
    try {
      const { data } = await markNotificationRead(notificationId);
      setNotifications((curr) =>
        curr.map((n) => ((n.notificationId || n.id) === notificationId ? data : n))
      );
      await refreshUnreadCount();
      showToast("Notification marked as read.");
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setMarkingIds((curr) => curr.filter((id) => id !== notificationId));
    }
  };

  const markAllRead = async () => {
    setIsMarkingAll(true);
    setError("");
    try {
      const { data } = await markAllNotificationsRead();
      await refreshUnreadCount();
      setIsLoading(true);
      setRefreshKey((v) => v + 1);
      showToast(`${data?.count || 0} alert(s) marked as read.`);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const displayedNotifications = notifications.filter((n) => {
    const isRead = Boolean(n.read ?? n.isRead ?? n.readStatus);
    if (filterMode === "UNREAD") return !isRead;
    return true;
  });

  return (
    <AppShell activeItem="Notifications" username={username} role={user?.role} onLogout={onLogout}>
      <PageHeader
        eyebrow="INCIDENT TELEMETRY / INBOX"
        title="Alerts & Notifications"
        description="Real-time automated alerts for grievance creation, department assignments, and status updates."
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" type="button" onClick={refresh} disabled={isLoading}>
              <RotateCw size={15} className={isLoading ? "spin-slow" : ""} />
              <span>{isLoading ? "Syncing..." : "Refresh"}</span>
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={markAllRead}
              disabled={isMarkingAll || unreadCount === 0}
            >
              <CheckCheck size={16} />
              <span>{isMarkingAll ? "Marking..." : "Mark All Read"}</span>
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Notice" detail={error} onRetry={refresh} />}

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}
      >
        {/* Header Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="badge"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                background: filterMode === "ALL" ? "rgba(59, 130, 246, 0.2)" : "var(--bg-app)",
                border: filterMode === "ALL" ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                color: filterMode === "ALL" ? "#60A5FA" : "var(--text-secondary)",
              }}
              onClick={() => setFilterMode("ALL")}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              type="button"
              className="badge"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                background: filterMode === "UNREAD" ? "rgba(244, 63, 94, 0.2)" : "var(--bg-app)",
                border: filterMode === "UNREAD" ? "1px solid var(--accent-rose)" : "1px solid var(--border-subtle)",
                color: filterMode === "UNREAD" ? "#FDA4AF" : "var(--text-secondary)",
              }}
              onClick={() => setFilterMode("UNREAD")}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Transactional Outbox Delivery Active
          </span>
        </div>

        {/* Notification List */}
        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : displayedNotifications.length > 0 ? (
          <NotificationList
            notifications={displayedNotifications}
            onMarkRead={markRead}
            markingIds={markingIds}
            limit={displayedNotifications.length}
          />
        ) : (
          <EmptyState
            title={filterMode === "UNREAD" ? "All caught up" : "No notifications recorded"}
            description={
              filterMode === "UNREAD"
                ? "You have marked all notifications as read."
                : "New grievance assignments and status changes will trigger automated alerts here."
            }
            icon="notifications"
          />
        )}
      </div>
    </AppShell>
  );
}

export default Notifications;