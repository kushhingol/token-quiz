import React, { useState } from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  const [showCard, setShowCard] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-text">Designed, Engineered & Coded with </span>
        <span className="footer-heart">❤️</span>
        <span className="footer-text"> by </span>
        <span
          className="footer-link-wrapper"
          onMouseEnter={() => setShowCard(true)}
          onMouseLeave={() => setShowCard(false)}
        >
          <a
            href="https://www.linkedin.com/in/kush-hingol/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Kush Hingol
          </a>

          {/* LinkedIn Profile Card */}
          {showCard && (
            <div className="linkedin-card">
              <div className="linkedin-card-header">
                <img
                  src="https://media.licdn.com/dms/image/v2/D4D03AQExq8xiys4Maw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1712999308042?e=1783555200&v=beta&t=reTIcYhmpHLmBniioAOOra8Cekz7DpCCrSIfzbtYOv8"
                  alt="Kush Hingol"
                  className="linkedin-avatar"
                />
                <div className="linkedin-info">
                  <h4 className="linkedin-name">Kush Hingol</h4>
                  <p className="linkedin-title">Software Engineer</p>
                </div>
              </div>
              <div className="linkedin-card-footer">
                <span className="linkedin-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </span>
                <span className="linkedin-cta">View Profile</span>
              </div>
            </div>
          )}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
