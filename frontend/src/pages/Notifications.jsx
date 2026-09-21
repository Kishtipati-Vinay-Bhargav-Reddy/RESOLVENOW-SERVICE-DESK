import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { api, getCollection, getErrorMessage } from "../services/api";

const getNotificationId = (notification) => notification.notificationId || notification.id || "-";
const getComplaintId = (notification) => notification.complaintId || notification.complaint?.id || notification.complaint?.complaintId || "-";
const getMessage = (notification) => notification.message || notification.content || notification.text || "Notification update";
const getType = (notification) => notification.type || notification.notificationType || "Update";
const getUserId = (notification) => notification.userId || notification.user?.id || notification.username || "-";
const isNotificationRead = (notification) => Boolean(notification.read ?? notification.isRead ?? ["READ", "Read"].includes(notification.readStatus));

function Notifications({ username, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/notifications");
      setNotifications(getCollection(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api.get("/notifications")
      .then((response) => {
        if (isMounted) setNotifications(getCollection(response));
      })
      .catch((requestError) => {
        if (isMounted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="dashboard-shell">
      <Navbar username={username} onLogout={onLogout} />
      <div className="dashboard-body">
        <Sidebar
          activeItem="Notifications"
          onNavigate={(item) => {
            if (item === "Dashboard") navigate("/dashboard");
            if (item === "Complaints") navigate("/complaints");
            if (item === "Assignments") navigate("/assignments");
            if (item === "Profile") navigate("/profile");
          }}
          onLogout={onLogout}
        />
        <main className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">SERVICE DESK / NOTIFICATIONS</p>
              <h1>Notification center</h1>
              <p className="page-description">Stay up to date with complaint activity and service desk changes.</p>
            </div>
            <button className="primary-button compact" type="button" onClick={loadNotifications} disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh data"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          <section className="surface notifications-page-surface">
            <div className="section-heading">
              <div><p className="eyebrow">RECENT ACTIVITY</p><h2>All notifications</h2></div>
              <span className="section-count">{notifications.length} total</span>
            </div>
            {isLoading ? <div className="state-panel"><span className="spinner" />Loading notifications...</div> : !notifications.length ? <div className="empty-state">You are all caught up. No notifications found.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Notification ID</th><th>Complaint ID</th><th>Message</th><th>Type</th><th>Read Status</th><th>User ID</th></tr></thead>
                  <tbody>{notifications.map((notification, index) => {
                    const read = isNotificationRead(notification);
                    return <tr className={read ? "notification-row read" : "notification-row unread"} key={getNotificationId(notification) === "-" ? index : getNotificationId(notification)}>
                      <td className="id-cell">#{getNotificationId(notification)}</td>
                      <td className="id-cell">#{getComplaintId(notification)}</td>
                      <td className="notification-message-cell">{getMessage(notification)}</td>
                      <td>{getType(notification)}</td>
                      <td><span className={`read-state ${read ? "read" : "unread"}`}>{read ? "READ" : "UNREAD"}</span></td>
                      <td>{getUserId(notification)}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Notifications;
