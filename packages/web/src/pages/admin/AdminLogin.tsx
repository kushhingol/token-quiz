import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./AdminLogin.css";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAdmin, signUpAdmin, isAdmin, isLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already admin
  useEffect(() => {
    if (isAdmin && !isLoading) {
      const from = (location.state as any)?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    }
  }, [isAdmin, isLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignUp) {
        await signUpAdmin(email.trim(), password);
      } else {
        await signInAdmin(email.trim(), password);
      }
      // Navigation will happen via useEffect
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-login-page">
        <div className="login-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-icon">🔐</span>
            <h1>Admin Login</h1>
            <p>Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/admin/setup" className="toggle-mode-btn">
              First time? Create Account
            </Link>
          </div>

          <div className="login-info">
            <p>
              <strong>Note:</strong> Only authorized admin emails can access
              this dashboard. Contact the system administrator to get access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
