import React from "react";
import "./LoadingScreen.css";

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">🎮</div>
        <h1 className="loading-title">TOKEN QUIZ</h1>
        <div className="loading-bar">
          <div className="loading-bar-fill"></div>
        </div>
        <p className="loading-text">LOADING...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
