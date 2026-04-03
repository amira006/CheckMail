import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import Robot from "./robot-removebg-preview.png";
import "./heroSection.css";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <main className="hero-container">
      <div className="hero-text">
        <div className="badge-new">
          Obtenez un score de sécurité mail par IA
        </div>
        <h1>
          Analyse & <span>Vérification</span> des Emails
        </h1>
        <p>
          Analysez vos emails et recevez un verdict de sécurité immédiat. Un
          rapport précis pour une protection totale contre le phishing.
        </p>

        <div className="cta-wrapper">
          <button className="main-cta" onClick={() => navigate('/analyze')}>
            Analyser un Email
          </button>
          <button className="secondary-cta">
            Comment ça marche ?
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <div className="robot-wrapper">
          <img src={Robot} alt="Mascotte CheckMail" className="robot-image" />
          <div className="floor-shadow"></div>
        </div>
      </div>
    </main>
  );
}

export default HeroSection;