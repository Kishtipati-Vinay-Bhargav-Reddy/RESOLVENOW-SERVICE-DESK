import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { api, getCollection, getErrorMessage } from "../services/api";

const initialForm = {
  title: "",
  description: "",
  department: "IT",
  username: "",
};

const getStatus = (complaint) => complaint.status || complaint.complaintStatus || "Open";
const getId = (complaint) => complaint.complaintId || complaint.id || "-";

function Complaints({ username, onLogout }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...initialForm, username: username || localStorage.getItem("username") || "" }));
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/complaints");
      setComplaints(getCollection(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.get("/complaints")
      .then((response) => {
        if (isMounted) setComplaints(getCollection(response));
      })
      .catch((requestError) => {
        if (isMounted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/complaints", form);
      setForm({ ...initialForm, username: username || localStorage.getItem("username") || "" });
      setSuccess("Complaint created successfully.");
      await loadComplaints();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <Navbar username={username} onLogout={onLogout} />
      <div className="dashboard-body">
        <Sidebar activeItem="Complaints" onNavigate={(item) => item === "Dashboard" ? navigate("/dashboard") : item === "Assignments" ? navigate("/assignments") : item === "Notifications" ? navigate("/notifications") : item === "Profile" ? navigate("/profile") : undefined} onLogout={onLogout} />
        <main className="dashboard-main complaints-page">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">SERVICE DESK / COMPLAINTS</p>
              <h1>Create a complaint</h1>
              <p className="page-description">Log a customer issue and send it to the right department.</p>
            </div>
          </div>

          <section className="surface complaint-form-surface">
            <div className="section-heading">
              <div><p className="eyebrow">NEW REQUEST</p><h2>Complaint details</h2></div>
            </div>
            <form className="complaint-form" onSubmit={handleSubmit}>
              <label>Title<input name="title" value={form.title} onChange={handleChange} placeholder="Briefly describe the issue" required /></label>
              <label>Department<select name="department" value={form.department} onChange={handleChange} required><option>IT</option><option>HR</option><option>Finance</option><option>Operations</option></select></label>
              <label className="full-width">Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="Add the relevant details, impact, and context" rows="5" required /></label>
              <label>Username<input name="username" value={form.username} onChange={handleChange} placeholder="Customer username" required /></label>
              <div className="form-actions"><button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create complaint"}</button></div>
            </form>
            {success && <p className="inline-success">{success}</p>}
            {error && <p className="inline-error">{error}</p>}
          </section>

          <section className="surface complaints-list-surface">
            <div className="section-heading"><div><p className="eyebrow">ISSUE REGISTER</p><h2>Existing complaints</h2></div><span className="section-count">{complaints.length} total</span></div>
            {isLoading ? <div className="state-panel"><span className="spinner" />Loading complaints...</div> : !complaints.length ? <div className="empty-state">No complaints found. Create the first one above.</div> : <div className="complaints-cards">{complaints.map((complaint, index) => <article className="complaint-record" key={getId(complaint) === "-" ? index : getId(complaint)}><div className="record-heading"><span className="id-cell">#{getId(complaint)}</span><span className={`status status-${String(getStatus(complaint)).toLowerCase()}`}>{getStatus(complaint)}</span></div><h3>{complaint.title || complaint.subject || "Untitled complaint"}</h3><p>{complaint.description || "No description provided."}</p><div className="record-meta"><span><strong>Department</strong>{complaint.department || complaint.departmentName || "-"}</span><span><strong>Username</strong>{complaint.username || complaint.user?.username || complaint.userName || "-"}</span></div></article>)}</div>}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Complaints;
