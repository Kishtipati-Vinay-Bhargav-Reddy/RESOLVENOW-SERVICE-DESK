const navigation = [
  ["Dashboard", "grid"],
  ["Complaints", "inbox"],
  ["Assignments", "assignment"],
  ["Notifications", "bell"],
  ["Profile", "user"],
];

function Sidebar({ activeItem, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <nav aria-label="Primary navigation">
        {navigation.map(([label, icon]) => (
          <button
            className={`nav-item ${activeItem === label ? "active" : ""}`}
            key={label}
            type="button"
            onClick={() => onNavigate(label)}
          >
            <span className={`nav-icon ${icon}`} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <button className="nav-item sidebar-logout" type="button" onClick={onLogout}>
        <span className="nav-icon logout" aria-hidden="true" />
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
