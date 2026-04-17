import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError("Minimum 8 caractères");
    if (!/[A-Z]/.test(password)) return setError("Au moins une majuscule");
    if (!/[0-9]/.test(password)) return setError("Au moins un chiffre");
    if (password !== confirm)
      return setError("Les mots de passe ne correspondent pas");

    setLoading(true);
    try {
      console.log("Token envoyé:", token); // ✅ debug

      const res = await fetch("/auth-api/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      console.log("Status:", res.status); // ✅ debug
      const data = await res.json();
      console.log("Response:", data); // ✅ debug

      if (!data.success) throw new Error(data.message);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Erreur serveur");
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
          Nouveau
          <br />
          mot de passe.
        </h2>
        <p>Choisissez un mot de passe fort pour sécuriser votre compte.</p>
        <div className="auth-bullets">
          <div className="auth-bullet">✓ Minimum 8 caractères</div>
          <div className="auth-bullet">✓ Au moins une majuscule</div>
          <div className="auth-bullet">✓ Au moins un chiffre</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          {!success ? (
            <>
              <div className="fp-icon">🔒</div>
              <h1>Nouveau mot de passe</h1>
              <p className="auth-sub">Entrez votre nouveau mot de passe.</p>

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                  />
                </div>
                <div className="auth-field">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                  />
                </div>
                {error && <div className="auth-error">⚠ {error}</div>}
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? "Chargement..." : "Réinitialiser"}
                </button>
              </form>
            </>
          ) : (
            <div className="fp-success">
              <h1>Mot de passe modifié !</h1>
              <p>Vous allez être redirigé vers la connexion...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
