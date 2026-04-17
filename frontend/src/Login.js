import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuth } from "./authService"; // ✅ import saveAuth
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // 🔵 Google Login
  // =========================
  useEffect(() => {
    if (window.google && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id:
          "889363537267-kc12sivis5icguedt5gkogbmfv2vs4g3.apps.googleusercontent.com",
        callback: async (response) => {
          try {
            const res = await fetch("/auth-api/api/auth/google", {
              // ✅ proxy
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = await res.json();

            if (data.success) {
              saveAuth(data.token, data.user); // ✅ cm_token + cm_user
              navigate("/analyze");
            } else {
              setError("Connexion Google échouée");
            }
          } catch (err) {
            setError("Erreur connexion Google");
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth || 400,
        text: "continue_with",
        locale: "fr",
      });
    }
  }, []);

  // =========================
  // 🔐 Normal Login
  // =========================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password); // ✅ saveAuth داخل login
      navigate("/analyze");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          Secure<span>Mail</span>
        </Link>
        <h2>
          Analysez vos emails,
          <br />
          protégez vos données.
        </h2>
        <p>Notre IA détecte le phishing et les menaces en quelques secondes.</p>
        <div className="auth-bullets">
          <div className="auth-bullet">✓ Détection phishing IA</div>
          <div className="auth-bullet">✓ Score de sécurité 0–100</div>
          <div className="auth-bullet">✓ Assistant bilingue FR / EN</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h1>Connexion</h1>
          <p className="auth-sub">Bienvenue ! Entrez vos identifiants.</p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vous@exemple.com"
              />
            </div>
            <div className="auth-field">
              <div className="auth-field-row">
                <label>Mot de passe</label>
                <Link to="/forgot-password" className="auth-link-sm">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            {error && <div className="auth-error">⚠ {error}</div>}
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Chargement..." : "Se connecter"}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          {/* ✅ Google Button */}
          <div
            ref={googleBtnRef}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          ></div>

          <p className="auth-switch">
            Pas encore de compte? <Link to="/signup">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
