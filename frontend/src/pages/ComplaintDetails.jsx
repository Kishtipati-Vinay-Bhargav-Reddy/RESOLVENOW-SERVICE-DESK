import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
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
import { formatDateTime } from "../utils/date";

const transitions = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
const actionLabels = {
  ASSIGNED: "Mark assigned",
  IN_PROGRESS: "Start work",
  RESOLVED: "Resolve complaint",
  CLOSED: "Close complaint",
};

function ComplaintDetails({ username, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [nextStatus, setNextStatus] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getComplaint(id), getComplaintHistory(id), getAssignments()])
      .then(([complaintResult, historyResult, assignmentResult]) => {
        if (!active) return;
        if (complaintResult.status === "fulfilled") setComplaint(complaintResult.value.data);
        else setError(getErrorMessage(complaintResult.reason));
        if (historyResult.status === "fulfilled") setHistory(getCollection(historyResult.value));
        else setError(getErrorMessage(historyResult.reason));
        if (assignmentResult.status === "fulfilled") {
          const matching = getCollection(assignmentResult.value).find((item) => String(item.complaintId) === String(id));
          setAssignment(matching || null);
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
    setRefreshKey((value) => value + 1);
  };

  const commitStatus = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      const { data } = await updateComplaintStatus(id, nextStatus);
      setComplaint(data);
      setNextStatus(null);
      showToast(`Complaint moved to ${nextStatus.replaceAll("_", " ").toLowerCase()}.`);
      refresh();
      window.dispatchEvent(new Event("servicedesk:changed"));
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setUpdating(false);
    }
  };

  const commitEscalation = async () => {
    if (!escalationReason.trim()) {
      showToast("Please provide a reason for escalation.", "error");
      return;
    }
    setEscalating(true);
    try {
      const { data } = await escalateComplaint(id, { reason: escalationReason.trim() });
      setComplaint(data);
      setEscalationDialogOpen(false);
      setEscalationReason("");
      showToast("Complaint has been escalated.");
      refresh();
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setEscalating(false);
    }
  };

  const currentStatus = String(complaint?.status || "OPEN").toUpperCase();
  const allowedNextStatuses = transitions[currentStatus] || [];
  const isOwner = Number(user?.userId) === Number(complaint?.userId);
  const isStaff = ["ADMIN", "STAFF", "AGENT", "SUPPORT_AGENT", "DEPARTMENT_MANAGER", "ROLE_ADMIN", "ROLE_STAFF", "ROLE_AGENT"].includes(String(user?.role || "").toUpperCase());
  const allowedStatuses = isStaff ? allowedNextStatuses : (isOwner && currentStatus === "RESOLVED" ? ["CLOSED"] : []);
  const mayUpdate = isStaff || (isOwner && currentStatus === "RESOLVED");
  const orderedHistory = [...history].sort((left, right) => new Date(left.changedAt) - new Date(right.changedAt));

  return <AppShell activeItem="Complaints" username={username} role={user?.role} onLogout={onLogout}>
    <div className="breadcrumb"><Link to="/complaints">Complaints</Link><span>/</span><span>#{id}</span></div>
    {loading ? <LoadingSkeleton rows={5} /> : error && !complaint ? <ErrorState title="Unable to load this complaint." detail={error}
      onRetry={refresh} /> : complaint && <>
      <PageHeader eyebrow={`COMPLAINT / #${complaint.id}`} title={complaint.title}
        description={`${complaint.department} department · Reported by ${complaint.username || "account owner"}`}
        actions={<>
          {complaint.escalated && <span className="status-badge status-escalated">L{complaint.escalationLevel} Escalated</span>}
          {complaint.overdue && <span className="status-badge status-overdue">Overdue</span>}
          <StatusBadge status={complaint.status} />
          <button className="button button-secondary" type="button" onClick={refresh} disabled={refreshing}>
            <Icon name="refresh" size={17} />{refreshing ? "Refreshing" : "Refresh"}</button>
        </>} />
      {error && <ErrorState title="Some complaint details could not be refreshed." detail={error} onRetry={refresh} />}

      <div className="complaint-detail-layout">
        <div className="complaint-detail-main">
          <section className="surface detail-section">
            <div className="section-heading"><div><p className="eyebrow">ISSUE SUMMARY</p><h2>Complaint details</h2></div></div>
            <dl className="detail-grid">
              <div className="detail-field detail-field-wide"><dt>Title</dt><dd>{complaint.title}</dd></div>
              <div className="detail-field detail-field-wide"><dt>Description</dt><dd className="detail-description">{complaint.description}</dd></div>
              <div className="detail-field"><dt>Department</dt><dd>{complaint.department}</dd></div>
              <div className="detail-field"><dt>Priority</dt><dd><StatusBadge status={complaint.priority || "MEDIUM"} /></dd></div>
              <div className="detail-field"><dt>Owner</dt><dd>{complaint.username || "You"}</dd></div>
              <div className="detail-field"><dt>Created</dt><dd>{formatDateTime(complaint.createdAt)}</dd></div>
              <div className="detail-field"><dt>SLA Target</dt><dd>{complaint.slaDeadline ? formatDateTime(complaint.slaDeadline) : "Standard"} {complaint.overdue && <span className="status-badge status-overdue">Overdue</span>}</dd></div>
              <div className="detail-field"><dt>Last updated</dt><dd>{formatDateTime(complaint.updatedAt)}</dd></div>
              {complaint.escalated && (
                <div className="detail-field detail-field-wide">
                  <dt>Escalation Details</dt>
                  <dd>
                    <span className="status-badge status-escalated">Level {complaint.escalationLevel}</span>
                    {complaint.escalationReason ? ` — ${complaint.escalationReason}` : ""}
                    {complaint.escalatedAt ? ` (${formatDateTime(complaint.escalatedAt)})` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="surface detail-section timeline-section">
            <div className="section-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Status history</h2></div><span className="section-count">{orderedHistory.length} events</span></div>
            {orderedHistory.length ? <ol className="status-timeline">
              {orderedHistory.map((event) => <li className="timeline-event" key={event.id}>
                <span className="timeline-marker"><Icon name="check" size={14} /></span>
                <div className="timeline-event-content">
                  <div className="timeline-event-heading">
                    <strong>{event.actionNote || (event.fromStatus ? `${event.fromStatus.replaceAll("_", " ")} → ` : "Created as ") + event.toStatus?.replaceAll("_", " ")}</strong>
                    <time dateTime={event.changedAt}>{formatDateTime(event.changedAt)}</time>
                  </div>
                  <span>Changed by {event.changedByUsername || "Service Desk"}</span>
                </div>
              </li>)}
            </ol> : <p className="muted-note">No status history available.</p>}
          </section>
        </div>

        <aside className="complaint-detail-side">
          <section className="surface detail-section">
            <div className="section-heading"><div><p className="eyebrow">CURRENT STATE</p><h2>Actions</h2></div></div>
            <div className="current-status-line"><span>Status</span><StatusBadge status={complaint.status} /></div>
            {allowedStatuses.length ? <div className="status-action-list">
              {allowedStatuses.map((status) => <button className={`button ${status === "CLOSED" ? "button-secondary" : "button-primary"}`} type="button"
                key={status} onClick={() => setNextStatus(status)}>{actionLabels[status]}</button>)}
            </div> : <p className="muted-note">
              {currentStatus === "CLOSED"
                ? "This complaint has reached its final status."
                : isOwner && !isStaff
                  ? "This complaint is being processed by the service desk. You can close it once it is marked resolved."
                  : "Only service staff or the ticket owner can change status."}
            </p>}

            {mayUpdate && currentStatus !== "CLOSED" && (
              <div style={{ padding: "0 20px 16px" }}>
                {!escalationDialogOpen ? (
                  <button className="button button-secondary" type="button" style={{ width: "100%" }} onClick={() => setEscalationDialogOpen(true)}>
                    <Icon name="warning" size={16} /> Escalate complaint
                  </button>
                ) : (
                  <div style={{ display: "grid", gap: "8px", background: "var(--background)", padding: "12px", borderRadius: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text)" }}>
                      Escalation reason:
                      <textarea
                        style={{ width: "100%", marginTop: "4px", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px" }}
                        rows={3}
                        placeholder="Provide justification..."
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                      />
                    </label>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="button button-secondary button-small" type="button" onClick={() => { setEscalationDialogOpen(false); setEscalationReason(""); }} disabled={escalating}>
                        Cancel
                      </button>
                      <button className="button button-primary button-small" type="button" onClick={commitEscalation} disabled={escalating || !escalationReason.trim()}>
                        {escalating ? "Saving..." : "Escalate"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <div className="section-heading"><div><p className="eyebrow">WORK ALLOCATION</p><h2>Assignment</h2></div></div>
            {assignment ? <dl className="compact-details">
              <div><dt>Assigned to</dt><dd>{assignment.assignedTo}</dd></div>
              <div><dt>Assignment status</dt><dd><StatusBadge status={assignment.status} /></dd></div>
              <div><dt>Updated</dt><dd>{formatDateTime(assignment.updatedAt)}</dd></div>
            </dl> : <p className="muted-note">No assignment is available for this complaint.</p>}
            <button className="text-link side-link" type="button" onClick={() => navigate("/assignments")}>Open assignments <span aria-hidden="true">→</span></button>
          </section>
        </aside>
      </div>
    </>}
    <ConfirmDialog open={Boolean(nextStatus)} title={`Move complaint to ${nextStatus?.replaceAll("_", " ").toLowerCase()}?`}
      message="This updates the complaint lifecycle and records the change in its history." confirmLabel="Confirm status change"
      tone={nextStatus === "CLOSED" ? "danger" : "primary"} isBusy={updating} onConfirm={commitStatus} onCancel={() => setNextStatus(null)} />
  </AppShell>;
}

export default ComplaintDetails;
