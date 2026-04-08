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
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} CheckMail . Tous droits réservés.</p>
      </div>
    </footer>
  );
}

export default Footer;
