import { Link } from "react-router-dom";
import { formatRelativeTime } from "../utils/date";
import Icon from "./Icon";
import { EmptyState } from "./Feedback";

function NotificationList({ notifications, onMarkRead, markingIds = [], limit = 5 }) {
  if (!notifications.length) return <EmptyState title="No notifications found" description="New service activity will appear here." icon="notifications" />;

  return (
    <div className="notification-list">
      {notifications.slice(0, limit).map((notification, index) => {
        const isRead = Boolean(notification.read ?? notification.isRead ?? notification.readStatus);
        const notificationId = notification.notificationId || notification.id || index;
        const complaintId = notification.complaintId;
        const isMarking = markingIds.includes(notificationId);
        const kind = String(notification.type || "SYSTEM").toLowerCase();
        const message = notification.message || notification.content || "Service Desk update";
        return <article className={`notification-item ${isRead ? "read" : "unread"}`} key={notificationId}>
          <span className={`notification-type-icon type-${kind}`}><Icon name={kind.includes("assign") ? "assignments" : kind.includes("complaint") ? "complaints" : "notifications"} size={17} /></span>
          <div className="notification-content">
            <p>{message}</p>
            <div className="notification-details">
              <span className="notification-meta">{String(notification.type || "Update").replaceAll("_", " ")}</span>
              {complaintId != null && <Link className="notification-meta notification-complaint-link" to={`/complaints/${complaintId}`}>Complaint #{complaintId}</Link>}
              <time className="notification-meta" dateTime={notification.createdAt || undefined}>{formatRelativeTime(notification.createdAt)}</time>
            </div>
          </div>
          <span className={`read-state ${isRead ? "read" : "unread"}`}>{isRead ? "Read" : "Unread"}</span>
          {!isRead && onMarkRead && <button className="notification-action" type="button"
            aria-label={`Mark notification ${notificationId} as read`} disabled={isMarking}
            onClick={() => onMarkRead(notificationId)}>{isMarking ? "Saving..." : "Mark read"}</button>}
        </article>;
      })}
    </div>
  );
}

export default NotificationList;
