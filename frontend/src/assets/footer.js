import React from "react";
import "./App.css";
import "./footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="logo">
            Check<span>Mail</span>
          </div>
          <p>
            L'excellence en analyse de sécurité email. Protégez vos données avec
            nos rapports d'audit par IA.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Produit</h4>
            <ul>
              <li>
                <a href="#analyze">Analyseur</a>
              </li>
              <li>
                <a href="#features">Fonctionnalités</a>
              </li>
              <li>
                <a href="#api">API Sécurité</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="#help">Aide</a>
              </li>
              <li>
                <a href="#privacy">Confidentialité</a>
              </li>
              <li>
                <a href="#terms">Conditions</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} CheckMail . Tous droits réservés.</p>
      </div>
    </footer>
  );
}

export default Footer;
