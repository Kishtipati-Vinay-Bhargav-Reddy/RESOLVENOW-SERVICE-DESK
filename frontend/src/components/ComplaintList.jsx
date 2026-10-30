import { Link } from "react-router-dom";
import { formatDateTime } from "../utils/date";
import StatusBadge from "./StatusBadge";
import { EmptyState } from "./Feedback";

const complaintId = (complaint) => complaint.id ?? complaint.complaintId;

function ComplaintList({ complaints, emptyTitle = "No complaints yet", emptyDescription = "New complaints will appear here." }) {
  if (!complaints.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Complaint</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Updated</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => (
            <tr key={complaintId(complaint)}>
              <td>
                <div className="complaint-table-title">
                  <span className="id-cell">#{complaintId(complaint)}</span>
                  <Link to={`/complaints/${complaintId(complaint)}`}>{complaint.title}</Link>
                  {complaint.escalated && (
                    <span className="status-badge status-escalated" title={complaint.escalationReason || "Escalated"}>
                      L{complaint.escalationLevel} Escalated
                    </span>
                  )}
                  {complaint.overdue && (
                    <span className="status-badge status-overdue">Overdue</span>
                  )}
                </div>
              </td>
              <td>{complaint.department}</td>
              <td><StatusBadge status={complaint.priority || "MEDIUM"} /></td>
              <td>{complaint.username || "You"}</td>
              <td><StatusBadge status={complaint.status} /></td>
              <td><time dateTime={complaint.updatedAt || undefined}>{formatDateTime(complaint.updatedAt)}</time></td>
              <td><Link className="table-action" to={`/complaints/${complaintId(complaint)}`}>View <span aria-hidden="true">→</span></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="responsive-complaint-cards">
        {complaints.map((complaint) => (
          <article className="responsive-complaint-card" key={`card-${complaintId(complaint)}`}>
            <div className="responsive-card-top">
              <span className="id-cell">#{complaintId(complaint)}</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {complaint.escalated && (
                  <span className="status-badge status-escalated">L{complaint.escalationLevel}</span>
                )}
                {complaint.overdue && (
                  <span className="status-badge status-overdue">Overdue</span>
                )}
                <StatusBadge status={complaint.status} />
              </div>
            </div>
            <Link className="responsive-card-title" to={`/complaints/${complaintId(complaint)}`}>{complaint.title}</Link>
            <p>{complaint.description}</p>
            <div className="responsive-card-meta">
              <span>{complaint.department}</span>
              <span>Priority: {complaint.priority || "MEDIUM"}</span>
              <span>{complaint.username || "You"}</span>
              <time dateTime={complaint.updatedAt || undefined}>{formatDateTime(complaint.updatedAt)}</time>
            </div>
            <Link className="text-link" to={`/complaints/${complaintId(complaint)}`}>View details <span aria-hidden="true">→</span></Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ComplaintList;
