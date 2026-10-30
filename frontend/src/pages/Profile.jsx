import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  RotateCw, 
  LogOut, 
  User, 
  Mail, 
  CheckCircle2, 
  Bell, 
  Shield
} from "lucide-react";
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

  // Notification Preferences (Client-side toggles)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);

  useEffect(() => {
    let active = true;
    getAuthMe()
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((v) => v + 1);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    showToast("Notification preferences updated successfully.");
  };

  const normalizedRole = String(profile?.role || "USER").toUpperCase();

  return (
    <AppShell
      activeItem="Profile"
      username={profile?.username || username}
      role={profile?.role}
      onLogout={onLogout}
    >
      <PageHeader
        eyebrow="USER ACCOUNT"
        title="Profile & Security Settings"
        description="Manage your account profile, role permissions, and notification preferences."
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading}>
              <RotateCw size={15} className={loading ? "spin-slow" : ""} />
              <span>Refresh Profile</span>
            </button>
            <button className="btn btn-danger" type="button" onClick={onLogout}>
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Unable to retrieve profile" detail={error} onRetry={refresh} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : profile && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
          {/* Left Column: Identity & Access */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Identity Card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)",
                  flexShrink: 0,
                }}
              >
                {profile.username ? profile.username.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "1.45rem", fontWeight: 700 }}>{profile.username}</h2>
                  <span
                    className={`badge ${
                      normalizedRole === "ADMIN"
                        ? "role-badge-admin"
                        : normalizedRole === "STAFF"
                        ? "role-badge-staff"
                        : "role-badge-user"
                    }`}
                  >
                    {normalizedRole === "ADMIN" ? "Administrator" : normalizedRole === "STAFF" ? "Support Agent" : "Employee"}
                  </span>
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {profile.email || "No corporate email on record"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  <div className="status-dot status-dot-live" />
                  <span style={{ fontSize: "0.74rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    Active Workspace Account
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Attributes Card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Account Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <User size={12} /> Username
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "2px", display: "block" }}>
                    {profile.username}
                  </strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Mail size={12} /> Corporate Email
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "2px", display: "block" }}>
                    {profile.email || "N/A"}
                  </strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Shield size={12} /> Role Designation
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--accent-blue)", marginTop: "2px", display: "block" }}>
                    {normalizedRole}
                  </strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> Account Status
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--accent-emerald)", marginTop: "2px", display: "block" }}>
                    Verified &amp; Active
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Security & Notifications */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Security Standards Card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={20} style={{ color: "var(--accent-emerald)" }} />
                <h3 style={{ fontSize: "1.05rem" }}>Security &amp; Authentication</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.84rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Session Protocol:</span>
                  <strong style={{ color: "var(--text-primary)" }}>Encrypted Token Authentication</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Password Security:</span>
                  <strong style={{ color: "var(--text-primary)" }}>BCrypt One-Way Cryptographic Hash</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Session State:</span>
                  <strong style={{ color: "var(--accent-emerald)" }}>Active Session</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Access Scope:</span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {normalizedRole === "ADMIN" ? "Global System Operations" : normalizedRole === "STAFF" ? "Departmental Queues" : "Employee Portal"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Notification Preferences Card */}
            <form
              onSubmit={handleSavePreferences}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Bell size={18} style={{ color: "var(--accent-blue)" }} />
                <h4 style={{ fontSize: "0.95rem" }}>Notification Preferences</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.84rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={inAppAlerts}
                    onChange={(e) => setInAppAlerts(e.target.checked)}
                  />
                  <span>In-App Real-Time Alerts for status changes</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span>Email notifications on ticket assignment &amp; resolution</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={slaAlerts}
                    onChange={(e) => setSlaAlerts(e.target.checked)}
                  />
                  <span>High-priority SLA deadline &amp; escalation warnings</span>
                </label>
              </div>

              <button type="submit" className="btn btn-secondary btn-small" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
                Save Preferences
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Profile;