import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/"); }, 1200);
  };

  return (
    <div className="auth-page">

      {/* Left */}
      <div className="auth-left">
        <Link to="/" className="auth-logo">Secure<span>Mail</span></Link>
        <h2>Analysez vos emails,<br />protégez vos données.</h2>
        <p>Notre IA détecte le phishing et les menaces en quelques secondes.</p>
        <div className="auth-bullets">
          <div className="auth-bullet"><span>✓</span> Détection phishing IA</div>
          <div className="auth-bullet"><span>✓</span> Score de sécurité 0–100</div>
          <div className="auth-bullet"><span>✓</span> Assistant bilingue FR / EN</div>
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-box">
          <h1>Connexion</h1>
          <p className="auth-sub">Bienvenue ! Entrez vos identifiants.</p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Adresse email</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="vous@exemple.com" />
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label>Mot de passe</label>
                <Link to="/forgot-password" className="auth-link-sm">Mot de passe oublié ?</Link>
              </div>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="••••••••" />
            </div>

            {error && <div className="auth-error"> {error}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Se connecter"}
            </button>
          </form>

          <div className="auth-divider"><span>ou</span></div>

          <button className="auth-google">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}