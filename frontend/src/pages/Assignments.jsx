import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/ToastContext";
import { getAssignments, getCollection, getErrorMessage, updateAssignment } from "../services/api";
import { formatDateTime } from "../utils/date";

const statuses = [["", "All statuses"], ["ASSIGNED", "Assigned"], ["IN_PROGRESS", "In progress"], ["COMPLETED", "Completed"]];
const departments = ["IT", "HR", "FINANCE", "OPERATIONS"];
const isStaff = (role) => ["ADMIN", "STAFF", "ROLE_ADMIN", "ROLE_STAFF"].includes(String(role || "").toUpperCase());
const idOf = (assignment) => assignment.id ?? assignment.assignmentId;

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
      .then((response) => { if (active) setAssignments(getCollection(response)); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
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
    setRefreshKey((value) => value + 1);
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
      setAssignments((current) => current.map((item) => idOf(item) === idOf(assignment) ? data : item));
      setEditingId(null);
      showToast("Assignment updated.");
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = assignments.filter((assignment) => {
    const searchable = [idOf(assignment), assignment.complaintId, assignment.department, assignment.assignedTo, assignment.status]
      .filter(Boolean).join(" ").toLowerCase();
    return (!query.trim() || searchable.includes(query.trim().toLowerCase()))
      && (!statusFilter || String(assignment.status).toUpperCase() === statusFilter)
      && (!departmentFilter || assignment.department === departmentFilter);
  });

  const availableStatuses = (status) => status === "ASSIGNED" ? ["IN_PROGRESS", "COMPLETED"]
    : status === "IN_PROGRESS" ? ["COMPLETED"] : [];

  return <AppShell activeItem="Assignments" username={username} role={user?.role} onLogout={onLogout}>
    <PageHeader eyebrow="SERVICE DESK / WORK ALLOCATION" title="Assignments"
      description="Track work ownership and progress across the service desk."
      actions={<button className="button button-secondary" type="button" onClick={refresh} disabled={refreshing}>
        <Icon name="refresh" size={17} />{refreshing ? "Refreshing" : "Refresh"}
      </button>} />

    {error && <ErrorState title="Unable to load assignments." detail={error} onRetry={refresh} />}
    <section className="surface assignment-register">
      <div className="section-heading register-heading">
        <div><p className="eyebrow">CURRENT WORK</p><h2>Assignment queue</h2></div>
        <span className="section-count">{filtered.length} of {assignments.length} assignments</span>
      </div>
      <div className="filter-toolbar">
        <label className="search-control"><Icon name="search" size={18} /><input aria-label="Search assignments" placeholder="Search ID, complaint, assignee" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="filter-control"><span className="visually-hidden">Filter assignment status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statuses.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
        </select></label>
        <label className="filter-control"><span className="visually-hidden">Filter assignment department</span><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}
        </select></label>
      </div>
      {isLoading ? <LoadingSkeleton rows={5} /> : filtered.length ? <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Assignment</th><th>Complaint</th><th>Department</th><th>Assigned to</th><th>Status</th><th>Updated</th>{isStaff(user?.role) && <th>Actions</th>}</tr></thead>
          <tbody>{filtered.map((assignment) => <>
            <tr key={idOf(assignment)}>
              <td className="id-cell">#{idOf(assignment)}</td>
              <td><Link className="table-action" to={`/complaints/${assignment.complaintId}`}>#{assignment.complaintId}</Link></td>
              <td>{assignment.department}</td>
              <td className="assignee-cell"><span className="mini-avatar">{assignment.assignedTo?.slice(0, 1).toUpperCase() || "?"}</span>{assignment.assignedTo}</td>
              <td><StatusBadge status={assignment.status} /></td>
              <td><time dateTime={assignment.updatedAt || undefined}>{formatDateTime(assignment.updatedAt)}</time></td>
              {isStaff(user?.role) && <td><button className="button button-tertiary button-small" type="button"
                onClick={() => { setEditingId(idOf(assignment)); setAssignee(assignment.assignedTo || ""); setNextStatus(""); }}>Reassign</button></td>}
            </tr>
            {editingId === idOf(assignment) && <tr className="edit-row" key={`edit-${idOf(assignment)}`}>
              <td colSpan={isStaff(user?.role) ? 7 : 6}><form className="reassign-form" onSubmit={(event) => saveReassignment(event, assignment)}>
                <label>Assignee<input value={assignee} onChange={(event) => setAssignee(event.target.value)} aria-label="New assignee" required /></label>
                <label>Status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}><option value="">No status change</option>
                  {availableStatuses(String(assignment.status).toUpperCase()).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select></label>
                <div className="reassign-actions"><button className="button button-secondary button-small" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="button button-primary button-small" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button></div>
              </form></td>
            </tr>}
          </>)}</tbody>
        </table>
      </div> : <EmptyState title={assignments.length ? "No matching assignments" : "No assignments found"}
        description={assignments.length ? "Try adjusting your search or filters." : "Assignments appear when a complaint enters the work queue."} icon="assignments" />}
    </section>
  </AppShell>;
}

export default Assignments;