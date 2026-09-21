import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Profile({ username, onLogout }) {
  const navigate = useNavigate();
  const storedUsername = localStorage.getItem("username") || username || "User";

  const handleNavigate = (item) => {
    const routes = {
      Dashboard: "/dashboard",
      Complaints: "/complaints",
      Assignments: "/assignments",
      Notifications: "/notifications",
    };

    if (routes[item]) navigate(routes[item]);
  };

  return (
    <div className="dashboard-shell">
      <Navbar username={storedUsername} onLogout={onLogout} />
      <div className="dashboard-body">
        <Sidebar activeItem="Profile" onNavigate={handleNavigate} onLogout={onLogout} />
        <main className="dashboard-main profile-page">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">SERVICE DESK / PROFILE</p>
              <h1>Profile</h1>
              <p className="page-description">Review your account and authentication details.</p>
            </div>
            <button className="outline-button" type="button" onClick={onLogout}>Logout</button>
          </div>

          <div className="profile-grid">
            <section className="surface profile-card">
              <div className="section-heading"><div><p className="eyebrow">ACCOUNT</p><h2>Account Information</h2></div></div>
              <div className="profile-details">
                <div className="profile-detail"><span>Username</span><strong>{storedUsername}</strong></div>
                <div className="profile-detail"><span>Role</span><strong>Service Desk User</strong></div>
                <div className="profile-detail"><span>Authentication Status</span><strong className="detail-success">Authenticated</strong></div>
                <div className="profile-detail"><span>Application</span><strong>ResolveNow Service Desk</strong></div>
                <div className="profile-detail"><span>API Gateway</span><strong>http://localhost:8080</strong></div>
              </div>
            </section>

            <section className="surface profile-card">
              <div className="section-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h2>Security</h2></div></div>
              <div className="profile-details">
                <div className="profile-detail"><span>JWT Authentication</span><strong className="detail-success">Enabled</strong></div>
                <div className="profile-detail"><span>Session Type</span><strong>Stateless</strong></div>
                <div className="profile-detail"><span>API Access</span><strong className="detail-success">Protected</strong></div>
              </div>
              <button className="primary-button profile-logout" type="button" onClick={onLogout}>Logout</button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
