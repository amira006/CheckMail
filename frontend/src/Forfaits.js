import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import "./Forfaits.css";

// ── Icônes SVG ─────────────────────────────────

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

const IconToken = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9h4.5a2.5 2.5 0 0 1 0 5H9" />
  </svg>
);

const IconEmail = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconChat = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconPdf = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const IconRefill = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconInfinity = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" />
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
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
    tokenInfo: "100 tokens offerts",
    features: [
      { icon: IconToken, text: "100 tokens à l'inscription" },
      { icon: IconRefill, text: "+30 tokens / semaine" },
      { icon: IconEmail, text: "10 tokens = 1 analyse email" },
      { icon: IconChat, text: "2 tokens = 1 message chat" },
      { icon: IconPdf, text: "5 tokens = export PDF" },
      { icon: IconCheck, text: "Score de sécurité" },
      { icon: IconCheck, text: "Détection phishing IA" },
      { icon: IconCheck, text: "Historique 7 jours" },
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
    tokenInfo: "+500 tokens à l'achat",
    features: [
      { icon: IconToken, text: "+500 tokens à l'achat" },
      { icon: IconRefill, text: "+30 tokens / semaine" },
      { icon: IconEmail, text: "10 tokens = 1 analyse email" },
      { icon: IconChat, text: "2 tokens = 1 message chat" },
      { icon: IconPdf, text: "5 tokens = export PDF" },
      { icon: IconCheck, text: "Score de sécurité" },
      { icon: IconCheck, text: "Détection phishing IA" },
      { icon: IconCheck, text: "Historique illimité" },
      { icon: IconCheck, text: "Assistant IA prioritaire" },
      { icon: IconCheck, text: "Support email" },
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
    tokenInfo: "Analyses illimitées",
    features: [
      { icon: IconInfinity, text: "Analyses illimitées" },
      { icon: IconInfinity, text: "Chat illimité" },
      { icon: IconInfinity, text: "Export PDF illimité" },
      { icon: IconCheck, text: "Score de sécurité" },
      { icon: IconCheck, text: "Détection phishing IA" },
      { icon: IconCheck, text: "Historique illimité" },
      { icon: IconCheck, text: "Assistant IA prioritaire" },
      { icon: IconCheck, text: "Accès API" },
      { icon: IconCheck, text: "Support prioritaire 24/7" },
      { icon: IconCheck, text: "Tableau de bord équipe" },
    ],
    cta: "Choisir Business",
    disabled: false,
  },
];

// ── Token Banner ─────────────────────────────────

const TokenBanner = ({ plan }) => (
  <div
    style={{
      background: `${plan.color}18`,
      border: `1px solid ${plan.color}44`,
      borderRadius: "8px",
      padding: "8px 12px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "600",
      color: plan.color,
    }}
  >
    <IconToken />
    {plan.tokenInfo}
  </div>
);

// ── Cost Tag ─────────────────────────────────

const CostTag = ({ icon: Icon, label, cost }) => (
  <div
    style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "6px 12px",
      fontSize: "12px",
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    }}
  >
    <Icon />
    <span style={{ fontWeight: 600 }}>{cost}</span> — {label}
  </div>
);

// ── Component ─────────────────────────────────

export default function Forfaits() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSuccess = (plan) => {
    console.log("Paiement réussi :", plan.name);
    navigate("/dashboard");
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
            Vous avez utilisé tous vos tokens. Rechargez ou passez à un plan
            supérieur pour continuer.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "14px",
              flexWrap: "wrap",
            }}
          >
            <CostTag icon={IconEmail} label="Analyse email" cost="10 tokens" />
            <CostTag icon={IconChat} label="Message chat" cost="2 tokens" />
            <CostTag icon={IconPdf} label="Export PDF" cost="5 tokens" />
            <CostTag
              icon={IconRefill}
              label="Refill / semaine"
              cost="+30 tokens"
            />
          </div>
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

                <TokenBanner plan={plan} />

                <ul className="forfait-features">
                  {plan.features.map((f, i) => {
                    const FeatureIcon = f.icon;
                    return (
                      <li key={i}>
                        <FeatureIcon />
                        {f.text}
                      </li>
                    );
                  })}
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
