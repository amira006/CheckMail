import { useState } from "react";
import "./PaymentModal.css";

const IconLock = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function formatCard(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const v = value.replace(/\D/g, "").slice(0, 4);
  return v.length >= 3 ? v.slice(0, 2) + "/" + v.slice(2) : v;
}

export default function PaymentModal({ plan, onClose, onSuccess }) {
  const [fields, setFields] = useState({
    holder: "",
    cardnum: "",
    expiry: "",
    cvc: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "cardnum") v = formatCard(value);
    if (name === "expiry") v = formatExpiry(value);
    if (name === "cvc") v = value.replace(/\D/g, "").slice(0, 4);
    setFields((f) => ({ ...f, [name]: v }));
  };

  const validate = () => {
    if (!fields.holder.trim())
      return "Veuillez saisir le titulaire de la carte.";
    if (fields.cardnum.replace(/\s/g, "").length < 16)
      return "Numéro de carte invalide.";
    if (fields.expiry.length < 5) return "Date d'expiration invalide.";
    if (fields.cvc.length < 3) return "CVC invalide.";
    return null;
  };

  const handlePay = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/payment/fake-upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur lors du paiement.");
      }

      setSuccess(true);
      onSuccess?.(plan);
    } catch (e) {
      setError(e.message || "Erreur de paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const tva = parseFloat(plan.priceRaw) * 0.2;
  const nextBilling = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("fr-FR");

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onClose}>
          ✕
        </button>

        {!success ? (
          <>
            <div className="payment-header">
              <div
                className="payment-plan-badge"
                style={{ "--plan-color": plan.color }}
              >
                {plan.name}
              </div>
              <div className="payment-price">
                {plan.price}
                <span>{plan.period}</span>
              </div>
            </div>

            <h2>Paiement sécurisé</h2>

            <div className="payment-fields">
              <div className="pf-group">
                <label>Titulaire</label>
                <input
                  name="holder"
                  value={fields.holder}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  autoComplete="cc-name"
                />
              </div>
              <div className="pf-group">
                <label>Numéro de carte</label>
                <input
                  name="cardnum"
                  value={fields.cardnum}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className="pf-row">
                <div className="pf-group">
                  <label>Expiration</label>
                  <input
                    name="expiry"
                    value={fields.expiry}
                    onChange={handleChange}
                    placeholder="MM/AA"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </div>
                <div className="pf-group">
                  <label>CVC</label>
                  <input
                    name="cvc"
                    value={fields.cvc}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
            </div>

            {error && <p className="payment-error">{error}</p>}

            <div className="payment-summary">
              <div className="ps-row">
                <span>{plan.name}</span>
                <span>
                  {plan.price}
                  {plan.period}
                </span>
              </div>
              <div className="ps-row">
                <span>TVA (20%)</span>
                <span>{tva.toFixed(2)} €</span>
              </div>
              <div className="ps-row total">
                <span>Total</span>
                <span>{(plan.priceRaw + tva).toFixed(2)} €</span>
              </div>
            </div>

            <button
              className="payment-btn"
              onClick={handlePay}
              disabled={loading}
            >
              <IconLock />
              {loading ? "Traitement..." : `Payer ${plan.price}`}
            </button>

            <p className="payment-legal">
              Paiement SSL · Sans engagement · Annulation à tout moment
            </p>
          </>
        ) : (
          <div className="payment-success">
            <div className="ps-icon">
              <IconCheck />
            </div>
            <h2>Paiement confirmé !</h2>
            <p>
              Votre plan <strong>{plan.name}</strong> est maintenant actif.
            </p>
            <div className="payment-summary">
              <div className="ps-row">
                <span>Plan activé</span>
                <span>{plan.name}</span>
              </div>
              <div className="ps-row">
                <span>Prochain prélèvement</span>
                <span>
                  {plan.price} le {nextBilling}
                </span>
              </div>
            </div>
            <button className="payment-btn" onClick={onClose}>
              Continuer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
