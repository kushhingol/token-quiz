import React from "react";
import { Link } from "react-router-dom";
import { useSound } from "../contexts/SoundContext";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const { playClick, playWhoosh } = useSound();
  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-icon animate-bounce">🎮</div>
          <h1 className="hero-title">
            TOKEN
            <br />
            <span className="hero-title-accent">BETTING</span>
            <br />
            QUIZ
          </h1>
          <p className="hero-subtitle">
            Test your knowledge. Bet your tokens. Win big!
          </p>
        </section>

        {/* Features */}
        <section className="landing-features">
          <div className="feature-card">
            <span className="feature-icon">🪙</span>
            <h3 className="feature-title">BET TOKENS</h3>
            <p className="feature-desc">
              Risk 25, 50, 100, or 200 tokens per question
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⏱️</span>
            <h3 className="feature-title">60 SECONDS</h3>
            <p className="feature-desc">Answer fast to beat the clock</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🏆</span>
            <h3 className="feature-title">WIN BIG</h3>
            <p className="feature-desc">Double your bet on correct answers</p>
          </div>
        </section>

        {/* CTA Buttons */}
        <section className="landing-cta">
          <Link
            to="/register"
            className="btn btn-primary cta-btn"
            onClick={() => {
              playClick();
              playWhoosh();
            }}
          >
            JOIN GAME
          </Link>
          <Link
            to="/rejoin"
            className="btn btn-secondary cta-btn"
            onClick={playClick}
          >
            🔄 REJOIN GAME
          </Link>
          <Link
            to="/admin"
            className="btn btn-outline cta-btn"
            onClick={playClick}
          >
            ADMIN PANEL
          </Link>
        </section>

        {/* How to Play */}
        <section className="landing-howto">
          <h2 className="howto-title">HOW TO PLAY</h2>
          <ol className="howto-list">
            <li>Register your team with a cool name</li>
            <li>Wait for admin approval</li>
            <li>Place your token bets on each question</li>
            <li>Answer correctly to double your bet</li>
            <li>Team with most tokens wins!</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
