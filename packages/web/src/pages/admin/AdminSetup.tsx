import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../services/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./AdminSetup.css";

const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if any admins exist
  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const adminsRef = collection(db, "admins");
        const snapshot = await getDocs(adminsRef);
        setHasAdmins(!snapshot.empty);
      } catch (err) {
        console.error("Error checking admins:", err);
        // If we can't check, assume no admins (allow setup)
        setHasAdmins(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdmins();
  }, []);

  // Redirect if admins already exist
  useEffect(() => {
    if (hasAdmins === true) {
      navigate("/admin/login");
    }
  }, [hasAdmins, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);

      // First, add email to admins collection
      const adminRef = doc(db, "admins", email.toLowerCase());
      await setDoc(adminRef, {
        email: email.toLowerCase(),
        addedAt: serverTimestamp(),
        addedBy: "system-setup",
      });

      // Then create the Firebase Auth account
      await createUserWithEmailAndPassword(auth, email, password);

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err: any) {
      console.error("Error setting up admin:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError(err.message || "Failed to create admin account");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-setup-page">
        <div className="setup-container">
          <div className="loading">Checking setup status...</div>
        </div>
      </div>
    );
  }

  if (hasAdmins) {
    return (
      <div className="admin-setup-page">
        <div className="setup-container">
          <div className="loading">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-setup-page">
      <div className="setup-container">
        <div className="setup-card">
          <div className="setup-header">
            <span className="setup-icon">🚀</span>
            <h1>First Time Setup</h1>
            <p>Create your admin account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            {error && (
              <div className="setup-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Admin Email</label>
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
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary setup-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>

          <div className="setup-info">
            <p>
              This will create the first admin account. You can add more admins
              later from the Admin Users page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
