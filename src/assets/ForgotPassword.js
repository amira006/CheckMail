import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) { setError("Veuillez entrer votre adresse email."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Adresse email invalide."); return; }
    setLoading(true);
    // Replace with real reset logic
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="auth-page">

      {/* Left */}
      <div className="auth-left">
        <Link to="/" className="auth-logo">Secure<span>Mail</span></Link>
        <h2>Récupérez<br />votre accès.</h2>
        <p>Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
        <div className="auth-bullets">
          <div className="auth-bullet"><span>✓</span> Lien sécurisé par chiffrement</div>
          <div className="auth-bullet"><span>✓</span> Valable 15 minutes</div>
          <div className="auth-bullet"><span>✓</span> Vérifiez vos spams si nécessaire</div>
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-box">

          {!sent ? (
            <>
              <div className="fp-icon"></div>
              <h1>Mot de passe oublié ?</h1>
              <p className="auth-sub">Pas de panique ! Entrez votre email et on s'occupe du reste.</p>

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label>Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="vous@exemple.com"
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "Envoyer le lien"}
                </button>
              </form>

              <p className="auth-switch" style={{ marginTop: 24 }}>
                <Link to="/login">← Retour à la connexion</Link>
              </p>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon"></div>
              <h1>Email envoyé !</h1>
              <p>Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.</p>
              <p style={{ marginTop: 8 }}>Vérifiez votre boîte de réception et vos spams.</p>
              <Link to="/login" className="auth-btn" style={{ marginTop: 28, textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                Retour à la connexion
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}