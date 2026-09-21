import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { api, getCollection, getErrorMessage } from "../services/api";

const getAssignmentId = (assignment) => assignment.assignmentId || assignment.id || "-";
const getComplaintId = (assignment) => assignment.complaintId || assignment.complaint?.id || assignment.complaint?.complaintId || "-";
const getDepartment = (assignment) => assignment.department || assignment.departmentName || assignment.complaint?.department || "-";
const getAssignedTo = (assignment) => assignment.assignedTo || assignment.assignee || assignment.assignedUsername || assignment.user?.username || "-";
const getStatus = (assignment) => assignment.status || assignment.assignmentStatus || "Assigned";

function Assignments({ username, onLogout }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/assignments");
      setAssignments(getCollection(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.get("/assignments")
      .then((response) => {
        if (isMounted) setAssignments(getCollection(response));
      })
      .catch((requestError) => {
        if (isMounted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="dashboard-shell">
      <Navbar username={username} onLogout={onLogout} />
      <div className="dashboard-body">
        <Sidebar
          activeItem="Assignments"
          onNavigate={(item) => {
            if (item === "Dashboard") navigate("/dashboard");
            if (item === "Complaints") navigate("/complaints");
            if (item === "Notifications") navigate("/notifications");
            if (item === "Profile") navigate("/profile");
          }}
          onLogout={onLogout}
        />
        <main className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">SERVICE DESK / ASSIGNMENTS</p>
              <h1>Assignment queue</h1>
              <p className="page-description">Track ownership and progress across every assigned complaint.</p>
            </div>
            <button className="primary-button compact" type="button" onClick={loadAssignments} disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh data"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          <section className="surface assignments-surface">
            <div className="section-heading">
              <div><p className="eyebrow">WORK ALLOCATION</p><h2>Current assignments</h2></div>
              <span className="section-count">{assignments.length} total</span>
            </div>
            {isLoading ? <div className="state-panel"><span className="spinner" />Loading assignments...</div> : !assignments.length ? <div className="empty-state">No assignments found.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Assignment ID</th><th>Complaint ID</th><th>Department</th><th>Assigned To</th><th>Status</th></tr></thead>
                  <tbody>{assignments.map((assignment, index) => {
                    const status = getStatus(assignment);
                    return <tr key={getAssignmentId(assignment) === "-" ? index : getAssignmentId(assignment)}>
                      <td className="id-cell">#{getAssignmentId(assignment)}</td>
                      <td className="id-cell">#{getComplaintId(assignment)}</td>
                      <td>{getDepartment(assignment)}</td>
                      <td className="primary-cell">{getAssignedTo(assignment)}</td>
                      <td><span className={`status status-${String(status).toLowerCase()}`}>{status}</span></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Assignments;
