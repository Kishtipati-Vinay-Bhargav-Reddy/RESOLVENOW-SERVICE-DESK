import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  RotateCw, 
  Search, 
  Building2, 
  ArrowRight,
  Edit2
} from "lucide-react";
import AppShell from "../components/AppShell";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/ToastContext";
import { getAssignments, getCollection, getErrorMessage, updateAssignment } from "../services/api";
import { formatRelativeTime } from "../utils/date";

const statuses = [
  { id: "", label: "All Statuses" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
];

const departments = ["IT", "HR", "FINANCE", "OPERATIONS"];
const idOf = (a) => a.id ?? a.assignmentId;
const isStaff = (role) => ["ADMIN", "STAFF"].includes(String(role || "").toUpperCase());

function Assignments({ username, user, onLogout }) {
  const showToast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [assignee, setAssignee] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getAssignments()
      .then((response) => {
        if (active) setAssignments(getCollection(response));
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setIsLoading(true);
    setRefreshing(true);
    setError("");
    setRefreshKey((v) => v + 1);
  };

  const saveReassignment = async (event, assignment) => {
    event.preventDefault();
    const payload = {
      assignedTo: assignee.trim() && assignee.trim() !== assignment.assignedTo ? assignee.trim() : null,
      status: nextStatus || null,
    };

    if (!payload.assignedTo && !payload.status) {
      setEditingId(null);
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await updateAssignment(idOf(assignment), payload);
      setAssignments((curr) => curr.map((item) => (idOf(item) === idOf(assignment) ? data : item)));
      setEditingId(null);
      showToast("Assignment updated successfully.");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = assignments.filter((assignment) => {
    const searchable = [
      idOf(assignment),
      assignment.complaintId,
      assignment.department,
      assignment.assignedTo,
      assignment.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!query.trim() || searchable.includes(query.trim().toLowerCase())) &&
      (!statusFilter || String(assignment.status).toUpperCase() === statusFilter) &&
      (!departmentFilter || assignment.department === departmentFilter)
    );
  });

  const availableStatuses = (st) => {
    if (st === "ASSIGNED") return ["IN_PROGRESS", "COMPLETED"];
    if (st === "IN_PROGRESS") return ["COMPLETED"];
    return [];
  };

  return (
    <AppShell activeItem="Assignments" username={username} role={user?.role} onLogout={onLogout}>
      <PageHeader
        eyebrow="WORK ALLOCATION / DISPATCH QUEUE"
        title="Department Task Assignments"
        description="Monitor automated ticket routing across specialized teams and reassign tasks."
        actions={
          <button className="btn btn-secondary" type="button" onClick={refresh} disabled={refreshing}>
            <RotateCw size={15} className={refreshing ? "spin-slow" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh Queue"}</span>
          </button>
        }
      />

      {error && <ErrorState title="Unable to retrieve queue" detail={error} onRetry={refresh} />}

      {/* Filter and Search Bar */}
      <div 
        style={{ 
          background: "var(--bg-surface)", 
          border: "1px solid var(--border-subtle)", 
          borderRadius: "var(--radius-lg)", 
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: "280px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
            <input
              className="form-control"
              style={{ paddingLeft: "36px", height: "38px" }}
              placeholder="Search by ticket ID, department, agent..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>

          <select
            className="form-control"
            style={{ width: "auto", height: "38px", cursor: "pointer" }}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: "flex", gap: "6px" }}>
          {statuses.map((st) => (
            <button
              key={st.id}
              type="button"
              className="badge"
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                background: statusFilter === st.id ? "rgba(59, 130, 246, 0.2)" : "var(--bg-app)",
                border: statusFilter === st.id ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                color: statusFilter === st.id ? "#60A5FA" : "var(--text-secondary)"
              }}
              onClick={() => setStatusFilter(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length > 0 ? (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Grievance Ticket</th>
                  <th>Department</th>
                  <th>Assigned Agent</th>
                  <th>Assignment Status</th>
                  <th>Last Update</th>
                  {isStaff(user?.role) && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((assignment) => {
                  const id = idOf(assignment);
                  const isEditing = editingId === id;

                  return (
                    <React.Fragment key={id}>
                      <tr>
                        <td>
                          <span className="ticket-id">#{id}</span>
                        </td>
                        <td>
                          <Link 
                            className="ticket-link" 
                            to={`/complaints/${assignment.complaintId}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            Ticket #{assignment.complaintId} <ArrowRight size={12} />
                          </Link>
                        </td>
                        <td>
                          <span className="dept-tag">
                            <Building2 size={12} />
                            {assignment.department}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className="avatar" style={{ width: "24px", height: "24px", fontSize: "0.7rem" }}>
                              {assignment.assignedTo ? assignment.assignedTo.charAt(0).toUpperCase() : "?"}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {assignment.assignedTo || "Unassigned"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td>
                          <time style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formatRelativeTime(assignment.updatedAt)}
                          </time>
                        </td>
                        {isStaff(user?.role) && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-secondary btn-small"
                              type="button"
                              onClick={() => {
                                setEditingId(isEditing ? null : id);
                                setAssignee(assignment.assignedTo || "");
                                setNextStatus("");
                              }}
                            >
                              <Edit2 size={12} />
                              <span>{isEditing ? "Cancel" : "Reassign"}</span>
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Inline Reassignment Row */}
                      {isEditing && (
                        <tr style={{ background: "var(--bg-surface-elevated)" }}>
                          <td colSpan={isStaff(user?.role) ? 7 : 6} style={{ padding: "16px 20px" }}>
                            <form 
                              onSubmit={(e) => saveReassignment(e, assignment)}
                              style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                  Agent:
                                </label>
                                <input
                                  className="form-control"
                                  style={{ width: "160px", height: "34px", fontSize: "0.82rem" }}
                                  value={assignee}
                                  onChange={(e) => setAssignee(e.target.value)}
                                  placeholder="admin, support, staff..."
                                  required
                                />
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                  Status:
                                </label>
                                <select
                                  className="form-control"
                                  style={{ width: "160px", height: "34px", fontSize: "0.82rem" }}
                                  value={nextStatus}
                                  onChange={(e) => setNextStatus(e.target.value)}
                                >
                                  <option value="">Keep current status</option>
                                  {availableStatuses(String(assignment.status).toUpperCase()).map((st) => (
                                    <option key={st} value={st}>{st.replaceAll("_", " ")}</option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                                <button
                                  className="btn btn-secondary btn-small"
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn btn-primary btn-small"
                                  type="submit"
                                  disabled={isSaving}
                                >
                                  {isSaving ? "Saving..." : "Commit Update"}
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={assignments.length > 0 ? "No matching tasks found" : "No active task assignments"}
          description={
            assignments.length > 0
              ? "Try adjusting your query or status filter."
              : "Assignments are automatically created by the Assignment Service when grievances are logged."
          }
          icon="assignments"
        />
      )}
    </AppShell>
  );
}

export default Assignments;