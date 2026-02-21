import React from "react";
import "./App.css";
import Robot from "./robot-removebg-preview.png";
import "./heroSection.css";
function HeroSection() {
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
          <button className="main-cta">Analyser un Email</button>
          <button className="secondary-cta">Comment ça marche ?</button>
        </div>
      </div>

      <div className="hero-visual">
        <div className="robot-wrapper">
          {/* Assure-toi que l'image est dans le dossier 'public' ou importée */}
          <img src={Robot} alt="Mascotte SecureMail" className="robot-image" />
          <div className="floor-shadow"></div>
        </div>
      </div>
    </main>
  );
}

export default HeroSection;
