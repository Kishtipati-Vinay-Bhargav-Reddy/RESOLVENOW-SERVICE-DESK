import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import Assignments from "./pages/Assignments";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Login from "./pages/Login";

function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem("token")));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    setHasToken(false);
    navigate("/login");
  };

  return <Routes>
    <Route path="/login" element={hasToken ? <Navigate to="/dashboard" replace /> : <Login onLogin={(name) => { setUsername(name); setHasToken(true); navigate("/dashboard"); }} />} />
    <Route path="/register" element={hasToken ? <Navigate to="/dashboard" replace /> : <Login initialMode="register" />} />
    <Route path="/dashboard" element={hasToken ? <Dashboard username={username} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="/complaints" element={hasToken ? <Complaints username={username} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="/assignments" element={hasToken ? <Assignments username={username} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="/notifications" element={hasToken ? <Notifications username={username} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="/profile" element={hasToken ? <Profile username={username} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to={hasToken ? "/dashboard" : "/login"} replace />} />
  </Routes>;
}

export default App;