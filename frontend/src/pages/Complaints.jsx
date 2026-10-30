import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Search, 
  RotateCw, 
  X, 
  Laptop, 
  Users, 
  DollarSign, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Flame, 
  ArrowRight
} from "lucide-react";
import AppShell from "../components/AppShell";
import ComplaintList from "../components/ComplaintList";
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import { useToast } from "../components/ToastContext";
import { createComplaint, getCollection, getComplaints, getErrorMessage } from "../services/api";

const departments = [
  { id: "IT", name: "Information Technology", icon: Laptop, desc: "Hardware, Network, Cloud & Access" },
  { id: "HR", name: "Human Resources", icon: Users, desc: "Payroll, Benefits & Policy" },
  { id: "FINANCE", name: "Finance & Accounts", icon: DollarSign, desc: "Billing, Expenses & Approvals" },
  { id: "OPERATIONS", name: "Operations", icon: Activity, desc: "Facilities, Logistics & Workflow" },
];

const priorities = [
  { id: "LOW", label: "Low", sla: "72h SLA", icon: Clock, color: "var(--accent-emerald)" },
  { id: "MEDIUM", label: "Medium", sla: "48h SLA", icon: Clock, color: "var(--accent-blue)" },
  { id: "HIGH", label: "High", sla: "24h SLA", icon: AlertTriangle, color: "var(--accent-amber)" },
  { id: "CRITICAL", label: "Critical", sla: "4h SLA", icon: Flame, color: "var(--accent-rose)" },
];

const statusFilters = [
  { id: "", label: "All Statuses" },
  { id: "OPEN", label: "Open" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CLOSED", label: "Closed" },
];

const defaultForm = { title: "", department: "IT", description: "", priority: "MEDIUM" };
const idOf = (c) => c.id ?? c.complaintId;
const statusOf = (c) => String(c.status || "OPEN").toUpperCase();

function Complaints({ username, user, onLogout }) {
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState(defaultForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const query = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const departmentFilter = searchParams.get("department") || "";
  const sort = searchParams.get("sort") || "updated";

  useEffect(() => {
    let active = true;
    getComplaints()
      .then((response) => { 
        if (active) setComplaints(getCollection(response)); 
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
    setRefreshKey((v) => v + 1);
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      await createComplaint({
        title: form.title.trim(),
        department: form.department,
        description: form.description.trim(),
        priority: form.priority,
      });

      setForm(defaultForm);
      setModalOpen(false);
      showToast("Grievance submitted & auto-assigned successfully!");
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
    const searchable = [
      idOf(complaint), 
      complaint.title, 
      complaint.description, 
      complaint.department, 
      complaint.priority,
      complaint.username
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (!statusFilter || statusOf(complaint) === statusFilter) &&
      (!departmentFilter || complaint.department === departmentFilter)
    );
  });

  filteredComplaints.sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "status") return statusOf(a).localeCompare(statusOf(b));
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  return (
    <AppShell activeItem="Complaints" username={username} role={user?.role} onLogout={onLogout}>
      <PageHeader
        eyebrow="SERVICE REGISTER / INCIDENT MANAGEMENT"
        title="Service Grievances & Tickets"
        description="Submit, monitor, and resolve cross-department grievances with real-time SLA tracking."
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" type="button" onClick={refresh} disabled={refreshing}>
              <RotateCw size={15} className={refreshing ? "spin-slow" : ""} />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              <span>Raise Grievance</span>
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Error fetching grievances" detail={error} onRetry={refresh} />}

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
              placeholder="Filter by ID, summary, keywords..."
              value={query}
              onChange={(e) => setFilter("q", e.target.value)}
            />
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>

          <select
            className="form-control"
            style={{ width: "auto", height: "38px", cursor: "pointer" }}
            value={departmentFilter}
            onChange={(e) => setFilter("department", e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.id} ({d.name})</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: "auto", height: "38px", cursor: "pointer" }}
            value={sort}
            onChange={(e) => setFilter("sort", e.target.value)}
          >
            <option value="updated">Recently Updated</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">By Status</option>
          </select>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {statusFilters.map((sf) => (
            <button
              key={sf.id}
              type="button"
              className={`badge ${statusFilter === sf.id ? "status-open" : ""}`}
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                background: statusFilter === sf.id ? "rgba(59, 130, 246, 0.2)" : "var(--bg-app)",
                border: statusFilter === sf.id ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                color: statusFilter === sf.id ? "#60A5FA" : "var(--text-secondary)"
              }}
              onClick={() => setFilter("status", sf.id)}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredComplaints.length > 0 ? (
        <ComplaintList complaints={filteredComplaints} />
      ) : (
        <EmptyState
          title={complaints.length > 0 ? "No matching grievances found" : "No grievances logged"}
          description={
            complaints.length > 0 
              ? "No records matched your current query or department filter." 
              : "Raise your first grievance to initiate automated department dispatch."
          }
          action={
            complaints.length > 0 ? (
              <button className="btn btn-secondary btn-small" type="button" onClick={clearFilters}>
                Clear All Filters
              </button>
            ) : (
              <button className="btn btn-primary btn-small" type="button" onClick={() => setModalOpen(true)}>
                <Plus size={14} /> Raise Grievance
              </button>
            )
          }
        />
      )}

      {/* Modern Modal: Log New Grievance */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-blue)", textTransform: "uppercase" }}>
                  INTAKE PORTAL
                </span>
                <h2 style={{ fontSize: "1.3rem", marginTop: "2px" }}>Raise Service Grievance</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitComplaint}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "#FDA4AF", fontSize: "0.84rem" }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="comp-title">Issue Summary / Title</label>
                  <input
                    id="comp-title"
                    className="form-control"
                    placeholder="e.g. Finance database connectivity failure in EMEA region"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={120}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Select Target Department</label>
                  <div className="visual-option-grid">
                    {departments.map((dept) => {
                      const IconComp = dept.icon;
                      const isSelected = form.department === dept.id;
                      return (
                        <div
                          key={dept.id}
                          className={`visual-option-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setForm({ ...form, department: dept.id })}
                        >
                          <div style={{ color: isSelected ? "var(--accent-blue)" : "var(--text-muted)" }}>
                            <IconComp size={20} />
                          </div>
                          <div>
                            <strong>{dept.id}</strong>
                            <small>{dept.desc}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Priority & Service Level Agreement (SLA)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {priorities.map((p) => {
                      const isSelected = form.priority === p.id;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: isSelected ? "rgba(59, 130, 246, 0.12)" : "var(--bg-app)",
                            border: isSelected ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            padding: "10px 8px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => setForm({ ...form, priority: p.id })}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: p.color }}>
                            {p.label}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {p.sla}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="comp-desc">Grievance Details & Impact</label>
                  <textarea
                    id="comp-desc"
                    className="form-control"
                    placeholder="Provide details of the outage, impacted systems, steps to reproduce, or urgent requirements..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Grievance"}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Complaints;
