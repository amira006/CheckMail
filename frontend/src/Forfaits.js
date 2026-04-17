import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import "./Forfaits.css";

// ── Icônes ─────────────────────────────────

const IconFree = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
  </svg>
);

const IconPro = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconBusiness = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M9 7h6M9 12h6M9 17h4" />
  </svg>
);

const IconPopular = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PLAN_ICONS = {
  gratuit: IconFree,
  pro: IconPro,
  business: IconBusiness,
};

// ── Plans ─────────────────────────────────

const plans = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: "0€",
    priceRaw: 0,
    period: "/mois",
    color: "#6b7280",
    features: [
      "3 analyses / semaine",
      "Score de sécurité",
      "Détection phishing IA",
      "Historique 7 jours",
    ],
    cta: "Plan actuel",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "5€",
    priceRaw: 5,
    period: "/mois",
    color: "#4f46e5",
    popular: true,
    features: [
      "50 analyses / semaine",
      "Score de sécurité",
      "Détection phishing IA",
      "Historique illimité",
      "Assistant IA prioritaire",
      "Support email",
    ],
    cta: "Choisir Pro",
    disabled: false,
  },
  {
    id: "business",
    name: "Business",
    price: "20€",
    priceRaw: 20,
    period: "/mois",
    color: "#059669",
    features: [
      "Analyses illimitées",
      "Score de sécurité",
      "Détection phishing IA",
      "Historique illimité",
      "Assistant IA prioritaire",
      "Accès API",
      "Support prioritaire 24/7",
      "Tableau de bord équipe",
    ],
    cta: "Choisir Business",
    disabled: false,
  },
];

// ── Component ─────────────────────────────────

export default function Forfaits() {
  const navigate = useNavigate();

  // état pour ouvrir le modal de paiement
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSuccess = (plan) => {
    console.log("Paiement réussi :", plan.name);
    navigate("/dashboard"); // redirection après paiement
  };

  return (
    <div className="forfaits-overlay">
      <div className="forfaits-modal" onClick={(e) => e.stopPropagation()}>
        <button className="forfaits-close" onClick={() => navigate("/")}>
          ✕
        </button>

        <div className="forfaits-header">
          <h1>Choisissez votre forfait</h1>
          <p>
            Vous avez utilisé toutes vos analyses gratuites. Passez à un plan
            supérieur pour continuer.
          </p>
        </div>

        <div className="forfaits-cards">
          {plans.map((plan) => {
            const PlanIcon = PLAN_ICONS[plan.id];

            return (
              <div
                key={plan.id}
                className={`forfait-card ${plan.popular ? "popular" : ""}`}
                style={{ "--plan-color": plan.color }}
              >
                {plan.popular && (
                  <div className="forfait-badge">
                    <IconPopular /> Populaire
                  </div>
                )}

                <div className="forfait-icon">
                  <PlanIcon />
                </div>

                <h2>{plan.name}</h2>

                <div className="forfait-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>

                <ul className="forfait-features">
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <IconCheck />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`forfait-btn ${plan.disabled ? "disabled" : ""}`}
                  disabled={plan.disabled}
                  onClick={() => !plan.disabled && setSelectedPlan(plan)}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="forfaits-footer">
          Paiement sécurisé · Annulation à tout moment · Sans engagement
        </p>
      </div>

      {/* Modal de paiement */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
