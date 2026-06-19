import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import "./QuestionManager.css";

interface Question {
  id?: string;
  index: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  category: string;
}

interface Game {
  id: string;
  name: string;
  totalQuestions: number;
}

const CATEGORIES = [
  "Frontend Rollback Procedures",
  "Severity Levels & Incident Classification",
  "Feature Tiers, Postmortems & SLAs",
  "General Knowledge",
];

const QuestionManager: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Question, "id">>({
    index: 1,
    text: "",
    options: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A",
    category: CATEGORIES[0],
  });

  // Get the questions collection path based on whether we have a gameId
  const getQuestionsPath = () => {
    if (gameId) {
      return `games/${gameId}/questions`;
    }
    return "questions";
  };

  // Fetch game info if gameId is provided
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      return;
    }

    const fetchGame = async () => {
      try {
        const gameRef = doc(db, "games", gameId);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          setGame({ id: gameSnap.id, ...gameSnap.data() } as Game);
        }
      } catch (error) {
        console.error("Error fetching game:", error);
      }
    };

    fetchGame();
  }, [gameId]);

  // Fetch questions from Firestore
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const questionsRef = gameId
        ? collection(db, "games", gameId, "questions")
        : collection(db, "questions");
      const q = query(questionsRef, orderBy("index", "asc"));
      const snapshot = await getDocs(q);
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [gameId]);

  // Update game's totalQuestions when questions change
  const updateGameTotalQuestions = async (count: number) => {
    if (!gameId) return;
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, { totalQuestions: count });
    } catch (error) {
      console.error("Error updating game total questions:", error);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("option")) {
      const optionKey = name.replace("option", "") as "A" | "B" | "C" | "D";
      setFormData((prev) => ({
        ...prev,
        options: { ...prev.options, [optionKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add or update question
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion?.id) {
        // Update existing question
        const questionRef = gameId
          ? doc(db, "games", gameId, "questions", editingQuestion.id)
          : doc(db, "questions", editingQuestion.id);
        await updateDoc(questionRef, formData);
      } else {
        // Add new question
        const questionsRef = gameId
          ? collection(db, "games", gameId, "questions")
          : collection(db, "questions");
        await addDoc(questionsRef, formData);
      }
      resetForm();
      await fetchQuestions();
      // Update total questions count
      await updateGameTotalQuestions(
        questions.length + (editingQuestion ? 0 : 1),
      );
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  // Delete question
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const questionRef = gameId
          ? doc(db, "games", gameId, "questions", id)
          : doc(db, "questions", id);
        await deleteDoc(questionRef);
        await fetchQuestions();
        await updateGameTotalQuestions(questions.length - 1);
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  // Edit question
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      index: question.index,
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      category: question.category,
    });
    setShowForm(true);
    setBulkUploadMode(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      index: questions.length + 1,
      text: "",
      options: { A: "", B: "", C: "", D: "" },
      correctAnswer: "A",
      category: CATEGORIES[0],
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  // Bulk upload questions from JSON
  const handleBulkUpload = async () => {
    try {
      setUploadStatus("Parsing JSON...");
      const parsedQuestions = JSON.parse(jsonInput);

      if (!Array.isArray(parsedQuestions)) {
        throw new Error("JSON must be an array of questions");
      }

      setUploadStatus(`Uploading ${parsedQuestions.length} questions...`);

      const batch = writeBatch(db);
      const questionsRef = gameId
        ? collection(db, "games", gameId, "questions")
        : collection(db, "questions");

      parsedQuestions.forEach((q: Question, idx: number) => {
        const docRef = doc(questionsRef);
        batch.set(docRef, {
          index: q.index || idx + 1,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: q.category || "General Knowledge",
        });
      });

      await batch.commit();
      setUploadStatus(
        `Successfully uploaded ${parsedQuestions.length} questions!`,
      );
      setJsonInput("");
      await fetchQuestions();
      await updateGameTotalQuestions(parsedQuestions.length);

      setTimeout(() => {
        setUploadStatus(null);
        setBulkUploadMode(false);
      }, 3000);
    } catch (error) {
      console.error("Error uploading questions:", error);
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Delete all questions
  const handleDeleteAll = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL questions? This cannot be undone!",
      )
    ) {
      try {
        const batch = writeBatch(db);
        questions.forEach((q) => {
          if (q.id) {
            const questionRef = gameId
              ? doc(db, "games", gameId, "questions", q.id)
              : doc(db, "questions", q.id);
            batch.delete(questionRef);
          }
        });
        await batch.commit();
        await fetchQuestions();
        await updateGameTotalQuestions(0);
      } catch (error) {
        console.error("Error deleting all questions:", error);
      }
    }
  };

  // Export questions as JSON
  const handleExport = () => {
    const exportData = questions.map(({ id, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = gameId ? `questions-${gameId}.json` : "questions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="question-manager">
      <div className="manager-header">
        {gameId ? (
          <>
            <Link to={`/admin/game/${gameId}`} className="back-link">
              ← Back to Game
            </Link>
            <h1>📝 Questions for: {game?.name || "Loading..."}</h1>
            <p className="subtitle">
              Manage questions for this specific game ({questions.length}{" "}
              questions)
            </p>
          </>
        ) : (
          <>
            <h1>📝 Global Question Manager</h1>
            <p className="subtitle">
              Manage global question bank ({questions.length} questions)
            </p>
          </>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setBulkUploadMode(false);
            setFormData((prev) => ({ ...prev, index: questions.length + 1 }));
          }}
        >
          ➕ Add Question
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setBulkUploadMode(true);
            setShowForm(false);
          }}
        >
          📤 Bulk Upload JSON
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          📥 Export JSON
        </button>
        {questions.length > 0 && (
          <button className="btn btn-danger" onClick={handleDeleteAll}>
            🗑️ Delete All
          </button>
        )}
      </div>

      {/* Bulk Upload Mode */}
      {bulkUploadMode && (
        <div className="bulk-upload-section">
          <h2>Bulk Upload Questions</h2>
          <p>Paste your JSON array of questions below:</p>
          <textarea
            className="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`[
  {
    "index": 1,
    "text": "What is the first priority when handling a frontend incident?",
    "options": {
      "A": "Identify the root cause",
      "B": "Restore functionality to the app",
      "C": "Create a detailed incident report",
      "D": "Notify all stakeholders"
    },
    "correctAnswer": "B",
    "category": "Frontend Rollback Procedures"
  }
]`}
          />
          {uploadStatus && (
            <div
              className={`upload-status ${
                uploadStatus.includes("Error") ? "error" : "success"
              }`}
            >
              {uploadStatus}
            </div>
          )}
          <div className="bulk-actions">
            <button className="btn btn-primary" onClick={handleBulkUpload}>
              Upload Questions
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setBulkUploadMode(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Single Question Form */}
      {showForm && (
        <div className="question-form-container">
          <h2>{editingQuestion ? "Edit Question" : "Add New Question"}</h2>
          <form onSubmit={handleSubmit} className="question-form">
            <div className="form-row">
              <div className="form-group small">
                <label>Index #</label>
                <input
                  type="number"
                  name="index"
                  value={formData.index}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Question Text</label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                placeholder="Enter the question..."
                required
              />
            </div>

            <div className="options-grid">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <div key={opt} className="form-group">
                  <label>
                    Option {opt}
                    {formData.correctAnswer === opt && " ✓"}
                  </label>
                  <input
                    type="text"
                    name={`option${opt}`}
                    value={formData.options[opt]}
                    onChange={handleInputChange}
                    placeholder={`Option ${opt}...`}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Correct Answer</label>
              <div className="answer-options">
                {(["A", "B", "C", "D"] as const).map((opt) => (
                  <label key={opt} className="radio-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={opt}
                      checked={formData.correctAnswer === opt}
                      onChange={handleInputChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingQuestion ? "Update Question" : "Add Question"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="questions-list">
        <h2>Questions ({questions.length})</h2>
        {loading ? (
          <div className="loading">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <p>No questions yet. Add some questions to get started!</p>
          </div>
        ) : (
          <div className="questions-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td className="index-cell">{q.index}</td>
                    <td className="question-cell">
                      {q.text.length > 80
                        ? q.text.substring(0, 80) + "..."
                        : q.text}
                    </td>
                    <td className="category-cell">
                      <span className="category-badge">{q.category}</span>
                    </td>
                    <td className="answer-cell">{q.correctAnswer}</td>
                    <td className="actions-cell">
                      <div className="action-buttons-row">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(q)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => q.id && handleDelete(q.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManager;
