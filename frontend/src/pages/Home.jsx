import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Layers,
  Users,
  Sparkles,
  ChevronRight,
  Headphones,
  CheckCircle2,
  Bell,
  Briefcase,
  Cpu,
  TrendingUp,
  FileText
} from "lucide-react";

function Home({ user, onLogout }) {
  const slaPolicies = [
    { level: "CRITICAL", hours: "4 Hours", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)", desc: "Severe outage, security incident, or business-critical blocker." },
    { level: "HIGH", hours: "24 Hours", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", desc: "Department-wide disruption or core system degradation." },
    { level: "MEDIUM", hours: "48 Hours", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", desc: "Standard inquiry, software access, or non-blocking defect." },
    { level: "STANDARD", hours: "72 Hours", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", desc: "General IT service request, equipment upgrade, or feedback." }
  ];

  const features = [
    {
      icon: <Layers size={22} color="#38bdf8" />,
      title: "Intelligent Department Dispatch",
      desc: "Instantly categorizes and routes grievance tickets to specialized IT, HR, Finance, or Operations queues without manual intervention."
    },
    {
      icon: <Clock size={22} color="#f59e0b" />,
      title: "Dynamic SLA Management",
      desc: "Calculates strict resolution deadlines (4h to 72h) based on issue priority with automatic breach warnings."
    },
    {
      icon: <TrendingUp size={22} color="#f43f5e" />,
      title: "Multi-Tier Escalation Matrix",
      desc: "Automatically escalates unresolved blockers through management tiers with required rationale and incident tracking."
    },
    {
      icon: <Bell size={22} color="#818cf8" />,
      title: "Real-Time Progress Alerts",
      desc: "Asynchronous notification engine pushes instant updates to users when tickets are assigned, investigated, or resolved."
    },
    {
      icon: <ShieldCheck size={22} color="#34d399" />,
      title: "Enterprise Access Control",
      desc: "Role-based isolation ensuring secure, scoped access for Employees, Support Agents, and Department Administrators."
    },
    {
      icon: <FileText size={22} color="#c084fc" />,
      title: "Complete Audit Trail",
      desc: "Immutable timeline logging of every status transition, assignment change, and escalation note for full compliance."
    }
  ];

  const solutions = [
    { dept: "IT & Infrastructure", icon: <Cpu size={20} />, examples: "Network outages, hardware failures, software licensing, VPN access" },
    { dept: "Human Resources", icon: <Users size={20} />, examples: "Payroll queries, benefits administration, policy clarifications, onboarding" },
    { dept: "Finance & Accounting", icon: <Briefcase size={20} />, examples: "Vendor invoicing, expense reimbursements, billing anomalies, purchase approvals" },
    { dept: "Operations & Facilities", icon: <Headphones size={20} />, examples: "Office access, hardware provisioning, workplace maintenance, logistics" }
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
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#workflows">Workflow</a>
            <a href="#sla">SLA Policies</a>
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
                  Get Started <ArrowRight size={14} />
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
            <span>Next-Generation Enterprise Service Desk</span>
          </div>

          <h1 className="home-hero-title">
            Intelligent Issue Resolution.<br />
            <span className="gradient-text">Zero SLA Breaches.</span>
          </h1>

          <p className="home-hero-desc">
            An automated service desk platform built to intake customer grievances, 
            dispatch tickets transparently across specialized departments, 
            and enforce strict SLA compliance with real-time progress alerts.
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
          </div>

          {/* Metrics Banner */}
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <span className="home-stat-number">99.8%</span>
              <span className="home-stat-label">SLA Target Compliance</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">&lt; 60s</span>
              <span className="home-stat-label">Automated Triage Speed</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">4 Tiers</span>
              <span className="home-stat-label">Proactive Escalation Levels</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-number">100%</span>
              <span className="home-stat-label">Audit Trail Visibility</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section id="features" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">ENTERPRISE CAPABILITIES</span>
          <h2>Engineered for Fast-Moving Organizations</h2>
          <p>Everything your teams need to resolve grievances quickly, transparently, and consistently.</p>
        </div>

        <div className="services-grid">
          {features.map((feat) => (
            <div key={feat.title} className="service-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <div style={{ padding: "8px", background: "rgba(56, 189, 248, 0.08)", borderRadius: "8px" }}>
                  {feat.icon}
                </div>
                <strong style={{ fontSize: "1.05rem", color: "#FFFFFF" }}>{feat.title}</strong>
              </div>
              <p className="service-role" style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Department Solutions */}
      <section id="solutions" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">DEPARTMENT WORKSPACES</span>
          <h2>Tailored for Every Enterprise Function</h2>
          <p>Dedicated queues ensure issues reach specialists who can solve them immediately.</p>
        </div>

        <div className="solutions-grid">
          {solutions.map((sol) => (
            <div key={sol.dept} className="solution-card">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#38bdf8" }}>
                {sol.icon}
                <strong style={{ fontSize: "1.1rem", color: "#FFFFFF" }}>{sol.dept}</strong>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, flex: 1, margin: 0 }}>
                {sol.examples}
              </p>
              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--accent-blue)" }}>
                <CheckCircle2 size={14} /> Automated Queue Triage
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* End-to-End Workflow */}
      <section id="workflows" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">TICKET LIFECYCLE</span>
          <h2>Automated Resolution Pipeline</h2>
          <p>Strict state machine enforcement ensures no grievance falls through the cracks.</p>
        </div>

        <div className="workflows-timeline">
          <div className="workflow-step">
            <div className="step-badge">Stage 1</div>
            <h4>Grievance Intake</h4>
            <p>Employees log grievances specifying description, category, and urgency. Dynamic SLA deadlines lock in immediately.</p>
            <span className="step-tag status-open">Status: OPEN</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Stage 2</div>
            <h4>Smart Dispatch</h4>
            <p>Ticket is automatically routed to the specialized departmental queue with round-robin load distribution.</p>
            <span className="step-tag status-assigned">Status: ASSIGNED</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Stage 3</div>
            <h4>Active Resolution</h4>
            <p>Support staff claims the ticket, investigates the root cause, and communicates progress while SLA timers run.</p>
            <span className="step-tag status-inprogress">Status: IN PROGRESS</span>
          </div>
          <div className="workflow-step">
            <div className="step-badge">Stage 4</div>
            <h4>Verified Closure</h4>
            <p>Remediation applied, progress alerts delivered to the user, and verified closure permanently recorded in audit logs.</p>
            <span className="step-tag status-closed">Status: RESOLVED &amp; CLOSED</span>
          </div>
        </div>
      </section>

      {/* SLA Policy Breakdown */}
      <section id="sla" className="home-section">
        <div className="section-header">
          <span className="section-eyebrow">GUARANTEED SLA TIERS</span>
          <h2>Hard Turnaround Commitments</h2>
          <p>Every grievance is governed by strict resolution SLAs. Nearing deadlines trigger automatic escalation.</p>
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
                <span className="sla-target">Resolution SLA: &le; {sla.hours}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="home-cta-banner">
        <h2>Modernize your service operations today.</h2>
        <p>Deliver faster issue resolution, transparent department dispatch, and 99.8% SLA adherence.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          <Link to="/register" className="btn btn-primary btn-large">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-large">
            Sign In to Workspace
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
                  Enterprise Issue Escalation System
                </span>
              </div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "12px", maxWidth: "340px", lineHeight: 1.6 }}>
              A modern service desk platform designed for automated complaint logging, department assignment, and strict SLA compliance.
            </p>
          </div>

          <div className="footer-links-group">
            <strong>Product</strong>
            <a href="#features">Platform Features</a>
            <a href="#solutions">Department Queues</a>
            <a href="#sla">SLA Policies</a>
            <a href="#workflows">Ticket Lifecycle</a>
          </div>

          <div className="footer-links-group">
            <strong>Solutions</strong>
            <span>IT Service Desk</span>
            <span>HR Grievance Portal</span>
            <span>Finance Inquiries</span>
            <span>Operations Desk</span>
          </div>

          <div className="footer-links-group">
            <strong>Access</strong>
            <Link to="/login">Employee Sign In</Link>
            <Link to="/login">Support Agent Console</Link>
            <Link to="/register">Create Workspace Account</Link>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>&copy; {new Date().getFullYear()} ResolveNow Enterprise Systems Inc. All rights reserved.</span>
          <span>Enterprise Service Desk &amp; Escalation Standard</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
