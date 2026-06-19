import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../services/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import "./AdminUsers.css";

interface AdminUser {
  email: string;
  addedAt: any;
  addedBy: string;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const adminsRef = collection(db, "admins");
      const snapshot = await getDocs(adminsRef);
      const adminsList = snapshot.docs.map((doc) => ({
        email: doc.id,
        ...doc.data(),
      })) as AdminUser[];
      setAdmins(adminsList);
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Add new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if already exists
    if (admins.some((a) => a.email === email)) {
      setError("This email is already an admin");
      return;
    }

    try {
      setIsAdding(true);
      const adminRef = doc(db, "admins", email);
      await setDoc(adminRef, {
        email,
        addedAt: serverTimestamp(),
        addedBy: user?.email || "unknown",
      });

      setNewEmail("");
      setSuccess(`${email} has been added as an admin`);
      await fetchAdmins();
    } catch (err) {
      console.error("Error adding admin:", err);
      setError("Failed to add admin user");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (email: string) => {
    // Prevent removing yourself
    if (email === user?.email?.toLowerCase()) {
      setError("You cannot remove yourself as an admin");
      return;
    }

    // Prevent removing the last admin
    if (admins.length <= 1) {
      setError("Cannot remove the last admin");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${email} as admin?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const adminRef = doc(db, "admins", email);
      await deleteDoc(adminRef);
      setSuccess(`${email} has been removed as admin`);
      await fetchAdmins();
    } catch (err) {
      console.error("Error removing admin:", err);
      setError("Failed to remove admin user");
    }
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-container">
          <div className="loading">Loading admin users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-container">
        <div className="page-header">
          <Link to="/admin" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1>👥 Admin Users</h1>
          <p>Manage who can access the admin dashboard</p>
        </div>

        {/* Add Admin Form */}
        <div className="add-admin-section">
          <h2>Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="add-admin-form">
            <input
              type="email"
              placeholder="Enter email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isAdding}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAdding}
            >
              {isAdding ? "Adding..." : "Add Admin"}
            </button>
          </form>
          <p className="form-hint">
            The user will need to create an account with this email to access
            the admin dashboard.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="message error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="message success">
            <span>✅</span> {success}
          </div>
        )}

        {/* Admin List */}
        <div className="admins-section">
          <h2>Current Admins ({admins.length})</h2>
          <div className="admins-list">
            {admins.map((admin) => (
              <div key={admin.email} className="admin-card">
                <div className="admin-info">
                  <div className="admin-email">{admin.email}</div>
                  <div className="admin-meta">
                    Added by: {admin.addedBy || "System"}
                  </div>
                </div>
                <div className="admin-actions">
                  {admin.email === user?.email?.toLowerCase() ? (
                    <span className="you-badge">You</span>
                  ) : (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveAdmin(admin.email)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
