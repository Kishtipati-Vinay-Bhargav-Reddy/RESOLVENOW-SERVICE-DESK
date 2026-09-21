function NotificationList({ notifications }) {
  if (!notifications.length) return <div className="empty-state">No notifications found.</div>;

  return (
    <div className="notification-list">
      {notifications.slice(0, 5).map((notification, index) => {
        const isRead = notification.read ?? notification.isRead ?? false;
        return (
          <article className={`notification-item ${isRead ? "read" : "unread"}`} key={notification.id || index}>
            <span className="notification-dot" />
            <div>
              <p>{notification.message || notification.content || "Notification update"}</p>
              <span className="notification-meta">{notification.type || "Update"}</span>
            </div>
            <span className={`read-state ${isRead ? "read" : "unread"}`}>{isRead ? "Read" : "Unread"}</span>
          </article>
        );
      })}
    </div>
  );
}

export default NotificationList;
