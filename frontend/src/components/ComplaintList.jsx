const formatValue = (value) => value ?? "-";

function ComplaintList({ complaints }) {
  if (!complaints.length) return <div className="empty-state">No complaints found.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Complaint</th><th>Department</th><th>Username</th><th>Status</th><th>Complaint ID</th></tr>
        </thead>
        <tbody>
          {complaints.slice(0, 6).map((complaint, index) => {
            const status = complaint.status || complaint.complaintStatus || "Open";
            return (
              <tr key={complaint.id || complaint.complaintId || index}>
                <td className="primary-cell">{formatValue(complaint.title || complaint.subject || complaint.description)}</td>
                <td>{formatValue(complaint.department || complaint.departmentName)}</td>
                <td>{formatValue(complaint.username || complaint.user?.username || complaint.userName)}</td>
                <td><span className={`status status-${String(status).toLowerCase()}`}>{status}</span></td>
                <td className="id-cell">#{formatValue(complaint.complaintId || complaint.id)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintList;
