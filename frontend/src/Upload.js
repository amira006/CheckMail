import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "./authService";
import Forfaits from "./Forfaits";
import tutorial from "./media/tutorial.mp4";
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
const IconPlay = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform .3s ease",
    }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ── Wrappers designés ─────────────────────────────────────────────────────────

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

// ── Video Tutorial Component ──────────────────────────────────────────────────

const VideoTutorial = ({ src }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(37,99,235,.15)",
        background: "rgba(37,99,235,.03)",
        overflow: "hidden",
        transition: "box-shadow .2s",
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Play badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(37,99,235,.12)",
            color: "#2563eb",
            border: "1px solid rgba(37,99,235,.22)",
            flexShrink: 0,
          }}
        >
          <IconPlay />
        </span>

        {/* Label */}
        <span style={{ flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            Tutoriel vidéo
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "#64748b",
              marginTop: 1,
            }}
          >
            Comment télécharger un fichier .eml ?
          </span>
        </span>

        {/* Chevron */}
        <span style={{ color: "#94a3b8", display: "inline-flex" }}>
          <IconChevron open={open} />
        </span>
      </button>

      {/* Collapsible video area */}
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: "hidden",
          transition: "max-height .4s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div style={{ padding: "0 16px 16px" }}>
          <video
            controls
            style={{
              width: "100%",
              borderRadius: 10,
              background: "#000",
              display: "block",
              maxHeight: 340,
              outline: "none",
              border: "1px solid rgba(0,0,0,.08)",
            }}
          >
            <source src={src} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      </div>
    </div>
  );
};

// ── Component Principal ───────────────────────────────────────────────────────

const TUTORIAL_VIDEO_URL = tutorial;

export default function Upload({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [quota, setQuota] = useState(null);
  const [showForfaits, setShowForfaits] = useState(false);
  const ref = useRef();

  const STEPS = [
    "Lecture des métadonnées…",
    "Scan des liens…",
    "Analyse du contenu…",
    "Génération du rapport…",
  ];

  useEffect(() => {
    const checkQuota = async () => {
      try {
        const res = await fetch("/auth-api/api/plan/check", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (data.success) {
          const { tokens, unlimited, allowed } = data.data;
          setQuota({ tokens, unlimited, allowed });
          if (!allowed) setShowForfaits(true);
        }
      } catch (err) {
        console.error("Erreur quota:", err);
      }
    };
    checkQuota();
  }, []);

  const pick = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".eml")) {
      alert("Veuillez sélectionner un fichier .eml");
      return;
    }
    setFile(f);
  };

  const analyze = async () => {
    if (!file) return;

    try {
      const res = await fetch("/auth-api/api/plan/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (!data.success) {
        setQuota((prev) => (prev ? { ...prev, allowed: false } : prev));
        setShowForfaits(true);
        return;
      }

      if (data.data) {
        setQuota((prev) =>
          prev
            ? {
                ...prev,
                tokens: data.data.tokens,
                unlimited: data.data.unlimited ?? prev.unlimited,
                allowed: data.data.allowed ?? data.data.tokens > 0,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Erreur vérification quota:", err);
      alert("Erreur de connexion. Veuillez réessayer.");
      return;
    }

    setLoading(true);
    setStep(0);
    const reader = new FileReader();
    reader.onload = async (e) => {
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
    if (i === step && step < STEPS.length) return "active";
    return "pending";
  };

  return (
    <div className="upload-page">
      {showForfaits && <Forfaits onClose={() => setShowForfaits(false)} />}

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

        {quota && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              padding: "6px 14px",
              borderRadius: 20,
              background: quota.allowed
                ? "rgba(34,197,94,.1)"
                : "rgba(239,68,68,.1)",
              border: `1px solid ${
                quota.allowed ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"
              }`,
              fontSize: 13,
              color: quota.allowed ? "#16a34a" : "#ef4444",
              fontWeight: 500,
            }}
          >
            {quota.unlimited
              ? "✓ Analyses illimitées"
              : quota.allowed
              ? `✓ ${quota.tokens} token${quota.tokens > 1 ? "s" : ""} restant${
                  quota.tokens > 1 ? "s" : ""
                }`
              : "✕ Tokens insuffisants — Passez à un forfait supérieur"}
          </div>
        )}
      </div>

      {/* Card */}
      <div className="upload-card">
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

        {/* ── Video Tutorial ── */}
        <div style={{ marginTop: 12 }}>
          <VideoTutorial src={TUTORIAL_VIDEO_URL} />
        </div>

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
                    i < step
                      ? "done"
                      : i === step && step < STEPS.length
                      ? "active"
                      : ""
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
