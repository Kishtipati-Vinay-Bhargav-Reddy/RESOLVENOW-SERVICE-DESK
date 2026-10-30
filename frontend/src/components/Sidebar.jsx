import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const navigation = [
  ["Dashboard", "/dashboard", "dashboard"],
  ["Complaints", "/complaints", "complaints"],
  ["Assignments", "/assignments", "assignments"],
  ["Notifications", "/notifications", "notifications"],
  ["Profile", "/profile", "profile"],
];

function Sidebar({ activeItem, onLogout, mobileOpen, onClose, sidebarRef }) {
  return (
    <aside ref={sidebarRef} className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Application navigation"
      role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen ? "true" : undefined}>
      <div className="sidebar-heading"><span>WORKSPACE</span><button type="button" className="sidebar-close" aria-label="Close navigation" onClick={onClose}><Icon name="close" /></button></div>
      <nav aria-label="Primary navigation">
        {navigation.map(([label, path, icon]) => (
          <NavLink className={({ isActive }) => `nav-item ${isActive || activeItem === label ? "active" : ""}`}
            key={label} to={path} onClick={onClose} end={label === "Complaints"}>
            <Icon name={icon} size={19} />
            <span>{label}</span>
            {label === "Complaints" && <span className="nav-shortcut">01</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-support"><span className="support-indicator" /><span><strong>All systems operational</strong><small>Service desk online</small></span></div>
        <button className="nav-item sidebar-logout" type="button" onClick={onLogout}>
          <Icon name="logout" size={19} /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
