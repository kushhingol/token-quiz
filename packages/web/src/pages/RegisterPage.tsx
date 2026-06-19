import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import "./RegisterPage.css";

// Generate a unique 6-character rejoin code
const generateRejoinCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (0,O,1,I,L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const RegisterPage: React.FC = () => {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();
  const { signIn, setTeamId } = useAuth();
  const { playClick, playSuccess, playWrong } = useSound();

  const [formData, setFormData] = useState({
    teamName: "",
    leaderName: "",
    members: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.teamName.trim()) {
      return "Team name is required";
    }
    if (formData.teamName.trim().length < 2) {
      return "Team name must be at least 2 characters";
    }
    if (formData.teamName.trim().length > 30) {
      return "Team name must be less than 30 characters";
    }
    if (!formData.leaderName.trim()) {
      return "Team leader name is required";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    playClick();

    const validationError = validateForm();
    if (validationError) {
      playWrong();
      setError(validationError);
      return;
    }

    // Parse members
    const membersArray = formData.members
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    try {
      setIsSubmitting(true);

      // Sign in anonymously if not already
      await signIn();

      // Determine game ID (use provided or default)
      const targetGameId = gameId || "default-game";

      // Create team document
      const teamsRef = collection(db, "games", targetGameId, "teams");

      // Generate unique rejoin code
      const rejoinCode = generateRejoinCode();

      const teamDoc = await addDoc(teamsRef, {
        name: formData.teamName.trim(),
        leaderName: formData.leaderName.trim(),
        members: membersArray,
        status: "pending",
        tokenBalance: 0, // Will be set when approved
        cumulativeResponseTimeMs: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        rejoinCode: rejoinCode, // Add rejoin code
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Store team ID
      setTeamId(teamDoc.id);

      // Play success sound
      playSuccess();

      // Navigate to waiting room
      navigate(`/waiting/${targetGameId}/${teamDoc.id}`);
    } catch (err) {
      console.error("Error registering team:", err);
      playWrong();
      setError("Failed to register team. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <span className="register-icon">📝</span>
            <h1 className="register-title">TEAM REGISTRATION</h1>
            <p className="register-subtitle">
              Register your team to join the quiz battle!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="register-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="teamName" className="label">
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                name="teamName"
                className="input"
                placeholder="Enter your team name"
                value={formData.teamName}
                onChange={handleInputChange}
                maxLength={30}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="leaderName" className="label">
                Team Leader *
              </label>
              <input
                type="text"
                id="leaderName"
                name="leaderName"
                className="input"
                placeholder="Enter team leader's name"
                value={formData.leaderName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="members" className="label">
                Team Members (Optional)
              </label>
              <textarea
                id="members"
                name="members"
                className="input textarea"
                placeholder="Enter member names, separated by commas"
                value={formData.members}
                onChange={handleInputChange}
                rows={3}
                disabled={isSubmitting}
              />
              <span className="form-hint">Example: John, Jane, Bob</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary register-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "REGISTERING..." : "REGISTER TEAM"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
