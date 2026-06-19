import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useGame } from "../../contexts/GameContext";
import { useSound } from "../../contexts/SoundContext";
import { formatTokens } from "@shared/utils";
import "./Header.css";

const Header: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { team } = useGame();
  const {
    soundEnabled,
    musicEnabled,
    toggleSound,
    toggleMusic,
    startBackgroundMusic,
    stopBackgroundMusic,
    playClick,
  } = useSound();
  const location = useLocation();
  const musicStartedRef = useRef(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isGameRoute = location.pathname.startsWith("/game");

  // Start background music on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (musicEnabled && !musicStartedRef.current) {
        startBackgroundMusic();
        musicStartedRef.current = true;
      }
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    return () => document.removeEventListener("click", handleFirstInteraction);
  }, [musicEnabled, startBackgroundMusic]);

  // Handle music toggle
  useEffect(() => {
    if (musicEnabled && musicStartedRef.current) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  const handleSoundToggle = () => {
    playClick();
    toggleSound();
  };

  const handleMusicToggle = () => {
    playClick();
    toggleMusic();
    if (!musicEnabled) {
      musicStartedRef.current = true;
    }
  };

  const handleThemeToggle = () => {
    playClick();
    toggleTheme();
  };

  return (
    <header className="header safe-area-top">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">🎮</span>
          <span className="header-logo-text hidden-mobile">TOKEN QUIZ</span>
        </Link>

        {/* Right side controls */}
        <div className="header-controls">
          {/* Token Balance - Show during game */}
          {team && isGameRoute && (
            <div className="header-token-display">
              <span className="token-icon">🪙</span>
              <span className="token-balance">
                {formatTokens(team.tokenBalance)}
              </span>
            </div>
          )}

          {/* Admin indicator */}
          {isAdminRoute && <span className="header-admin-badge">ADMIN</span>}

          {/* Music Toggle */}
          <button
            className="header-music-toggle"
            onClick={handleMusicToggle}
            aria-label={`${musicEnabled ? "Stop" : "Play"} music`}
            title={`${musicEnabled ? "Stop" : "Play"} background music`}
          >
            {musicEnabled ? "🎵" : "🎶"}
          </button>

          {/* Sound Toggle */}
          <button
            className="header-sound-toggle"
            onClick={handleSoundToggle}
            aria-label={`${soundEnabled ? "Mute" : "Unmute"} sound`}
            title={`${soundEnabled ? "Mute" : "Unmute"} sound effects`}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          {/* Theme Toggle */}
          <button
            className="header-theme-toggle"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
