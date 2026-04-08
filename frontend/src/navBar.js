import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isLogged, clearAuth } from "./authService";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Check<span>Mail</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/" className={path === "/" ? "active" : ""}>
            Home
          </Link>
        </li>

        <li>
          <Link
            to="/analyze"
            className={
              path === "/analyze" || path === "/results" ? "active" : ""
            }
          >
            Analyze
          </Link>
        </li>

        <li>
          <Link
            to="/historique"
            className={path === "/historique" ? "active" : ""}
          >
            Historique
          </Link>
        </li>

        <li>
          <Link
            to="/sensibilisation"
            className={path === "/sensibilisation" ? "active" : ""}
          >
            Sensibilisation
          </Link>
        </li>
      </ul>

      <div className="nav-auth">
        {isLogged() ? (
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        ) : (
          <button className="btn-login" onClick={() => navigate("/login")}>
            Connexion
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
