import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  RotateCw, 
  Plus, 
  ArrowRight, 
  Building2
} from "lucide-react";
import AppShell from "../components/AppShell";
import ComplaintList from "../components/ComplaintList";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import NotificationList from "../components/NotificationList";
import StatCard from "../components/StatCard";
import { 
  getAssignments, 
  getCollection, 
  getComplaints, 
  getErrorMessage, 
  getNotifications, 
  markNotificationRead,
  getComplaintStats 
} from "../services/api";
import { useToast } from "../components/ToastContext";
import { useNotificationCount } from "../components/NotificationCountContext";

function Dashboard({ username, user, onLogout }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { unreadCount, refreshUnreadCount } = useNotificationCount();
  
  const [complaints, setComplaints] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [markingIds, setMarkingIds] = useState([]);

  const role = String(user?.role || "USER").toUpperCase();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getComplaints(), 
      getAssignments(), 
      getNotifications(),
      getComplaintStats()
    ])
      .then((results) => {
        if (!active) return;
        const [complaintResult, assignmentResult, notificationResult, statsResult] = results;
        if (complaintResult.status === "fulfilled") setComplaints(getCollection(complaintResult.value));
        if (assignmentResult.status === "fulfilled") setAssignments(getCollection(assignmentResult.value));
        if (notificationResult.status === "fulfilled") setNotifications(getCollection(notificationResult.value));
        if (statsResult.status === "fulfilled") setStats(statsResult.value.data);
        
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
    setRefreshKey((v) => v + 1);
  };

  const markRead = async (id) => {
    setMarkingIds((curr) => [...curr, id]);
    try {
      const { data } = await markNotificationRead(id);
      setNotifications((curr) => curr.map((item) => (item.notificationId || item.id) === id ? data : item));
      await refreshUnreadCount();
      showToast("Notification marked as read.");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setMarkingIds((curr) => curr.filter((v) => v !== id));
    }
  };

  const statusCount = (status) => {
    if (stats?.statusCounts && stats.statusCounts[status] != null) {
      return stats.statusCounts[status];
    }
    return complaints.filter((c) => String(c.status || "OPEN").toUpperCase() === status).length;
  };

  const overdueCount = stats?.overdueCount ?? complaints.filter((c) => c.overdue).length;
  const escalatedCount = stats?.escalatedCount ?? complaints.filter((c) => c.escalated).length;
  const totalCount = stats?.totalComplaints ?? complaints.length;

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <AppShell activeItem="Dashboard" username={username} role={user?.role} onLogout={onLogout}>
      <PageHeader
        eyebrow="ENTERPRISE WORKSPACE / ANALYTICS"
        title={`Welcome back, ${username || "Member"}`}
        description={
          role === "ADMIN"
            ? "Executive Command Center — Real-time metrics across all corporate service desks."
            : role === "STAFF"
            ? "Support Agent Workspace — Handling assigned department queues and SLA resolution lifecycles."
            : "Employee Service Portal — Track your active grievances, review department actions, and monitor SLA progress."
        }
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" type="button" onClick={refresh} disabled={refreshing}>
              <RotateCw size={15} className={refreshing ? "spin-slow" : ""} />
              <span>{refreshing ? "Syncing..." : "Sync Data"}</span>
            </button>
            <button className="btn btn-primary" type="button" onClick={() => navigate("/complaints")}>
              <Plus size={16} />
              <span>Log Grievance</span>
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Telemetry connection notice" detail={error} onRetry={refresh} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          {/* Top Metric Cards Grid */}
          <section className="stats-grid" aria-label="Key Performance Indicators">
            <StatCard
              label="Active Grievances"
              value={totalCount}
              tone="blue"
              icon={FileText}
              trend="+100% SLA target"
              caption="Live records in database"
            />
            <StatCard
              label="Pending Assignment / Work"
              value={statusCount("OPEN") + statusCount("ASSIGNED") + statusCount("IN_PROGRESS")}
              tone="amber"
              icon={Clock}
              caption="In active lifecycle"
            />
            <StatCard
              label="Resolved & Closed"
              value={statusCount("RESOLVED") + statusCount("CLOSED")}
              tone="emerald"
              icon={CheckCircle2}
              trend="Target achieved"
              caption="Successfully completed"
            />
            <StatCard
              label="Escalated Incidents"
              value={escalatedCount}
              tone={escalatedCount > 0 ? "rose" : "purple"}
              icon={ShieldAlert}
              caption={escalatedCount > 0 ? "Requires urgent review" : "No priority escalations"}
            />
            <StatCard
              label="SLA Deadline Breaches"
              value={overdueCount}
              tone={overdueCount > 0 ? "rose" : "blue"}
              icon={AlertTriangle}
              caption={overdueCount > 0 ? "Immediate attention required" : "All tickets within SLA"}
            />
          </section>

          {/* Department Breakdown Visual Ribbon */}
          {stats?.departmentCounts && (
            <div 
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                marginBottom: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Department Distribution & Workload Dispatch
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--accent-blue)", fontWeight: 600 }}>
                  Automated Routing Active
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                {Object.entries(stats.departmentCounts).map(([dept, count]) => (
                  <div
                    key={dept}
                    style={{
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={16} style={{ color: "var(--accent-indigo)" }} />
                      <strong style={{ fontSize: "0.88rem" }}>{dept}</strong>
                    </div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-blue)" }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split Dashboard Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1fr", gap: "28px" }}>
            {/* Left: Recent Complaints Grid */}
            <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>In-Flight Service Grievances</h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Real-time status of recently reported issues.
                  </p>
                </div>
                <Link className="btn btn-ghost btn-small" to="/complaints">
                  View All Register <ArrowRight size={14} />
                </Link>
              </div>

              <ComplaintList
                complaints={recentComplaints}
                emptyTitle="No issues reported yet"
                emptyDescription="Your registered workspace has no active issues. Submit a grievance to trigger automatic department assignment."
              />
            </section>

            {/* Right: Live Activity & Task Feed */}
            <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Audit & Alerts</h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {unreadCount} unread automated notification(s).
                  </p>
                </div>
                <Link className="btn btn-ghost btn-small" to="/notifications">
                  Open Inbox <ArrowRight size={14} />
                </Link>
              </div>

              <NotificationList
                notifications={recentNotifications}
                onMarkRead={markRead}
                markingIds={markingIds}
                limit={5}
              />

              {/* Assignments Queue Banner */}
              <div 
                style={{ 
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(59, 130, 246, 0.08))",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginTop: "8px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div 
                    style={{ 
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "var(--radius-md)", 
                      background: "rgba(99, 102, 241, 0.2)", 
                      color: "#818CF8", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)", display: "block" }}>
                      {assignments.length} Tasks in Assignment Queue
                    </strong>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                      Department dispatch handled by Assignment Service
                    </small>
                  </div>
                </div>
                <Link className="btn btn-secondary btn-small" to="/assignments">
                  View Queue
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default Dashboard;
