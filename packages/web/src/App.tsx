import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import WaitingRoom from "./pages/WaitingRoom";
import GamePlay from "./pages/GamePlay";
import ResultsPage from "./pages/ResultsPage";
import RejoinPage from "./pages/RejoinPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminUsers from "./pages/admin/AdminUsers";
import QuestionManager from "./pages/admin/QuestionManager";

// Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import LoadingScreen from "./components/ui/LoadingScreen";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:gameId" element={<RegisterPage />} />
          <Route path="/waiting/:gameId/:teamId" element={<WaitingRoom />} />
          <Route path="/game/:gameId/:teamId" element={<GamePlay />} />
          <Route path="/results/:gameId" element={<ResultsPage />} />
          <Route path="/results/:gameId/:teamId" element={<ResultsPage />} />
          <Route path="/rejoin" element={<RejoinPage />} />

          {/* Admin Login & Setup (public) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/game/:gameId"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/leaderboard/:gameId"
            element={
              <ProtectedAdminRoute>
                <AdminLeaderboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedAdminRoute>
                <QuestionManager />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/game/:gameId/questions"
            element={
              <ProtectedAdminRoute>
                <QuestionManager />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <AdminUsers />
              </ProtectedAdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
