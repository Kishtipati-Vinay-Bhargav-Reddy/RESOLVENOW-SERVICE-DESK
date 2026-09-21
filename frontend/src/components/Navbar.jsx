function Navbar({ username, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">RN</div>
        <div>
          <strong>ResolveNow</strong>
          <span>Enterprise Issue Escalation & Service Desk</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="user-chip">
          <span className="avatar">{username?.charAt(0).toUpperCase() || "U"}</span>
          <span>{username || "User"}</span>
        </div>
        <button className="outline-button" type="button" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Navbar;
