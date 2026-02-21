import React from "react";
import "./App.css";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        Secure<span>Mail</span>
      </div>
      <ul className="nav-links">
        <li>
          <a href="#home" className="active">
            Home
          </a>
        </li>
        <li>
          <a href="#analyze">Analyze</a>
        </li>
        <li>
          <a href="#about">About</a>
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
