import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppShell({ activeItem, username, role, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
      if (event.key === "Tab") {
        const focusable = [...(sidebarRef.current?.querySelectorAll("a[href], button:not(:disabled)") || [])];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) sidebarRef.current?.querySelector("a[href]")?.focus();
    else if (wasOpen.current) menuButtonRef.current?.focus();
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  return <div className="app-shell">
    <Navbar username={username} role={role} onLogout={onLogout}
      menuButtonRef={menuButtonRef} onMenuToggle={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
    <div className="app-body">
      <Sidebar sidebarRef={sidebarRef} activeItem={activeItem} onLogout={onLogout} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <button className="drawer-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
      <main className="page-content">{children}</main>
    </div>
  </div>;
}

export default AppShell;