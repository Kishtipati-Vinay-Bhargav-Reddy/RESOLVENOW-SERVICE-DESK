import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";

function Login({ onLogin, initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => location.state?.message || "");
  const [isSuccess, setIsSuccess] = useState(() => Boolean(location.state?.message));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const response = await api.post(
          "/auth/login",
          { username, password },
          { headers: { "Content-Type": "application/json" } }
        );
        const token = response.data?.token || response.data?.accessToken || response.data;
        if (typeof token !== "string" || !token.trim()) {
          throw new Error("Login succeeded but the server did not return a JWT token.");
        }
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
        onLogin(username);
      } else {
        await api.post("/auth/register", { username, email, password });
        navigate("/login", { state: { message: "Registration successful" }, replace: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand"><span className="brand-mark">RN</span><span>ResolveNow</span></div>
        <p className="eyebrow">SERVICE DESK PLATFORM</p>
        <h1>Resolve every issue with clarity.</h1>
        <p className="auth-description">Enterprise Issue Escalation & Service Desk</p>
        <div className="auth-rule" />
        <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-help">{isLogin ? "Sign in to continue to your service desk." : "Register to start managing complaints."}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Username<input type="text" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          {!isLogin && <label>Email<input type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
          <label>Password<input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className={isSuccess ? "form-success" : "form-error"}>{error}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}</button>
        </form>
        <p className="switch-text">{isLogin ? "Don't have an account?" : "Already have an account?"}<button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); setIsSuccess(false); }}>{isLogin ? " Register" : " Login"}</button></p>
      </section>
      <aside className="auth-aside"><div><span className="aside-kicker">RESOLVENOW / 01</span><h2>One place for every customer concern.</h2><p>Track ownership, progress, and resolution from first report to final response.</p></div><div className="aside-footer"><span>Trusted workflow</span><span>Secure by design</span><span>Built for teams</span></div></aside>
    </main>
  );
}

export default Login;
