import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  RotateCw, 
  LogOut, 
  Sparkles,
  Server,
  CheckCircle2
} from "lucide-react";
import AppShell from "../components/AppShell";
import { ErrorState, LoadingSkeleton, PageHeader } from "../components/Feedback";
import { useToast } from "../components/ToastContext";
import { api, getAuthMe, getErrorMessage, persistSession } from "../services/api";

function Profile({ username, onLogout }) {
  const showToast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [switchingRole, setSwitchingRole] = useState(false);

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

  const handleQuickSwitch = async (targetUsername, targetPassword) => {
    setSwitchingRole(true);
    try {
      const { data: authResponse } = await api.post("/auth/login", {
        username: targetUsername,
        password: targetPassword,
      });

      const token = typeof authResponse === "string" ? authResponse : authResponse?.token;
      persistSession(token, { username: targetUsername });

      const profileRes = await api.get("/auth/me");
      persistSession(token, profileRes.data);
      setProfile(profileRes.data);
      showToast(`Switched identity to ${targetUsername} (${profileRes.data.role}).`);
      window.location.reload();
    } catch (err) {
      showToast(`Role switch failed: ${getErrorMessage(err)}`, "error");
    } finally {
      setSwitchingRole(false);
    }
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
        eyebrow="USER IDENTITY / AUTHORIZATION"
        title="Account & Security Profile"
        description="Verified JWT credentials, role permissions, and session access control details."
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
                    {normalizedRole}
                  </span>
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {profile.email || "No email on record"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  <div className="status-dot" />
                  <span style={{ fontSize: "0.74rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    Active Session • JWT Authenticated
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
                Identity Attributes
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>User Identifier</span>
                  <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>#{profile.userId}</strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>Granted Authority</span>
                  <strong style={{ fontSize: "1rem", color: "var(--accent-blue)" }}>ROLE_{normalizedRole}</strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>Database Table</span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>resolvenow_db.users</strong>
                </div>

                <div style={{ background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block" }}>Ingress Gateway</span>
                  <strong style={{ fontSize: "0.9rem", color: "var(--accent-emerald)" }}>Port 8080 (Active)</strong>
                </div>
              </div>
            </div>

            {/* Quick Role Switcher for Hackathon Demonstrations */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08))",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Sparkles size={18} style={{ color: "var(--accent-purple)" }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  Live Evaluator Role Switcher
                </h3>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Instantly switch roles to demonstrate RBAC and interface adaptivity for hackathon judges:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <button
                  className="btn btn-secondary btn-small"
                  type="button"
                  disabled={switchingRole || (profile.username === "hackathon_test_user")}
                  onClick={() => handleQuickSwitch("hackathon_test_user", "password12345")}
                >
                  Switch to User
                </button>

                <button
                  className="btn btn-secondary btn-small"
                  type="button"
                  disabled={switchingRole || (profile.username === "staff_demo")}
                  onClick={() => handleQuickSwitch("staff_demo", "password12345")}
                >
                  Switch to Staff
                </button>

                <button
                  className="btn btn-secondary btn-small"
                  type="button"
                  disabled={switchingRole || (profile.username === "admin_demo")}
                  onClick={() => handleQuickSwitch("admin_demo", "password12345")}
                >
                  Switch to Admin
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Security Architecture */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <h3 style={{ fontSize: "1.05rem" }}>Security Standards & Token Telemetry</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.84rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Token Architecture:</span>
                  <strong style={{ color: "var(--text-primary)" }}>HMAC-SHA256 (JJWT 0.12.6)</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Password Encryption:</span>
                  <strong style={{ color: "var(--text-primary)" }}>BCrypt Adaptive Hashing</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Session Persistence:</span>
                  <strong style={{ color: "var(--accent-emerald)" }}>Stateless REST Bearer Token</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Service Communication:</span>
                  <strong style={{ color: "var(--accent-indigo)" }}>Internal Service Secret Header</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Token Expiration:</span>
                  <strong style={{ color: "var(--text-primary)" }}>24 Hours (86,400,000 ms)</strong>
                </div>
              </div>
            </div>

            {/* Cloud Microservices Architecture Card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Server size={18} style={{ color: "var(--accent-blue)" }} />
                <h4 style={{ fontSize: "0.95rem" }}>Service Mesh Infrastructure</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                  <span>Eureka Service Discovery on port 8761</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                  <span>Spring Cloud Gateway MVC Routing on port 8080</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                  <span>Transactional Outbox Pattern for notification delivery</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                  <span>PostgreSQL 17 on port 5433 with schema isolation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Profile;