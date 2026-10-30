import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { api, clearSession, getErrorMessage, persistSession } from "../services/api";

function Login({ onLogin, initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = initialMode !== "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(() => location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { data: authResponse } = await api.post("/auth/login", { username, password });
        const token = typeof authResponse === "string"
          ? authResponse.trim()
          : authResponse?.token || authResponse?.accessToken;
        if (typeof token !== "string" || !token.trim()) {
          throw new Error("The authentication service did not return a valid sign-in token.");
        }

        persistSession(token, { username });
        let authenticatedUser;
        try {
          const profileResponse = await api.get("/auth/me");
          authenticatedUser = profileResponse.data;
        } catch (profileError) {
          clearSession();
          throw new Error(`Sign in succeeded, but your profile could not be loaded: ${getErrorMessage(profileError)}`);
        }

        if (!authenticatedUser || typeof authenticatedUser !== "object"
          || authenticatedUser.userId == null || !authenticatedUser.username || !authenticatedUser.role) {
          clearSession();
          throw new Error("Sign in succeeded, but the profile response was incomplete. Please try again.");
        }

        persistSession(token, authenticatedUser);
        onLogin(authenticatedUser);
      } else {
        await api.post("/auth/register", { username: username.trim(), email: email.trim(), password });
        navigate("/login", { state: { message: "Your account is ready. Sign in to continue." }, replace: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setError("");
    setSuccess("");
    navigate(isLogin ? "/register" : "/login", { replace: true });
  };

  return <main className="auth-page">
    <section className="auth-story">
      <Link className="auth-brand" to="/login"><span className="brand-mark">RN</span><span>ResolveNow</span></Link>
      <div className="auth-story-body">
        <p className="eyebrow">ENTERPRISE SERVICE DESK</p>
        <h1>Every issue has a clear next step.</h1>
        <p className="auth-description">A secure workspace for reporting, assigning, and resolving service issues from one place.</p>
        <div className="workflow-steps" aria-label="Service desk workflow">
          <div className="workflow-step"><span>01</span><strong>Report</strong><small>Capture the issue</small></div>
          <span className="workflow-connector" aria-hidden="true" />
          <div className="workflow-step"><span>02</span><strong>Route</strong><small>Assign ownership</small></div>
          <span className="workflow-connector" aria-hidden="true" />
          <div className="workflow-step"><span>03</span><strong>Resolve</strong><small>Track to closure</small></div>
        </div>
      </div>
      <div className="auth-story-footer"><span>ResolveNow Service Desk</span><span>JWT-secured access</span></div>
    </section>

    <section className="auth-form-side">
      <div className="auth-form-wrap">
        <div className="auth-mobile-brand"><span className="brand-mark">RN</span><strong>ResolveNow</strong></div>
        <p className="eyebrow">{isLogin ? "WELCOME BACK" : "NEW ACCOUNT"}</p>
        <h2>{isLogin ? "Sign in to your workspace" : "Create your account"}</h2>
        <p className="auth-form-intro">{isLogin ? "Use your account credentials to continue." : "Set up your account to start managing service issues."}</p>

        {success && <div className="auth-message auth-message-success" role="status"><Icon name="check" size={17} />{success}</div>}
        {error && <div className="auth-message auth-message-error" role="alert"><Icon name="close" size={17} />{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="auth-username">Username</label>
          <input id="auth-username" name="username" type="text" autoComplete="username" placeholder="Enter your username"
            value={username} onChange={(event) => setUsername(event.target.value)} required />

          {!isLogin && <>
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" placeholder="name@company.com"
              value={email} onChange={(event) => setEmail(event.target.value)} required />
          </>}

          <label htmlFor="auth-password">Password</label>
          <div className="password-field">
            <input id="auth-password" name="password" type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Enter your password"
              value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
              <Icon name="eye" size={18} />
            </button>
          </div>

          <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            {!isSubmitting && <Icon name="arrow" size={17} />}
          </button>
        </form>
        <p className="auth-switch">{isLogin ? "New to ResolveNow?" : "Already have an account?"}
          <button type="button" onClick={switchMode}>{isLogin ? "Create account" : "Sign in"}</button>
        </p>
        <p className="auth-security-note"><span /> Your session is protected with JWT authentication.</p>
      </div>
    </section>
  </main>;
}

export default Login;