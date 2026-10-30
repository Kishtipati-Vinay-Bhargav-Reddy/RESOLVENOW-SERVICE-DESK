import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ComplaintList from "../components/ComplaintList";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import Icon from "../components/Icon";
import { useToast } from "../components/ToastContext";
import { createComplaint, getCollection, getComplaints, getErrorMessage } from "../services/api";

const departments = ["IT", "HR", "FINANCE", "OPERATIONS"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusFilters = [["", "All status"], ["OPEN", "Open"], ["ASSIGNED", "Assigned"], ["IN_PROGRESS", "In progress"], ["RESOLVED", "Resolved"], ["CLOSED", "Closed"]];
const defaultForm = { title: "", department: "IT", description: "", priority: "MEDIUM" };
const idOf = (complaint) => complaint.id ?? complaint.complaintId;
const statusOf = (complaint) => String(complaint.status || "OPEN").toUpperCase();

function Complaints({ username, user, onLogout }) {
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const query = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const departmentFilter = searchParams.get("department") || "";
  const sort = searchParams.get("sort") || "updated";

  useEffect(() => {
    let active = true;
    getComplaints()
      .then((response) => { if (active) setComplaints(getCollection(response)); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [refreshKey]);

  const setFilter = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    setSearchParams(params, { replace: true });
  };

  const refresh = () => {
    setIsLoading(true);
    setRefreshing(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFormError("");
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      await createComplaint({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      setForm(defaultForm);
      setFormOpen(false);
      showToast("Complaint created and submitted.");
      window.dispatchEvent(new Event("notifications:changed"));
      refresh();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredComplaints = complaints.filter((complaint) => {
    const searchable = [idOf(complaint), complaint.title, complaint.description, complaint.department, complaint.priority]
      .filter(Boolean).join(" ").toLowerCase();
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (!statusFilter || statusOf(complaint) === statusFilter)
      && (!departmentFilter || complaint.department === departmentFilter);
  });
  filteredComplaints.sort((left, right) => {
    if (sort === "oldest") return new Date(left.createdAt) - new Date(right.createdAt);
    if (sort === "newest") return new Date(right.createdAt) - new Date(left.createdAt);
    if (sort === "status") return statusOf(left).localeCompare(statusOf(right));
    return new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt);
  });

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  return <AppShell activeItem="Complaints" username={username} role={user?.role} onLogout={onLogout}>
    <PageHeader eyebrow="SERVICE DESK / WORK QUEUE" title="Complaints"
      description="Manage reported issues and track each one through resolution."
      actions={<>
        <button className="button button-secondary" type="button" onClick={refresh} disabled={refreshing}><Icon name="refresh" size={17} />{refreshing ? "Refreshing" : "Refresh"}</button>
        <button className="button button-primary" type="button" onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen}>
          <Icon name={formOpen ? "close" : "plus"} size={18} />{formOpen ? "Close form" : "New complaint"}
        </button>
      </>} />

    {error && <ErrorState title="Unable to load complaints." detail={error} onRetry={refresh} />}

    {formOpen && <section className="surface complaint-composer" aria-labelledby="new-complaint-title">
      <div className="section-heading"><div><p className="eyebrow">NEW REQUEST</p><h2 id="new-complaint-title">Complaint details</h2></div></div>
      <form className="complaint-form" onSubmit={submitComplaint}>
        <label>Title<input name="title" value={form.title} onChange={updateForm} placeholder="Briefly describe the issue" maxLength={120} required /></label>
        <label>Department<select name="department" value={form.department} onChange={updateForm} required>
          {departments.map((department) => <option key={department} value={department}>{department[0] + department.slice(1).toLowerCase()}</option>)}
        </select></label>
        <label>Priority<select name="priority" value={form.priority} onChange={updateForm}>
          {priorities.map((priority) => <option key={priority} value={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}
        </select></label>
        <label className="field-wide">Description<textarea name="description" value={form.description} onChange={updateForm}
          placeholder="Include the impact, timing, and relevant context" maxLength={2000} rows={5} required /></label>
        {formError && <p className="field-wide form-error" role="alert">{formError}</p>}
        <div className="form-footer field-wide"><span>Your account identity and SLA target are attached automatically.</span>
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit complaint"}</button>
        </div>
      </form>
    </section>}

    <section className="surface complaint-register" aria-labelledby="complaint-register-title">
      <div className="section-heading register-heading">
        <div><p className="eyebrow">ISSUE REGISTER</p><h2 id="complaint-register-title">All complaints</h2></div>
        <span className="section-count">{filteredComplaints.length} of {complaints.length}</span>
      </div>
      <div className="filter-toolbar">
        <label className="search-control"><Icon name="search" size={18} /><input aria-label="Search complaints" placeholder="Search ID, title, details" value={query}
          onChange={(event) => setFilter("q", event.target.value)} /></label>
        <label className="filter-control"><span className="visually-hidden">Filter by status</span><select value={statusFilter} onChange={(event) => setFilter("status", event.target.value)}>
          {statusFilters.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
        </select></label>
        <label className="filter-control"><span className="visually-hidden">Filter by department</span><select value={departmentFilter} onChange={(event) => setFilter("department", event.target.value)}>
          <option value="">All departments</option>{departments.map((department) => <option key={department} value={department}>{department[0] + department.slice(1).toLowerCase()}</option>)}
        </select></label>
        <label className="filter-control"><span className="visually-hidden">Sort complaints</span><select value={sort} onChange={(event) => setFilter("sort", event.target.value)}>
          <option value="updated">Recently updated</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="status">Status</option>
        </select></label>
      </div>

      {isLoading ? <LoadingSkeleton rows={5} /> : filteredComplaints.length
        ? <ComplaintList complaints={filteredComplaints} />
        : <EmptyState title={complaints.length ? "No matching complaints" : "No complaints yet"}
          description={complaints.length ? "Try adjusting the search or filters." : "Submit a complaint to start tracking its progress."}
          action={complaints.length ? <button type="button" className="button button-secondary button-small" onClick={clearFilters}>Clear filters</button>
            : <button type="button" className="button button-primary button-small" onClick={() => setFormOpen(true)}>Create complaint</button>} />}
    </section>
  </AppShell>;
}

export default Complaints;
