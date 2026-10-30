import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import { useToast } from "../components/ToastContext";
import { getAuthMe, getErrorMessage } from "../services/api";

function Profile({ username, onLogout }) {
  const showToast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAuthMe()
      .then(({ data }) => { if (active) setProfile(data); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const handleLogout = () => {
    showToast("You have signed out.");
    onLogout();
  };

  return <AppShell activeItem="Profile" username={profile?.username || username} role={profile?.role} onLogout={handleLogout}>
    <PageHeader eyebrow="ACCOUNT / PROFILE" title="Your profile"
      description="Account identity and access information for this service desk session."
      actions={<button className="button button-secondary" type="button" onClick={refresh} disabled={loading}>{loading ? "Refreshing" : "Refresh"}</button>} />
    {error && <ErrorState title="Unable to load your profile." detail={error} onRetry={refresh} />}
    {loading ? <LoadingSkeleton rows={4} /> : profile && <div className="profile-layout">
      <section className="surface profile-identity-card">
        <div className="profile-avatar">{profile.username?.slice(0, 1).toUpperCase() || "U"}</div>
        <div><p className="eyebrow">AUTHENTICATED ACCOUNT</p><h2>{profile.username}</h2><p>{profile.email || "No email on record"}</p></div>
        <span className="session-status"><span />Session active</span>
      </section>
      <section className="surface profile-details-card">
        <div className="section-heading"><div><p className="eyebrow">ACCOUNT DETAILS</p><h2>Identity</h2></div></div>
        <dl className="profile-details">
          <div className="profile-detail"><dt>Username</dt><dd>{profile.username}</dd></div>
          <div className="profile-detail"><dt>Email</dt><dd>{profile.email || "Not provided"}</dd></div>
          <div className="profile-detail"><dt>Role</dt><dd><span className="role-label">{profile.role || "User"}</span></dd></div>
          <div className="profile-detail"><dt>User ID</dt><dd className="id-cell">#{profile.userId}</dd></div>
        </dl>
      </section>
      <section className="surface profile-security-card">
        <div className="section-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h2>Security</h2></div></div>
        <dl className="profile-details">
          <div className="profile-detail"><dt>Authentication</dt><dd><span className="security-value">JWT protected</span></dd></div>
          <div className="profile-detail"><dt>Session</dt><dd>Stateless</dd></div>
          <div className="profile-detail"><dt>API access</dt><dd><span className="security-value">Authenticated</span></dd></div>
        </dl>
        <p className="security-note">Your access token and credentials are never displayed on this page.</p>
      </section>
    </div>}
  </AppShell>;
}

export default Profile;