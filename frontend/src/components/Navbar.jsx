import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  Headphones, 
  UserCheck 
} from "lucide-react";
import { useNotificationCount } from "./NotificationCountContext";

function Navbar({ username, role, onLogout, onMenuToggle, menuOpen, menuButtonRef }) {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationCount();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  const normalizedRole = String(role || "USER").toUpperCase();

  useEffect(() => {
    const focusSearch = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement
        && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/complaints?q=${encodeURIComponent(trimmedQuery)}` : "/complaints");
    setQuery("");
  };

  const getRoleBadge = () => {
    if (normalizedRole === "ADMIN") {
      return (
        <span className="role-badge-header role-badge-admin">
          <ShieldCheck size={12} /> Command Center
        </span>
      );
    }
    if (normalizedRole === "STAFF") {
      return (
        <span className="role-badge-header role-badge-staff">
          <Headphones size={12} /> Agent Workspace
        </span>
      );
    }
    return (
      <span className="role-badge-header role-badge-user">
        <UserCheck size={12} /> Employee Portal
      </span>
    );
  };

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          ref={menuButtonRef}
          className="icon-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link className="brand-lockup" to="/dashboard" aria-label="ResolveNow Dashboard">
          <div className="brand-mark">RN</div>
          <div>
            <strong>ResolveNow</strong>
            <span>ENTERPRISE SERVICE DESK</span>
          </div>
        </Link>

        <div style={{ marginLeft: "8px" }}>
          {getRoleBadge()}
        </div>
      </div>

      <form className="global-search" role="search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          ref={searchInputRef}
          aria-label="Search grievances & incidents"
          placeholder="Search tickets, incidents, departments..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <kbd>/</kbd>
      </form>

      <div className="topbar-actions">
        <Link 
          className="icon-button" 
          to="/notifications" 
          aria-label={`Notifications, ${unreadCount} unread`} 
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Link className="user-chip" to="/profile" aria-label="Open User Profile">
          <div className="avatar">
            {username ? username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-chip-copy">
            <strong>{username || "User"}</strong>
            <small>{normalizedRole}</small>
          </div>
        </Link>

        <button 
          className="btn btn-ghost btn-small" 
          type="button" 
          onClick={onLogout} 
          title="Sign out of session"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
