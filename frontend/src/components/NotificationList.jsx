import React from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  ShieldAlert, 
  Layers, 
  FileText, 
  Check, 
  ArrowUpRight 
} from "lucide-react";
import { formatRelativeTime } from "../utils/date";
import { EmptyState } from "./Feedback";

function NotificationList({ notifications, onMarkRead, markingIds = [], limit = 5 }) {
  if (!notifications || notifications.length === 0) {
    return (
      <EmptyState 
        title="No alert activity" 
        description="Incoming service notifications and progress updates will appear here." 
        icon="notifications" 
      />
    );
  }

  const getNotificationIcon = (type) => {
    const t = String(type || "").toUpperCase();
    if (t.includes("ESCALAT")) return <ShieldAlert size={16} style={{ color: "var(--accent-rose)" }} />;
    if (t.includes("ASSIGN")) return <Layers size={16} style={{ color: "var(--accent-indigo)" }} />;
    if (t.includes("STATUS")) return <FileText size={16} style={{ color: "var(--accent-amber)" }} />;
    return <Bell size={16} style={{ color: "var(--accent-blue)" }} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {notifications.slice(0, limit).map((notification, index) => {
        const isRead = Boolean(notification.read ?? notification.isRead ?? notification.readStatus);
        const notificationId = notification.notificationId || notification.id || index;
        const complaintId = notification.complaintId;
        const isMarking = markingIds.includes(notificationId);
        const message = notification.message || notification.content || "Service update";

        return (
          <article
            key={notificationId}
            style={{
              background: isRead ? "var(--bg-surface)" : "var(--bg-surface-elevated)",
              border: isRead ? "1px solid var(--border-subtle)" : "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              transition: "all 0.2s ease",
              boxShadow: isRead ? "none" : "0 0 15px -3px rgba(59, 130, 246, 0.15)"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-app)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {getNotificationIcon(notification.type)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.86rem", color: isRead ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: isRead ? 400 : 500, lineHeight: 1.4 }}>
                {message}
              </p>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                  {String(notification.type || "ALERT").replaceAll("_", " ")}
                </span>
                {complaintId != null && (
                  <Link
                    to={`/complaints/${complaintId}`}
                    style={{ fontSize: "0.74rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}
                  >
                    Ticket #{complaintId} <ArrowUpRight size={10} />
                  </Link>
                )}
                <time style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {formatRelativeTime(notification.createdAt)}
                </time>
              </div>
            </div>

            {!isRead && onMarkRead && (
              <button
                className="btn btn-ghost btn-small"
                type="button"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                disabled={isMarking}
                onClick={() => onMarkRead(notificationId)}
                title="Mark notification read"
              >
                <Check size={14} />
                <span>{isMarking ? "..." : "Read"}</span>
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default NotificationList;
