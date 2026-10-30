import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ComplaintList from "../components/ComplaintList";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import NotificationList from "../components/NotificationList";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";
import { getAssignments, getCollection, getComplaints, getErrorMessage, getNotifications, markNotificationRead } from "../services/api";
import { useToast } from "../components/ToastContext";
import { useNotificationCount } from "../components/NotificationCountContext";

const statuses = [["OPEN", "Open"], ["ASSIGNED", "Assigned"], ["IN_PROGRESS", "In progress"], ["RESOLVED", "Resolved"], ["CLOSED", "Closed"]];
const statusOf = (complaint) => String(complaint.status || "OPEN").toUpperCase();

function Dashboard({ username, user, onLogout }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { unreadCount, refreshUnreadCount } = useNotificationCount();
  const [complaints, setComplaints] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [markingIds, setMarkingIds] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getComplaints(), getAssignments(), getNotifications()])
      .then((results) => {
        if (!active) return;
        const [complaintResult, assignmentResult, notificationResult] = results;
        if (complaintResult.status === "fulfilled") setComplaints(getCollection(complaintResult.value));
        if (assignmentResult.status === "fulfilled") setAssignments(getCollection(assignmentResult.value));
        if (notificationResult.status === "fulfilled") setNotifications(getCollection(notificationResult.value));
        const failed = results.find((result) => result.status === "rejected");
        setError(failed ? getErrorMessage(failed.reason) : "");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setRefreshing(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };
  const statusCount = (status) => complaints.filter((complaint) => statusOf(complaint) === status).length;
  const overdueCount = complaints.filter((complaint) => complaint.overdue).length;
  const escalatedCount = complaints.filter((complaint) => complaint.escalated).length;

  const recentComplaints = [...complaints].sort((left, right) =>
    new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)).slice(0, 6);
  const recentNotifications = [...notifications].sort((left, right) =>
    new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 5);

  const markRead = async (id) => {
    setMarkingIds((current) => [...current, id]);
    try {
      const { data } = await markNotificationRead(id);
      setNotifications((current) => current.map((item) => (item.notificationId || item.id) === id ? data : item));
      await refreshUnreadCount();
      showToast("Notification marked as read.");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setMarkingIds((current) => current.filter((value) => value !== id));
    }
  };

  const maxStatusCount = Math.max(1, ...statuses.map(([status]) => statusCount(status)));

  return <AppShell activeItem="Dashboard" username={username} role={user?.role} onLogout={onLogout}>
    <PageHeader eyebrow="SERVICE DESK / OVERVIEW" title={`Good morning, ${username || "there"}`}
      description="Your current complaints, assignments, and service activity."
      actions={<button className="button button-secondary" type="button" onClick={refresh} disabled={refreshing}>
        <span className={refreshing ? "spin-icon" : ""}>↻</span>{refreshing ? "Refreshing" : "Refresh"}
      </button>} />

    {error && <ErrorState title="Some dashboard information could not be loaded." detail={error} onRetry={refresh} />}
    {loading ? <><LoadingSkeleton rows={1} variant="cards" /><LoadingSkeleton rows={4} /></> : <>
      <section className="stat-grid" aria-label="Complaint totals">
        <StatCard label="Total complaints" value={complaints.length} tone="navy" icon="complaints" />
        <StatCard label="Open" value={statusCount("OPEN")} tone="blue" icon="clock" />
        <StatCard label="Assigned" value={statusCount("ASSIGNED")} tone="amber" icon="assignments" />
        <StatCard label="In progress" value={statusCount("IN_PROGRESS")} tone="violet" icon="refresh" />
        <StatCard label="Resolved" value={statusCount("RESOLVED")} tone="green" icon="check" />
        <StatCard label="Closed" value={statusCount("CLOSED")} tone="slate" icon="close" />
        <StatCard label="Escalated" value={escalatedCount} tone="amber" icon="warning" />
        <StatCard label="Overdue SLA" value={overdueCount} tone="red" icon="clock" />
      </section>

      <section className="status-overview surface" aria-labelledby="status-overview-title">
        <div className="section-heading section-heading-tight">
          <div><p className="eyebrow">LIFECYCLE</p><h2 id="status-overview-title">Status overview</h2></div>
          <span className="section-count">{complaints.length} complaints</span>
        </div>
        <div className="status-bars">
          {statuses.map(([status, label]) => <div className="status-bar-row" key={status}>
            <span>{label}</span><div className="status-bar-track"><span className={`status-bar-fill fill-${status.toLowerCase()}`}
              style={{ width: `${(statusCount(status) / maxStatusCount) * 100}%` }} /></div><strong>{statusCount(status)}</strong>
          </div>)}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="surface recent-complaints" aria-labelledby="recent-complaints-title">
          <div className="section-heading">
            <div><p className="eyebrow">WORK IN FLIGHT</p><h2 id="recent-complaints-title">Recent complaints</h2></div>
            <Link className="text-link" to="/complaints">View register <span aria-hidden="true">→</span></Link>
          </div>
          {recentComplaints.length ? <ComplaintList complaints={recentComplaints} />
            : <EmptyState title="No complaints logged" description="New complaints will appear here."
              action={<button className="button button-primary button-small" type="button" onClick={() => navigate("/complaints")}>Report an issue</button>} />}
        </section>

        <section className="surface recent-notifications" aria-labelledby="recent-activity-title">
          <div className="section-heading">
            <div><p className="eyebrow">ACTIVITY FEED</p><h2 id="recent-activity-title">Notifications</h2></div>
            <span className="section-count">{unreadCount} unread</span>
          </div>
          {recentNotifications.length
            ? <NotificationList notifications={recentNotifications} onMarkRead={markRead} markingIds={markingIds} limit={5} />
            : <EmptyState title="No activity recorded" description="Assignment and complaint events will show up here." />}
          <div className="assignment-summary">
            <Icon name="assignments" size={17} /><span><strong>{assignments.length}</strong> active assignments in queue.</span>
            <Link className="text-link" to="/assignments">Open queue <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </>}
  </AppShell>;
}

export default Dashboard;
