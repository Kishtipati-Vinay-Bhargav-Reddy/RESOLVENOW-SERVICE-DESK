import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Clock 
} from "lucide-react";
import { api, clearSession, getErrorMessage, persistSession } from "../services/api";

function Login({ onLogin, initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = initialMode !== "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(() => location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { data: authResponse } = await api.post("/auth/login", { 
          username: username.trim(), 
          password 
        });

        const token = typeof authResponse === "string"
          ? authResponse.trim()
          : authResponse?.token || authResponse?.accessToken;

        if (typeof token !== "string" || !token.trim()) {
          throw new Error("Authentication failed: No valid token returned.");
        }

        persistSession(token, { username: username.trim() });
        
        let authenticatedUser;
        try {
          const profileResponse = await api.get("/auth/me");
          authenticatedUser = profileResponse.data;
        } catch (profileError) {
          clearSession();
          throw new Error(`Sign in succeeded, but profile could not be loaded: ${getErrorMessage(profileError)}`);
        }

        if (!authenticatedUser || !authenticatedUser.userId || !authenticatedUser.role) {
          clearSession();
          throw new Error("Invalid profile payload received. Please retry.");
        }

        persistSession(token, authenticatedUser);
        onLogin(authenticatedUser);
      } else {
        await api.post("/auth/register", { 
          username: username.trim(), 
          email: email.trim(), 
          password,
          role 
        });
        navigate("/login", { 
          state: { message: "Account created successfully! Sign in to enter your workspace." }, 
          replace: true 
        });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <main className="auth-page">
      {/* Left Column: Enterprise Hero Panel */}
      <section className="auth-hero-panel">
        <div className="auth-hero-brand">
          <div className="brand-mark">RN</div>
          <div>
            <strong style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>ResolveNow</strong>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.08em", display: "block" }}>
              ENTERPRISE ISSUE ESCALATION SYSTEM
            </span>
          </div>
        </div>

        <div className="auth-hero-copy">
          <span className="role-badge-header role-badge-admin">
            <Sparkles size={12} /> Cloud-Native Microservices Architecture
          </span>
          <h1>Mission-critical service desk management.</h1>
          <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px" }}>
            Decoupled microservice platform built for automated grievance logging, transparent department dispatch, and strict SLA compliance.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-item-icon">
                <Layers size={18} />
              </div>
              <div>
                <strong>Intelligent Department Dispatch</strong>
                <small>Auto-assignment across IT, HR, Finance, and Operations teams.</small>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-item-icon">
                <Clock size={18} />
              </div>
              <div>
                <strong>Real-Time SLA & Escalation Engine</strong>
                <small>Calculated SLA deadlines (4h to 72h) with multi-level ticket escalation.</small>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-item-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>JWT & RBAC Security Standard</strong>
                <small>Strict role-based isolation for Employees, Support Agents, and Administrators.</small>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
          <span>Powered by Spring Boot 4 & Eureka Discovery</span>
          <span>Port 8080 API Gateway</span>
        </div>
      </section>

      {/* Right Column: Glassmorphic Auth Form */}
      <section className="auth-form-panel">
        <div className="auth-card">
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-blue)", textTransform: "uppercase" }}>
              {isLogin ? "WORKSPACE AUTHENTICATION" : "CREATE NEW ACCOUNT"}
            </span>
            <h2 style={{ fontSize: "1.65rem", marginTop: "4px" }}>
              {isLogin ? "Sign in to ResolveNow" : "Register your account"}
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              {isLogin 
                ? "Enter your credentials or use the 1-click demo accounts below." 
                : "Create an employee account to start logging service grievances."}
            </p>
          </div>

          {/* Quick Demo Logins for Hackathon Evaluators */}
          {isLogin && (
            <div className="quick-demo-accounts">
              <p>Demo Profiles (1-Click Fill):</p>
              <div className="quick-demo-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => handleQuickDemoLogin("hackathon_test_user", "password12345")}
                  title="Sign in as Employee"
                >
                  👤 User
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => handleQuickDemoLogin("staff_demo", "password12345")}
                  title="Sign in as Support Staff"
                >
                  🛠️ Staff
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => handleQuickDemoLogin("admin_demo", "password12345")}
                  title="Sign in as System Administrator"
                >
                  🛡️ Admin
                </button>
              </div>
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", color: "#34D399", fontSize: "0.85rem" }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", color: "#FDA4AF", fontSize: "0.85rem" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <div style={{ position: "relative" }}>
                <input
                  id="auth-username"
                  className="form-control"
                  style={{ paddingLeft: "38px" }}
                  type="text"
                  autoComplete="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="auth-email">Corporate Email Address</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="auth-email"
                    className="form-control"
                    style={{ paddingLeft: "38px" }}
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="form-group">
                <label>Account Role & Permissions</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className={`btn ${role === "USER" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setRole("USER")}
                    style={{ padding: "10px 12px", fontSize: "0.85rem", justifyContent: "center" }}
                  >
                    👤 Employee (USER)
                  </button>
                  <button
                    type="button"
                    className={`btn ${role === "STAFF" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setRole("STAFF")}
                    style={{ padding: "10px 12px", fontSize: "0.85rem", justifyContent: "center" }}
                  >
                    🛠️ Support Staff (STAFF)
                  </button>
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", marginTop: "4px", display: "block" }}>
                  {role === "USER"
                    ? "Allows lodging grievances, tracking issue status, and viewing SLA progress."
                    : "Allows handling departmental ticket queues, reassigning, and updating statuses."}
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="auth-password"
                  className="form-control"
                  style={{ paddingLeft: "38px", paddingRight: "38px" }}
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? "Enter password" : "At least 8 characters"}
                  minLength={isLogin ? undefined : 8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <button
                  type="button"
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", marginTop: "4px", display: "block" }}>
                  Security rule: Minimum 8 characters required.
                </small>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? "Authenticating..." 
                : isLogin ? "Sign in to Dashboard" : "Complete Registration"}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "0.84rem", color: "var(--text-muted)" }}>
            {isLogin ? (
              <span>
                Need a new workspace account?{" "}
                <Link to="/register" style={{ fontWeight: 600 }}>Create account</Link>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <Link to="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;