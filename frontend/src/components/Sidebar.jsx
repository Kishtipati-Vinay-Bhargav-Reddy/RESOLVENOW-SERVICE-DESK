import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Bell, 
  User, 
  X, 
  LogOut 
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets & Issues", path: "/complaints", icon: FileText, badge: "Live" },
  { label: "Task Assignments", path: "/assignments", icon: Layers },
  { label: "Alerts & Notifications", path: "/notifications", icon: Bell },
  { label: "User Profile", path: "/profile", icon: User },
];

function Sidebar({ activeItem, onLogout, mobileOpen, onClose, sidebarRef }) {
  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      aria-label="Application navigation"
      role={mobileOpen ? "dialog" : undefined}
      aria-modal={mobileOpen ? "true" : undefined}
    >
      <div>
        <div className="sidebar-heading">
          <span>Enterprise Navigation</span>
          <button
            type="button"
            className="sidebar-close icon-button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <nav aria-label="Primary navigation">
          {navigation.map(({ label, path, icon: IconComponent, badge }) => (
            <NavLink
              className={({ isActive }) =>
                `nav-item ${isActive || activeItem === label ? "active" : ""}`
              }
              key={label}
              to={path}
              onClick={onClose}
            >
              <IconComponent size={18} />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="system-status-indicator">
          <div className="status-dot" />
          <div>
            <strong>Microservices Active</strong>
            <small>All 5 Services Operational</small>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-small"
          style={{ width: "100%", justifyContent: "flex-start", gap: "10px", color: "var(--text-muted)" }}
          type="button"
          onClick={onLogout}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
