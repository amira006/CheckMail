import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isLogged, clearAuth } from "./authService";
import "./Navbar.css";

// Pull user info from localStorage
function getUserInfo() {
  try {
    const raw = localStorage.getItem("cm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Avatar({ user }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name || "avatar"}
        className="nav-avatar-img"
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span className="nav-avatar-initials">{initials}</span>;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getUserInfo();

  const handleLogout = () => {
    clearAuth();
    setDropdownOpen(false);
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div className="nav-avatar-wrapper" ref={dropdownRef}>
            <button
              className={`nav-avatar-btn ${dropdownOpen ? "open" : ""}`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Menu utilisateur"
            >
              <Avatar user={user} />
              <span className="nav-avatar-caret">▾</span>
            </button>

            {dropdownOpen && (
              <div className="nav-dropdown">
                {/* ── Header كبير كيف Google ── */}
                <div className="nav-dropdown-header">
                  <div className="nav-dropdown-avatar-large">
                    <Avatar user={user} />
                  </div>
                  <div className="nav-dropdown-greeting">
                    Bonjour {user?.name?.split(" ")[0]} !
                  </div>
                  <div className="nav-dropdown-email">{user?.email}</div>
                  <div
                    className={`nav-plan-badge nav-plan-${
                      user?.plan || "gratuit"
                    }`}
                  >
                    {user?.plan === "pro"
                      ? " Pro"
                      : user?.plan === "business"
                      ? " Business"
                      : "Gratuit"}
                  </div>
                  <button
                    className="nav-manage-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/forfaits");
                    }}
                  >
                    Gérer votre abonnement
                  </button>
                </div>

                <button
                  className="nav-dropdown-item nav-dropdown-logout"
                  onClick={handleLogout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
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
