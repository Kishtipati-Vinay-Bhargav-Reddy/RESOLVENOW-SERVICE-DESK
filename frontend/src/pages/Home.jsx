import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Server,
  Clock,
  ArrowRight,
  Layers,
  Users,
  Activity,
  Terminal,
  ChevronRight,
  Check,
  Sparkles
} from "lucide-react";
import { api, persistSession } from "../services/api";

function Home({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const [loggingInAs, setLoggingInAs] = useState(null);
  const [demoError, setDemoError] = useState("");

  const handleQuickLogin = async (username, password, fallbackRole = "USER") => {
    setLoggingInAs(username);
    setDemoError("");
    try {
      const { data: authResponse } = await api.post("/auth/login", { username, password });
      const token = typeof authResponse === "string" ? authResponse : authResponse?.token;
      if (!token) throw new Error("No token returned");

      persistSession(token, { username });

      let profileData;
      try {
        const { data: me } = await api.get("/auth/me");
        profileData = me;
      } catch {
        profileData = { username, role: authResponse.role || fallbackRole, userId: authResponse.userId };
      }

      persistSession(token, profileData);
      if (onLogin) onLogin(profileData);
      navigate("/dashboard");
    } catch (err) {
      setDemoError(`Login failed for ${username}: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoggingInAs(null);
    }
  };

  const services = [
    { name: "API Gateway", port: 8080, role: "Ingress Routing & JWT Verification", status: "ONLINE", tech: "Spring Cloud Gateway WebMVC" },
    { name: "Eureka Registry", port: 8761, role: "Service Discovery & Load Balancing", status: "ONLINE", tech: "Netflix Eureka Server" },
    { name: "Auth Service", port: 8081, role: "HMAC-SHA JWT & RBAC Access Control", status: "ONLINE", tech: "Spring Security & BCrypt" },
    { name: "Complaint Service", port: 8082, role: "Grievance Intake & SLA Engine", status: "ONLINE", tech: "Transactional Outbox Pattern" },
    { name: "Assignment Service", port: 8083, role: "Automated Department Task Dispatch", status: "ONLINE", tech: "Dynamic Workload Balancing" },
    { name: "Notification Service", port: 8084, role: "Event-Driven Real-Time Alerts", status: "ONLINE", tech: "Asynchronous Progress Push" }
  ];

  const slaPolicies = [
    { level: "CRITICAL", hours: "4 Hours", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)", desc: "Total system outage, severe data corruption, or executive escalation." },
    { level: "HIGH", hours: "24 Hours", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", desc: "Core workflow impaired, department-wide network or server degradation." },
    { level: "MEDIUM", hours: "48 Hours", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", desc: "Non-blocking issue, individual software glitch, standard access request." },
    { level: "LOW", hours: "72 Hours", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", desc: "General IT inquiry, equipment upgrade, or minor UI feedback." }
  ];

  return (
    <div className="home-container">
      {/* Top Enterprise Navigation */}
      <header className="home-nav">
        <div className="home-nav-inner">
          <Link to="/" className="home-brand">
            <div className="brand-mark">RN</div>
            <div>
              <span className="home-brand-title">ResolveNow</span>
              <span className="home-brand-tag">SERVICE DESK PLATFORM</span>
            </div>
          </Link>

          <nav className="home-nav-links">
            <a href="#architecture">Architecture</a>
            <a href="#workflows">Workflows</a>
            <a href="#sla">SLA Policies</a>
            <a href="#demo">Live Test Accounts</a>
          </nav>

          <div className="home-nav-actions">
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="role-badge-header role-badge-user">
                  <span className="status-dot status-dot-live"></span>
                  {user.username} ({user.role})
                </span>
                <Link to="/dashboard" className="btn btn-primary btn-small">
                  Workspace <ChevronRight size={14} />
                </Link>
                <button type="button" onClick={onLogout} className="btn btn-secondary btn-small">
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link to="/login" className="btn btn-secondary btn-small">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-small">
                  Create Account <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-glow"></div>
        <div className="home-hero-content">
          <div className="home-pill">
            <Sparkles size={14} style={{ color: "#38bdf8" }} />
            <span>SOA Programming & Decoupled Microservices • PS027</span>
          </div>

          <h1 className="home-hero-title">
            Enterprise Issue Escalation &amp; <br />
            <span className="gradient-text">Automated Service Desk System</span>
          </h1>

          <p className="home-hero-desc">
            A high-availability microservices platform designed for high-volume customer grievances.
            Automates complaint intake, performs transparent department assignment across IT, HR, and Finance,
            and delivers real-time progress alerts with strict SLA tracking.
          </p>

          <div className="home-hero-cta">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Open My Dashboard <ChevronRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In to Workspace
                </Link>
              </>
            )}
            <a href="#demo" className="btn btn-ghost btn-large">
              1-Click Demo Profiles <Terminal size={16} />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <span className="home-stat-number">6</span>
              <span className="home-stat-label">Microservice Nodes</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">100%</span>
              <span className="home-stat-label">Automated Triage</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">4h - 72h</span>
              <span className="home-stat-label">Dynamic SLA Timers</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">Zero</span>
              <span className="home-stat-label">Single Points of Failure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live 1-Click Interactive Test Section (Highlighting user1, user2, staff1) */}
      <section id="demo" className="home-section demo-section">
        <div className="section-header">
          <span className="section-eyebrow">VERIFIED TEST ACCOUNTS</span>
          <h2>Instant 1-Click Testing Workspace</h2>
          <p>Switch identities instantly to verify role-based permissions and microservice workflows.</p>
        </div>

        {demoError && (
          <div style={{ maxWidth: "600px", margin: "0 auto 20px auto", padding: "12px 16px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", color: "#fda4af", fontSize: "0.85rem", textAlign: "center" }}>
            {demoError}
          </div>
        )}

        <div className="demo-cards-grid">
          {/* User 1 */}
          <div className="demo-profile-card">
            <div className="demo-card-badge role-badge-user">EMPLOYEE / USER</div>
            <h3>user1</h3>
            <p className="demo-email">user1@gmail.com</p>
            <ul className="demo-features">
              <li><Check size={14} color="#10b981" /> Log customer grievances</li>
              <li><Check size={14} color="#10b981" /> Monitor real-time SLA countdowns</li>
              <li><Check size={14} color="#10b981" /> Receive outbox push notifications</li>
            </ul>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={loggingInAs === "user1"}
              onClick={() => handleQuickLogin("user1", "Password@123", "USER")}
            >
              {loggingInAs === "user1" ? "Signing In..." : "Launch as user1"}
              <ChevronRight size={16} />
            </button>
          </div>

          {/* User 2 */}
          <div className="demo-profile-card">
            <div className="demo-card-badge role-badge-user">EMPLOYEE / USER</div>
            <h3>user2</h3>
            <p className="demo-email">user2@gmail.com</p>
            <ul className="demo-features">
              <li><Check size={14} color="#10b981" /> Has active Ticket #26 ("network issue")</li>
              <li><Check size={14} color="#10b981" /> Track full audit trail &amp; history</li>
              <li><Check size={14} color="#10b981" /> Verify closed ticket resolution</li>
            </ul>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={loggingInAs === "user2"}
              onClick={() => handleQuickLogin("user2", "Password@123", "USER")}
            >
              {loggingInAs === "user2" ? "Signing In..." : "Launch as user2"}
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Staff 1 */}
          <div className="demo-profile-card featured-demo-card">
            <div className="demo-card-badge role-badge-staff">SUPPORT STAFF</div>
            <h3>staff1</h3>
            <p className="demo-email">staff1@gmail.com</p>
            <ul className="demo-features">
              <li><Check size={14} color="#10b981" /> Access departmental queue console</li>
              <li><Check size={14} color="#10b981" /> Advance ticket status state machine</li>
              <li><Check size={14} color="#10b981" /> Reassign tickets across agents</li>
            </ul>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
              disabled={loggingInAs === "staff1"}
              onClick={() => handleQuickLogin("staff1", "Password@123", "STAFF")}
            >
              {loggingInAs === "staff1" ? "Signing In..." : "Launch as staff1"}
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Admin Demo */}
          <div className="demo-profile-card">
            <div className="demo-card-badge role-badge-admin">SYSTEM ADMIN</div>
            <h3>admin_demo</h3>
            <p className="demo-email">admin@resolvenow.com</p>
            <ul className="demo-features">
              <li><Check size={14} color="#10b981" /> Global cross-department oversight</li>
              <li><Check size={14} color="#10b981" /> Multi-level escalation management</li>
              <li><Check size={14} color="#10b981" /> System-wide analytics &amp; audit logging</li>
            </ul>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={loggingInAs === "admin_demo"}
              onClick={() => handleQuickLogin("admin_demo", "password12345", "ADMIN")}
            >
              {loggingInAs === "admin_demo" ? "Signing In..." : "Launch as Admin"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Microservice Architecture Topology */}
      <section id="architecture" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">SYSTEM ARCHITECTURE</span>
          <h2>Cloud-Native SOA &amp; Microservices Topology</h2>
          <p>Decoupled, independently scalable Spring Boot microservices discovered via Netflix Eureka.</p>
        </div>

        <div className="services-grid">
          {services.map((svc) => (
            <div key={svc.name} className="service-card">
              <div className="service-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Server size={18} style={{ color: "#38bdf8" }} />
                  <strong>{svc.name}</strong>
                </div>
                <span className="status-pill status-pill-online">
                  <span className="status-dot"></span> Port {svc.port}
                </span>
              </div>
              <p className="service-role">{svc.role}</p>
              <div className="service-tech">
                <Terminal size={12} />
                <span>{svc.tech}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="architecture-diagram-card">
          <div className="diagram-step">
            <div className="diagram-icon"><Users size={20} /></div>
            <strong>Web Client</strong>
            <span>React 19 + Vite</span>
          </div>
          <div className="diagram-arrow"><ChevronRight size={20} /></div>
          <div className="diagram-step highlight-step">
            <div className="diagram-icon"><ShieldCheck size={20} /></div>
            <strong>API Gateway :8080</strong>
            <span>Ingress &amp; JWT Route Guard</span>
          </div>
          <div className="diagram-arrow"><ChevronRight size={20} /></div>
          <div className="diagram-step">
            <div className="diagram-icon"><Activity size={20} /></div>
            <strong>Eureka Registry :8761</strong>
            <span>Dynamic Discovery &amp; LB</span>
          </div>
          <div className="diagram-arrow"><ChevronRight size={20} /></div>
          <div className="diagram-step highlight-step">
            <div className="diagram-icon"><Layers size={20} /></div>
            <strong>Core Services</strong>
            <span>Auth • Complaint • Assign • Notify</span>
          </div>
        </div>
      </section>

      {/* End-to-End Workflows */}
      <section id="workflows" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">AUTOMATED WORKFLOWS</span>
          <h2>Complaint Lifecycle &amp; State Machine</h2>
          <p>Enforcing strict business transitions from complaint intake to verified closure.</p>
        </div>

        <div className="workflows-timeline">
          <div className="workflow-step">
            <div className="step-badge">Step 1</div>
            <h4>Grievance Intake</h4>
            <p>Customer or employee logs grievance specifying category, department, and priority. SLA deadline is calculated immediately.</p>
            <span className="step-tag status-open">Status: OPEN</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Step 2</div>
            <h4>Automated Dispatch</h4>
            <p>Inter-service event dispatches ticket to assignment service. Routed to specialized department queue (IT, HR, Finance).</p>
            <span className="step-tag status-assigned">Status: ASSIGNED</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Step 3</div>
            <h4>Active Investigation</h4>
            <p>Support staff claims ticket, marks work in progress, and diagnoses the root cause while SLA countdown is live.</p>
            <span className="step-tag status-inprogress">Status: IN PROGRESS</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Step 4</div>
            <h4>Resolution &amp; Alerts</h4>
            <p>Remediation applied, user notified via asynchronous outbox event, and complaint officially transitioned to CLOSED.</p>
            <span className="step-tag status-closed">Status: RESOLVED &amp; CLOSED</span>
          </div>
        </div>
      </section>

      {/* SLA Policy Breakdown */}
      <section id="sla" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">SLA POLICY MATRIX</span>
          <h2>Guaranteed Resolution Deadlines</h2>
          <p>Every grievance is governed by hard SLA timers. Missed deadlines trigger automatic multi-level escalation.</p>
        </div>

        <div className="sla-cards-grid">
          {slaPolicies.map((sla) => (
            <div key={sla.level} className="sla-card" style={{ borderColor: sla.color }}>
              <div className="sla-card-top">
                <span className="sla-badge" style={{ color: sla.color, background: sla.bg }}>
                  {sla.level}
                </span>
                <div className="sla-hours" style={{ color: sla.color }}>
                  <Clock size={16} />
                  <strong>{sla.hours}</strong>
                </div>
              </div>
              <p className="sla-desc">{sla.desc}</p>
              <div className="sla-footer">
                <span className="sla-target">Resolution Target: &le; {sla.hours}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home-cta-banner">
        <h2>Ready to explore ResolveNow Service Desk?</h2>
        <p>Sign in using the verified test accounts or register a new workspace profile in seconds.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          <Link to="/login" className="btn btn-primary btn-large">
            Open Service Desk <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-secondary btn-large">
            Create New Account
          </Link>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div>
            <div className="brand-lockup">
              <div className="brand-mark">RN</div>
              <div>
                <strong>ResolveNow Service Desk</strong>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  PS027 • Enterprise Issue Escalation System
                </span>
              </div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "10px", maxWidth: "340px" }}>
              Architected with Spring Boot 4, Netflix Eureka, Spring Cloud Gateway, and PostgreSQL.
            </p>
          </div>

          <div className="footer-links-group">
            <strong>Architecture</strong>
            <a href="http://localhost:8761" target="_blank" rel="noreferrer">Eureka Registry (:8761)</a>
            <a href="http://localhost:8080/api/auth/me" target="_blank" rel="noreferrer">API Gateway (:8080)</a>
            <a href="http://localhost:8082/api/complaints" target="_blank" rel="noreferrer">Complaint Service (:8082)</a>
          </div>

          <div className="footer-links-group">
            <strong>Quick Portals</strong>
            <Link to="/login">Employee Login</Link>
            <Link to="/login">Support Agent Console</Link>
            <Link to="/register">Register New Account</Link>
          </div>

          <div className="footer-links-group">
            <strong>Security &amp; SLA</strong>
            <span>HMAC-SHA JWT Tokens</span>
            <span>BCrypt Cryptographic Hashes</span>
            <span>Outbox Notification Dispatch</span>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>&copy; {new Date().getFullYear()} ResolveNow Enterprise Systems. All rights reserved.</span>
          <span>Course Mapped: 24SDCS03R - SOA Programming and Microservices</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
