import React from "react";
import "./App.css";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="logo">Secure<span>Mail</span></div>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/analyze" className={location.pathname === '/analyze' || location.pathname === '/results' ? 'active' : ''}>
            Analyse
          </Link>
        </li>
        <li>
          <Link to="/sensibilisation" className={location.pathname === '/sensibilisation' ? 'active' : ''}>
            Sensibilisation
          </Link>
        </li>
      </ul>

      <div className="nav-auth">
        <button className="btn-login" onClick={() => navigate('/login')}>
          Connexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;