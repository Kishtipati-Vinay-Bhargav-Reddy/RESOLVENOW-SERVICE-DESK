import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotificationCount } from "./NotificationCountContext";
import Icon from "./Icon";

function Navbar({ username, role, onLogout, onMenuToggle, menuOpen, menuButtonRef }) {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationCount();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

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

  return (
    <header className="topbar">
      <button ref={menuButtonRef} className="mobile-menu-button icon-button" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen} onClick={onMenuToggle}><Icon name={menuOpen ? "close" : "menu"} /></button>
      <div className="brand-lockup">
        <Link className="brand-mark" to="/dashboard" aria-label="ResolveNow dashboard">RN</Link>
        <div>
          <strong>ResolveNow</strong>
          <span>ISSUE ESCALATION & SERVICE DESK</span>
        </div>
      </div>
      <form className="global-search" role="search" onSubmit={handleSearch}>
        <Icon name="search" size={18} />
        <input ref={searchInputRef} aria-label="Search complaints" placeholder="Search complaints" value={query}
          onChange={(event) => setQuery(event.target.value)} />
        <kbd>/</kbd>
      </form>
      <div className="topbar-actions">
        <Link className="notification-button icon-button" to="/notifications" aria-label={`Notifications, ${unreadCount} unread`} title="Notifications">
          <Icon name="notifications" size={19} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        <Link className="user-chip" to="/profile" aria-label="Open profile">
          <span className="avatar">{username?.charAt(0).toUpperCase() || "U"}</span>
          <span className="user-chip-copy"><strong>{username || "User"}</strong><small>{role || "Account"}</small></span>
        </Link>
        <button className="outline-button topbar-logout" type="button" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}

export default Navbar;
