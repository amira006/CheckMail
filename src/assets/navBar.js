import React from "react";
import "./App.css";
import "./Navbar.css";
import { Link } from "react-router-dom";
function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        Secure<span>Mail</span>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <a href="#analyze">Analyze</a>
        </li>
        <li>
          <Link to="/sensibilisation">Sensibilisation</Link>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
      </ul>
      <div className="nav-auth">
        <button className="btn-login">Connexion</button>
      </div>
    </nav>
  );
}

export default Navbar;
