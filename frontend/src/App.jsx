import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, clearSession, getStoredUser, persistSession } from "./services/api";
import { ToastProvider } from "./components/ToastProvider";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import ComplaintDetails from "./pages/ComplaintDetails";
import Assignments from "./pages/Assignments";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { NotificationCountProvider } from "./components/NotificationCountProvider";
import { useToast } from "./components/ToastContext";

function App() {
  return <BrowserRouter><ToastProvider><AppRoutes /></ToastProvider></BrowserRouter>;
}

function AppRoutes() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem("token")));
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoadingSession, setIsLoadingSession] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    let isMounted = true;
    const handleUnauthorized = () => {
      clearSession();
      setUser(null);
      setHasToken(false);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    const token = localStorage.getItem("token");
    if (!token) {
      return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }

    api.get("/auth/me")
      .then(({ data }) => {
        if (!isMounted) return;
        persistSession(token, data);
        setUser(data);
        setHasToken(true);
      })
      .catch((error) => {
        if (isMounted && error.response?.status !== 401 && localStorage.getItem("token")) {
          setUser(getStoredUser());
          setHasToken(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingSession(false);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    setHasToken(false);
    showToast("You have signed out.");
    navigate("/login");
  };

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
    setHasToken(true);
    navigate("/dashboard");
  };

  const protectedPage = (Page) => isLoadingSession
    ? <main className="state-panel">Checking your session...</main>
    : hasToken
      ? <Page username={user?.username || ""} user={user} onLogout={logout} />
      : <Navigate to="/login" replace />;

  return <NotificationCountProvider key={hasToken ? "authenticated" : "anonymous"} enabled={hasToken}><Routes>
    <Route path="/login" element={isLoadingSession ? <main className="state-panel">Checking your session...</main> : hasToken ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
    <Route path="/register" element={isLoadingSession ? <main className="state-panel">Checking your session...</main> : hasToken ? <Navigate to="/dashboard" replace /> : <Login initialMode="register" />} />
    <Route path="/dashboard" element={protectedPage(Dashboard)} />
    <Route path="/complaints" element={protectedPage(Complaints)} />
    <Route path="/complaints/:id" element={protectedPage(ComplaintDetails)} />
    <Route path="/assignments" element={protectedPage(Assignments)} />
    <Route path="/notifications" element={protectedPage(Notifications)} />
    <Route path="/profile" element={protectedPage(Profile)} />
    <Route path="*" element={<Navigate to={isLoadingSession ? "/login" : hasToken ? "/dashboard" : "/login"} replace />} />
  </Routes></NotificationCountProvider>;
}

export default App;