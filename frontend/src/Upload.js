import { useState, useRef } from "react";
import "./Upload.css";

// ── Icônes SVG ────────────────────────────────────────────────────────────────

const IconFolder = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconMail = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconCheckCircle = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconFile = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const IconX = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconLightbulb = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconCircle = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

// ── Wrappers designés ─────────────────────────────────────────────────────────

/** Badge étape — icône bleue sur fond bleu pâle */
const BadgeIcon = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      borderRadius: 6,
      background: "rgba(37,99,235,.15)",
      color: "#2563eb",
      flexShrink: 0,
    }}
  >
    <IconFolder />
  </span>
);

/** Icône drop-zone — cercle avec halo coloré */
const DropIcon = ({ done }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: done ? "rgba(34,197,94,.12)" : "rgba(37,99,235,.08)",
      color: done ? "#16a34a" : "#2563eb",
      marginBottom: 14,
      border: `1.5px solid ${
        done ? "rgba(34,197,94,.3)" : "rgba(37,99,235,.2)"
      }`,
      transition: "all .3s",
    }}
  >
    {done ? <IconCheckCircle /> : <IconMail />}
  </span>
);

/** Icône fichier — carré vert */
const FileBoxIcon = () => (
  <span
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "rgba(34,197,94,.13)",
      color: "#16a34a",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      border: "1px solid rgba(34,197,94,.22)",
    }}
  >
    <IconFile />
  </span>
);

/** Bouton suppression fichier */
const RemoveBtn = ({ onClick }) => (
  <button
    className="file-remove"
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "rgba(239,68,68,.08)",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,.18)",
        transition: "background .2s",
      }}
    >
      <IconX />
    </span>
  </button>
);

/** Icône ampoule — carré ambre */
const HintIcon = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: 8,
      background: "rgba(234,179,8,.12)",
      color: "#b45309",
      flexShrink: 0,
      border: "1px solid rgba(234,179,8,.22)",
      marginTop: 1,
    }}
  >
    <IconLightbulb />
  </span>
);

/** Icône step loading avec état coloré */
const StepIcon = ({ state }) => {
  const styles = {
    done: {
      bg: "rgba(34,197,94,.12)",
      color: "#16a34a",
      border: "rgba(34,197,94,.25)",
    },
    active: {
      bg: "rgba(37,99,235,.10)",
      color: "#2563eb",
      border: "rgba(37,99,235,.25)",
    },
    pending: {
      bg: "rgba(148,163,184,.1)",
      color: "#94a3b8",
      border: "rgba(148,163,184,.2)",
    },
  };
  const s = styles[state];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 7,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        flexShrink: 0,
        transition: "all .3s",
      }}
    >
      {state === "done" && <IconCheck />}
      {state === "active" && <IconClock />}
      {state === "pending" && <IconCircle />}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────────────────────

export default function Upload({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const ref = useRef();

  const STEPS = [
    "Lecture des métadonnées…",
    "Scan des liens…",
    "Analyse du contenu…",
    "Génération du rapport…",
  ];

  const pick = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".eml")) {
      alert("Veuillez sélectionner un fichier .eml");
      return;
    }
    setFile(f);
  };

  const analyze = () => {
    if (!file) return;
    setLoading(true);
    setStep(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const emlData = { content: e.target.result, name: file.name };
      let s = 0;
      const iv = setInterval(() => {
        s++;
        setStep(s);
        if (s >= STEPS.length) {
          clearInterval(iv);
          setTimeout(() => {
            setLoading(false);
            onAnalyze(emlData);
          }, 400);
        }
      }, 800);
    };
    reader.readAsText(file);
  };

  const stepState = (i) => {
    if (i < step) return "done";
    if (i === step) return "active";
    return "pending";
  };

  return (
    <div className="upload-page">
      {/* Header */}
      <div className="upload-header">
        <div className="upload-badge">
          <BadgeIcon /> Étape 1 sur 2
        </div>
        <h1>
          Importez votre <span>Email</span>
        </h1>
        <p>
          Chargez votre fichier .eml et laissez notre plateforme analyser les
          menaces de sécurité en quelques secondes.
        </p>
      </div>

      {/* Card */}
      <div className="upload-card">
        {/* Drop zone */}
        <div
          className={`drop-zone ${over ? "over" : ""} ${file ? "done" : ""}`}
          onClick={() => ref.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            pick(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={ref}
            type="file"
            accept=".eml"
            style={{ display: "none" }}
            onChange={(e) => pick(e.target.files[0])}
          />
          <DropIcon done={!!file} />
          <h3>
            {file
              ? "Fichier sélectionné !"
              : "Glissez-déposez votre fichier ici"}
          </h3>
          <p>
            ou <strong>cliquez pour sélectionner</strong> un fichier depuis
            votre ordinateur
          </p>
        </div>

        {/* Aperçu fichier */}
        {file && (
          <div className="file-preview">
            <FileBoxIcon />
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <RemoveBtn
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            />
          </div>
        )}

        {/* Hint */}
        <div className="upload-hint">
          <HintIcon />
          <p>
            Pour exporter au format <strong>.eml</strong> depuis Outlook : clic
            droit → "Enregistrer sous". Depuis Gmail : menu "Plus" →
            "Télécharger le message".
          </p>
        </div>

        {/* Bouton */}
        <button className="analyze-btn" disabled={!file} onClick={analyze}>
          Analyser cet email
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <h3>Analyse en cours…</h3>
            <p>Notre plateforme examine votre email en profondeur.</p>
            <div className="loading-steps">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`load-step ${
                    i < step ? "done" : i === step ? "active" : ""
                  }`}
                >
                  <StepIcon state={stepState(i)} /> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
