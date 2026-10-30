import React from "react";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Clock, 
  ArrowRight
} from "lucide-react";
import { formatRelativeTime } from "../utils/date";
import { StatusBadge, PriorityBadge, EscalationBadge, OverdueBadge } from "./StatusBadge";
import { EmptyState } from "./Feedback";

const complaintId = (complaint) => complaint.id ?? complaint.complaintId;

function ComplaintList({ 
  complaints, 
  emptyTitle = "No issues recorded yet", 
  emptyDescription = "Submit your first service grievance to initiate tracking and resolution." 
}) {
  if (!complaints || complaints.length === 0) {
    return (
      <EmptyState 
        title={emptyTitle} 
        description={emptyDescription} 
        icon="complaints" 
      />
    );
  }

  return (
    <div className="table-card">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket Identifier</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Reporter</th>
              <th>Status</th>
              <th>SLA Target</th>
              <th>Last Update</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const id = complaintId(complaint);
              return (
                <tr key={id}>
                  <td>
                    <div className="ticket-cell">
                      <span className="ticket-id">#{id}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <Link className="ticket-link" to={`/complaints/${id}`}>
                          {complaint.title}
                        </Link>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {complaint.escalated && (
                            <EscalationBadge 
                              level={complaint.escalationLevel} 
                              reason={complaint.escalationReason} 
                            />
                          )}
                          {complaint.overdue && <OverdueBadge />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-tag">
                      <Building2 size={12} />
                      {complaint.department}
                    </span>
                  </td>
                  <td>
                    <PriorityBadge priority={complaint.priority} />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 500 }}>
                      {complaint.username || "You"}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.78rem", color: complaint.overdue ? "var(--accent-rose)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {complaint.slaDeadline ? formatRelativeTime(complaint.slaDeadline) : "Standard"}
                    </span>
                  </td>
                  <td>
                    <time dateTime={complaint.updatedAt || undefined} style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {formatRelativeTime(complaint.updatedAt)}
                    </time>
                  </td>
                  <td>
                    <Link className="btn btn-ghost btn-small" to={`/complaints/${id}`} title="Inspect ticket details">
                      View <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="responsive-complaint-cards">
        {complaints.map((complaint) => {
          const id = complaintId(complaint);
          return (
            <article className="responsive-complaint-card" key={`card-${id}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="ticket-id">#{id}</span>
                <StatusBadge status={complaint.status} />
              </div>
              <Link className="ticket-link" to={`/complaints/${id}`} style={{ fontSize: "1rem" }}>
                {complaint.title}
              </Link>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {complaint.description}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span className="dept-tag"><Building2 size={12} /> {complaint.department}</span>
                <PriorityBadge priority={complaint.priority} />
                {complaint.escalated && <EscalationBadge level={complaint.escalationLevel} />}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatRelativeTime(complaint.updatedAt)}</span>
                <Link className="btn btn-ghost btn-small" to={`/complaints/${id}`}>
                  Inspect <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ComplaintList;
