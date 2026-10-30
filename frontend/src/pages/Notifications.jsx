import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import Icon from "../components/Icon";
import NotificationList from "../components/NotificationList";
import { useNotificationCount } from "../components/NotificationCountContext";
import { useToast } from "../components/ToastContext";
import { getCollection, getErrorMessage, getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/api";

function Notifications({ username, user, onLogout }) {
  const showToast = useToast();
  const { unreadCount, refreshUnreadCount } = useNotificationCount();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getNotifications()
      .then((response) => { if (active) setNotifications(getCollection(response)); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setIsLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const markRead = async (notificationId) => {
    setMarkingIds((current) => [...current, notificationId]);
    setError("");
    try {
      const { data } = await markNotificationRead(notificationId);
      setNotifications((current) => current.map((notification) =>
        (notification.notificationId || notification.id) === notificationId ? data : notification));
      await refreshUnreadCount();
      showToast("Notification marked as read.");
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setMarkingIds((current) => current.filter((id) => id !== notificationId));
    }
  };

  const markAllRead = async () => {
    setIsMarkingAll(true);
    setError("");
    try {
      const { data } = await markAllNotificationsRead();
      await refreshUnreadCount();
      setIsLoading(true);
      setRefreshKey((value) => value + 1);
      showToast(`${data?.count || 0} notification${data?.count === 1 ? "" : "s"} marked as read.`);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setIsMarkingAll(false);
    }
  };

  return <AppShell activeItem="Notifications" username={username} role={user?.role} onLogout={onLogout}>
    <PageHeader eyebrow="SERVICE DESK / ACTIVITY" title="Notifications"
      description="Stay current on complaint and assignment activity."
      actions={<button className="button button-secondary" type="button" onClick={refresh} disabled={isLoading}>
        <Icon name="refresh" size={17} />{isLoading ? "Refreshing" : "Refresh"}
      </button>} />
    {error && <ErrorState title="Unable to load notifications." detail={error} onRetry={refresh} />}
    <section className="surface notifications-page-surface">
      <div className="section-heading">
        <div><p className="eyebrow">INBOX</p><h2>All notifications</h2></div>
        <div className="notification-toolbar">
          <span className="section-count"><strong>{unreadCount}</strong> unread · {notifications.length} total</span>
          <button className="button button-primary" type="button" onClick={markAllRead}
            disabled={isMarkingAll || unreadCount === 0}>{isMarkingAll ? "Saving..." : "Mark all read"}</button>
        </div>
      </div>
      {isLoading ? <LoadingSkeleton rows={5} /> : notifications.length
        ? <NotificationList notifications={notifications} onMarkRead={markRead} markingIds={markingIds} limit={notifications.length} />
        : <div className="empty-state-panel"><div className="empty-state-mark"><Icon name="notifications" size={25} /></div><h3>You're all caught up</h3><p>New complaint and assignment updates will appear here.</p></div>}
    </section>
  </AppShell>;
}

export default Notifications;