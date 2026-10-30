import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  RotateCw, 
  Building2, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  History,
  X
} from "lucide-react";
import AppShell from "../components/AppShell";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import { StatusBadge, PriorityBadge, EscalationBadge, OverdueBadge } from "../components/StatusBadge";
import { useToast } from "../components/ToastContext";
import {
  escalateComplaint,
  getAssignments,
  getCollection,
  getComplaint,
  getComplaintHistory,
  getErrorMessage,
  updateComplaintStatus,
} from "../services/api";
import { formatDateTime, formatRelativeTime } from "../utils/date";

const transitions = {
  OPEN: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const actionLabels = {
  ASSIGNED: "Mark Assigned",
  IN_PROGRESS: "Start Investigation / Work",
  RESOLVED: "Mark as Resolved",
  CLOSED: "Confirm & Close Grievance",
};

function ComplaintDetails({ username, user, onLogout }) {
  const { id } = useParams();
  const showToast = useToast();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Status update state
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Escalation state
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationLevel, setEscalationLevel] = useState(1);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getComplaint(id), 
      getComplaintHistory(id), 
      getAssignments()
    ])
      .then(([compRes, histRes, assignRes]) => {
        if (!active) return;
        if (compRes.status === "fulfilled") setComplaint(compRes.value.data);
        else setError(getErrorMessage(compRes.reason));

        if (histRes.status === "fulfilled") setHistory(getCollection(histRes.value));
        else setError(getErrorMessage(histRes.reason));

        if (assignRes.status === "fulfilled") {
          const list = getCollection(assignRes.value);
          const found = list.find((item) => String(item.complaintId) === String(id));
          setAssignment(found || null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [id, refreshKey]);

  const refresh = () => {
    setRefreshing(true);
    setError("");
    setRefreshKey((v) => v + 1);
  };

  const handleUpdateStatus = async (statusToSet) => {
    if (!statusToSet) return;
    setUpdatingStatus(true);
    try {
      const { data } = await updateComplaintStatus(id, statusToSet, statusNote.trim());
      setComplaint(data);
      setTargetStatus("");
      setStatusNote("");
      showToast(`Grievance transitioned to ${statusToSet.replaceAll("_", " ")}.`);
      refresh();
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalationReason.trim()) {
      showToast("Please provide a business justification for escalation.", "error");
      return;
    }
    setEscalating(true);
    try {
      const { data } = await escalateComplaint(id, {
        reason: escalationReason.trim(),
        level: Number(escalationLevel) || 1,
      });
      setComplaint(data);
      setEscalationModalOpen(false);
      setEscalationReason("");
      showToast(`Grievance escalated to Level ${escalationLevel}.`);
      refresh();
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setEscalating(false);
    }
  };

  const currentStatus = String(complaint?.status || "OPEN").toUpperCase();
  const allowedNext = transitions[currentStatus] || [];
  const isOwner = Number(user?.userId) === Number(complaint?.userId) || username === complaint?.username;
  const isStaff = ["ADMIN", "STAFF"].includes(String(user?.role || "").toUpperCase());
  const canClose = isOwner && currentStatus === "RESOLVED";

  const orderedHistory = [...history].sort(
    (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
  );

  return (
    <AppShell activeItem="Complaints" username={username} role={user?.role} onLogout={onLogout}>
      {/* Back navigation & header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <Link className="btn btn-ghost btn-small" to="/complaints">
          <ArrowLeft size={16} /> Back to Grievances
        </Link>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>/</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Ticket #{id}</span>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error && !complaint ? (
        <ErrorState title="Unable to retrieve grievance" detail={error} onRetry={refresh} />
      ) : complaint && (
        <>
          <PageHeader
            eyebrow={`TICKET IDENTIFIER #${complaint.id}`}
            title={complaint.title}
            description={`Submitted by ${complaint.username || "You"} • ${complaint.department} Department`}
            actions={
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.escalated && (
                  <EscalationBadge level={complaint.escalationLevel} reason={complaint.escalationReason} />
                )}
                {complaint.overdue && <OverdueBadge />}
                <button className="btn btn-secondary btn-small" type="button" onClick={refresh} disabled={refreshing}>
                  <RotateCw size={14} className={refreshing ? "spin-slow" : ""} />
                </button>
              </div>
            }
          />

          {error && <ErrorState title="Notice" detail={error} onRetry={refresh} />}

          {/* Ticket Inspector Grid */}
          <div className="ticket-detail-grid">
            {/* Left Column: Details & Audit Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Grievance Description Card */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "1.05rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} style={{ color: "var(--accent-blue)" }} />
                  Grievance Description & Impact
                </h3>
                <p style={{ fontSize: "0.94rem", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {complaint.description}
                </p>

                {/* Escalation Alert Box if active */}
                {complaint.escalated && (
                  <div
                    style={{
                      background: "rgba(244, 63, 94, 0.1)",
                      border: "1px solid rgba(244, 63, 94, 0.35)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      marginTop: "20px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <ShieldAlert size={20} style={{ color: "var(--accent-rose)", flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "#FDA4AF", display: "block" }}>
                        Escalated Priority: Level {complaint.escalationLevel}
                      </strong>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        <strong>Reason:</strong> {complaint.escalationReason || "High priority business escalation"}
                      </p>
                      {complaint.escalatedAt && (
                        <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                          Escalated {formatRelativeTime(complaint.escalatedAt)}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-Time Audit History Timeline */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <History size={18} style={{ color: "var(--accent-indigo)" }} />
                    Audit Trail & Transition Lifecycle
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {orderedHistory.length} audit event(s)
                  </span>
                </div>

                {orderedHistory.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "16px" }}>
                    No audit records logged yet.
                  </p>
                ) : (
                  <div className="ticket-timeline">
                    {orderedHistory.map((item, idx) => (
                      <div className="timeline-item" key={item.id || idx}>
                        <div className="timeline-dot" />
                        <div className="timeline-header">
                          <strong>
                            {item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}
                          </strong>
                          <time>{formatDateTime(item.changedAt)}</time>
                        </div>
                        <p style={{ fontSize: "0.84rem" }}>
                          {item.actionNote || "Status updated."}
                        </p>
                        <small style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          By: <strong style={{ color: "var(--text-secondary)" }}>{item.changedByUsername}</strong>
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Assignment, SLA, and Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Department Assignment Card */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Department Assignment
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(59, 130, 246, 0.12)",
                      color: "var(--accent-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>
                      {complaint.department}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Assignee: <strong style={{ color: "var(--text-primary)" }}>{assignment?.assignedTo || "Auto-Dispatch"}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Assignment Status:</span>
                  <StatusBadge status={assignment?.status || "ASSIGNED"} />
                </div>
              </div>

              {/* SLA Target Card */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  SLA Monitoring
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Clock size={20} style={{ color: complaint.overdue ? "var(--accent-rose)" : "var(--accent-emerald)" }} />
                  <div>
                    <strong style={{ fontSize: "1.1rem", color: complaint.overdue ? "var(--accent-rose)" : "var(--text-primary)" }}>
                      {complaint.overdue ? "SLA Breached" : "Within Target"}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>
                      Deadline: {complaint.slaDeadline ? formatDateTime(complaint.slaDeadline) : "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Controls Card (Role-Aware) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Workflow Controls
                </h4>

                {/* Staff / Admin Status Update Controls */}
                {isStaff && allowedNext.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600 }}>Advance Lifecycle State:</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {allowedNext.map((nextSt) => (
                        <button
                          key={nextSt}
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "space-between" }}
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleUpdateStatus(nextSt)}
                        >
                          <span>{actionLabels[nextSt] || nextSt}</span>
                          <ArrowRight size={14} />
                        </button>
                      ))}
                    </div>

                    <input
                      className="form-control"
                      style={{ fontSize: "0.82rem", marginTop: "4px" }}
                      placeholder="Optional transition note..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </div>
                )}

                {/* Customer Close Action when RESOLVED */}
                {canClose && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={{ fontSize: "0.84rem", color: "var(--accent-emerald)" }}>
                      Your issue has been marked resolved. Please confirm closure.
                    </p>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus("CLOSED")}
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                    >
                      <CheckCircle2 size={16} /> Confirm & Close Grievance
                    </button>
                  </div>
                )}

                {/* Customer Escalation Button */}
                {currentStatus !== "CLOSED" && currentStatus !== "RESOLVED" && (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => setEscalationModalOpen(true)}
                  >
                    <ShieldAlert size={16} />
                    <span>{complaint.escalated ? "Re-Escalate Issue" : "Escalate Grievance"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Escalation Modal */}
          {escalationModalOpen && (
            <div className="modal-backdrop" onClick={() => setEscalationModalOpen(false)}>
              <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-rose)", textTransform: "uppercase" }}>
                      URGENT ESCALATION
                    </span>
                    <h2 style={{ fontSize: "1.3rem", marginTop: "2px" }}>Escalate Grievance #{id}</h2>
                  </div>
                  <button className="icon-button" type="button" onClick={() => setEscalationModalOpen(false)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleEscalate}>
                  <div className="modal-body">
                    <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
                      Escalating notifies the department head and accelerates SLA priority for immediate intervention.
                    </p>

                    <div className="form-group">
                      <label>Select Escalation Severity Level</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {[1, 2, 3].map((lvl) => (
                          <div
                            key={lvl}
                            style={{
                              background: escalationLevel === lvl ? "rgba(244, 63, 94, 0.15)" : "var(--bg-app)",
                              border: escalationLevel === lvl ? "1px solid var(--accent-rose)" : "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-md)",
                              padding: "10px",
                              textAlign: "center",
                              cursor: "pointer",
                            }}
                            onClick={() => setEscalationLevel(lvl)}
                          >
                            <strong style={{ color: escalationLevel === lvl ? "#FB7185" : "var(--text-primary)", display: "block" }}>
                              Level {lvl}
                            </strong>
                            <small style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                              {lvl === 1 ? "Supervisor" : lvl === 2 ? "Dept Lead" : "Executive"}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="esc-reason">Business Justification & Urgency</label>
                      <textarea
                        id="esc-reason"
                        className="form-control"
                        placeholder="Detail why standard SLA resolution is insufficient and what immediate action is needed..."
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setEscalationModalOpen(false)}
                      disabled={escalating}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-danger" type="submit" disabled={escalating}>
                      {escalating ? "Submitting Escalation..." : "Confirm Escalation"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

export default ComplaintDetails;
