import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import ComplaintList from "../components/ComplaintList";
import NotificationList from "../components/NotificationList";
import { api, getCollection, getErrorMessage } from "../services/api";

const countByStatus = (complaints, values) => complaints.filter((item) => values.includes(String(item.status || item.complaintStatus || "").toLowerCase())).length;

function Dashboard({ username, onLogout }) {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [complaints, setComplaints] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        api.get("/complaints"),
        api.get("/assignments"),
        api.get("/notifications"),
      ]);
      if (!isMounted) return;
      const [complaintResult, assignmentResult, notificationResult] = results;
      if (complaintResult.status === "fulfilled") setComplaints(getCollection(complaintResult.value));
      if (assignmentResult.status === "fulfilled") setAssignments(getCollection(assignmentResult.value));
      if (notificationResult.status === "fulfilled") setNotifications(getCollection(notificationResult.value));
      const failed = results.find((result) => result.status === "rejected");
      if (failed) setError(getErrorMessage(failed.reason));
      setLoading(false);
    };
    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  const openCount = countByStatus(complaints, ["open", "pending", "in_progress", "in progress"]);
  const resolvedCount = countByStatus(complaints, ["resolved", "closed", "completed"]);

  return (
    <div className="dashboard-shell">
      <Navbar username={username} onLogout={onLogout} />
      <div className="dashboard-body">
        <Sidebar activeItem={activeItem} onNavigate={(item) => item === "Complaints" ? navigate("/complaints") : item === "Assignments" ? navigate("/assignments") : item === "Notifications" ? navigate("/notifications") : item === "Profile" ? navigate("/profile") : setActiveItem(item)} onLogout={onLogout} />
        <main className="dashboard-main">
          <div className="dashboard-heading"><div><p className="eyebrow">OVERVIEW / {activeItem.toUpperCase()}</p><h1>{activeItem === "Dashboard" ? "Good morning, " : ""}{activeItem === "Dashboard" ? username || "there" : activeItem}</h1><p className="page-description">Monitor your service desk activity and keep every issue moving forward.</p></div><button className="primary-button compact" type="button" onClick={() => window.location.reload()}>Refresh data</button></div>
          {loading ? <div className="state-panel"><span className="spinner" />Loading your service desk data...</div> : <>
            {error && <div className="error-banner">{error} Some sections may be unavailable.</div>}
            {activeItem === "Dashboard" ? <>
              <section className="stats-grid">
                <StatCard label="Total Complaints" value={complaints.length} tone="blue" icon="TC" />
                <StatCard label="Open Complaints" value={openCount} tone="amber" icon="OC" />
                <StatCard label="Assigned Complaints" value={assignments.length} tone="violet" icon="AC" />
                <StatCard label="Resolved Complaints" value={resolvedCount} tone="green" icon="RC" />
              </section>
              <div className="content-grid">
                <section className="surface complaints-surface"><div className="section-heading"><div><p className="eyebrow">LIVE QUEUE</p><h2>Recent complaints</h2></div><span className="section-count">{complaints.length} total</span></div><ComplaintList complaints={complaints} /></section>
                <section className="surface notifications-surface"><div className="section-heading"><div><p className="eyebrow">ACTIVITY FEED</p><h2>Notifications</h2></div><span className="section-count">{notifications.length} updates</span></div><NotificationList notifications={notifications} /></section>
              </div>
            </> : <section className="surface placeholder-surface"><p className="eyebrow">{activeItem.toUpperCase()}</p><h2>{activeItem} workspace</h2><p>Select Dashboard to return to your live service desk overview.</p></section>}
          </>}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
