import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isLogged, clearAuth, getToken, getUser } from "./authService";
import "./Navbar.css";

const API = "/auth-api";

async function fetchUserTokens() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API}/api/plan/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) return data.data; // ✅ return the inner data object
    return null;
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

// 🪙 Affichage simple : juste le nombre de tokens, sans barre
function TokenCount({ tokens, unlimited, plan, loading }) {
  // Skeleton pendant le fetch
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: 34,
          borderRadius: 8,
          background: "#f1f5f9",
          marginTop: 8,
          marginBottom: 4,
          animation: "pulse 1.2s ease-in-out infinite",
        }}
      />
    );
  }

  if (unlimited || plan === "business") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 8,
          background: "rgba(5,150,105,.08)",
          border: "1px solid rgba(5,150,105,.2)",
          marginTop: 8,
          marginBottom: 4,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
          Illimité
        </span>
      </div>
    );
  }

  if (tokens === null || tokens === undefined) return null;

  const low = tokens <= 20;
  const mid = tokens <= 50;
  const color = low ? "#ef4444" : mid ? "#f59e0b" : "#4f46e5";
  const bg = low
    ? "rgba(239,68,68,.08)"
    : mid
    ? "rgba(245,158,11,.08)"
    : "rgba(79,70,229,.08)";
  const bdr = low
    ? "rgba(239,68,68,.2)"
    : mid
    ? "rgba(245,158,11,.2)"
    : "rgba(79,70,229,.2)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${bdr}`,
        marginTop: 8,
        marginBottom: 4,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" />
        </svg>
        <span
          style={{
            fontSize: 13,
            color: "var(--color-text-secondary)",
            fontWeight: 500,
          }}
        >
          Tokens
        </span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{tokens}</span>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const dropdownRef = useRef(null);
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    setDropdownOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (dropdownOpen && isLogged()) {
      setTokenLoading(true);
      fetchUserTokens().then((data) => {
        setPlanData(data);
        setTokenLoading(false);
      });
    }
  }, [dropdownOpen]);

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
                      ? "Pro"
                      : user?.plan === "business"
                      ? "Business"
                      : "Gratuit"}
                  </div>

                  {/* 🪙 Token count — بدون بار */}
                  <TokenCount
                    tokens={planData?.tokens} // ✅ back to tokens
                    unlimited={planData?.unlimited}
                    plan={planData?.plan}
                    loading={tokenLoading}
                  />

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
