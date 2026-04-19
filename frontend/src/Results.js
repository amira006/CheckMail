import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Results.css";
import { saveAnalysis, checkIfEmailSaved } from "./emailService";
import { saveMessage, getChatHistory } from "./chatService";
import { getToken } from "./authService";

// ============================================================
// 🛠️ HELPERS
// ============================================================

function decodeMimeHeader(str) {
  if (!str) return str;
  return str.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_, charset, encoding, encoded) => {
      try {
        if (encoding.toUpperCase() === "B") {
          return decodeURIComponent(escape(atob(encoded)));
        } else {
          const qp = encoded
            .replace(/_/g, " ")
            .replace(/=([0-9A-Fa-f]{2})/g, (__, hex) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          return decodeURIComponent(escape(qp));
        }
      } catch {
        return encoded;
      }
    }
  );
}

function parseMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/[*]([^*\n]+?)[*]/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^[-] +(.+)$/gm, "<li>$1</li>")
    .replace(
      /(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g,
      (m) => `<ul>${m}</ul>`
    )
    .replace(/(?<!>)\n(?!<)/g, "<br/>")
    .replace(/(<br\/>){2,}/g, "<br/>");
}

// ============================================================
// ✅ CONSENT API HELPER
// ============================================================

const saveConsentToDB = async (consent) => {
  const token = getToken();
  if (!token) return;
  try {
    await fetch("/auth-api/api/user/consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ consent }),
    });
  } catch {}
};

// ============================================================
// 🪙 TOKEN HELPERS
// ============================================================

const deductChatToken = async () => {
  const token = getToken();
  if (!token) return { success: true };
  try {
    const res = await fetch("/auth-api/api/plan/chat-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: true };
  }
};

const deductPdfToken = async () => {
  const token = getToken();
  if (!token) return { success: true };
  try {
    const res = await fetch("/auth-api/api/plan/pdf-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: true };
  }
};

// ============================================================
// 🎨 SUB-COMPONENTS
// ============================================================

function ScoreRing({ score, color }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="8"
      />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BotIcon({ size = 50 }) {
  return (
    <img
      src="/robott.png"
      alt="robot"
      className="robot-icon"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

function TokenBadge({ tokens }) {
  if (tokens === null || tokens === undefined) return null;
  const isUnlimited = tokens === "illimité";
  const isLow = !isUnlimited && tokens <= 20;

  let cls = "rp-token-badge";
  if (isUnlimited) cls += " unlimited";
  else if (isLow) cls += " low";

  return (
    <div className={cls}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {isUnlimited ? "Illimité" : `${tokens} tokens`}
    </div>
  );
}

// ============================================================
// ✅ CONSENT MODAL
// ============================================================

function ConsentModal({ onAccept, onDecline }) {
  const items = [
    "Expéditeur et objet de l'email",
    "Score de sécurité et verdict",
    "Liens et pièces jointes détectés",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.75rem",
          maxWidth: 420,
          width: "90%",
          border: "0.5px solid rgba(0,0,0,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(37,99,235,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h2
          style={{
            fontSize: 17,
            fontWeight: 600,
            marginBottom: 8,
            color: "#1e293b",
          }}
        >
          Autoriser l'enregistrement des données ?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
          }}
        >
          CheckMail souhaite enregistrer les métadonnées de cet email pour
          améliorer la détection des menaces. Aucun contenu de l'email ne sera
          stocké.
        </p>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: "1.25rem",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#64748b",
                padding: "3px 0",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#2563EB",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {item}
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: 8,
              paddingTop: 8,
            }}
          >
            {[
              "Données anonymisées et chiffrées",
              "Aucun contenu email stocké",
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#059669",
                  padding: "2px 0",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              border: "0.5px solid #e2e8f0",
              background: "#fff",
              color: "#374151",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Refuser
          </button>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              background: "#2563EB",
              color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#1E40AF")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#2563EB")}
          >
            Autoriser
          </button>
        </div>

        <p
          style={{
            fontSize: 11,
            color: "#94a3b8",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Vous pouvez changer ce choix à tout moment dans vos paramètres
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 🚀 MAIN COMPONENT
// ============================================================

export default function Results({ emlData, onBack }) {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [history, setHistory] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [emailId, setEmailId] = useState(null);
  const [userTokens, setUserTokens] = useState(null);

  const [showConsent, setShowConsent] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const [pendingMeta, setPendingMeta] = useState(null);

  const msgsRef = useRef();

  const meta = emlData?.content
    ? {
        from: decodeMimeHeader(
          (emlData.content.match(/^From:\s*(.+)$/im) || [])[1] || "—"
        ),
        subject: decodeMimeHeader(
          (emlData.content.match(
            /^Subject:\s*([\s\S]+?)(?=\r?\n\S|\r?\n\r?\n)/im
          ) || [])[1]
            ?.replace(/\r?\n\s+/g, " ")
            .trim() || "—"
        ),
        date: (emlData.content.match(/^Date:\s*(.+)$/im) || [])[1] || "—",
        links: (emlData.content.match(/https?:\/\/[^\s"<>]+/g) || []).length,
        attach: (emlData.content.match(/filename[*=]+["']?([^"'\s;]+)/gi) || [])
          .length,
        file: emlData?.name || "—",
      }
    : {};

  useEffect(() => {
    if (msgsRef.current && msgs.length > 0) msgsRef.current.scrollTop = 0;
  }, [emailId]);

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    if (!emlData?.content) {
      setMsgs([
        {
          role: "bot",
          text: "Aucun email chargé. Retournez importer un fichier .eml.",
          chips: [],
        },
      ]);
      setBusy(false);
      return;
    }
    runAnalysis();
  }, []); // eslint-disable-line

  useEffect(() => {
    const fetchTokens = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch("/auth-api/api/plan/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUserTokens(data.data.tokens);
      } catch {}
    };
    fetchTokens();
  }, []);

  // ============================================================
  // ✅ SAVE ANALYSIS
  // ============================================================

  const doSaveAnalysis = async (rep, metaData) => {
    try {
      const saved = await saveAnalysis(
        emlData.name,
        rep,
        metaData,
        emlData.content
      );
      const savedId = saved?.id || null;
      setEmailId(savedId);

      if (savedId) {
        const oldMsgs = await getChatHistory(savedId);
        if (oldMsgs?.length > 0) {
          setMsgs((prev) => [
            ...prev,
            ...oldMsgs.map((m) => ({
              role: m.role === "user" ? "user" : "bot",
              text: m.content,
              chips: [],
            })),
          ]);
          setHistory((prev) => [
            ...prev,
            ...oldMsgs.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          ]);
        }
      }
    } catch {}
  };

  // ============================================================
  // ✅ CONSENT HANDLERS
  // ============================================================

  const handleConsentAccept = async () => {
    await saveConsentToDB(true);
    setShowConsent(false);
    if (pendingReport && pendingMeta) {
      await doSaveAnalysis(pendingReport, pendingMeta);
    }
    setPendingReport(null);
    setPendingMeta(null);
  };

  const handleConsentDecline = () => {
    saveConsentToDB(false);
    setShowConsent(false);
    setPendingReport(null);
    setPendingMeta(null);
  };

  // ============================================================
  // 🔍 ANALYSIS
  // ============================================================

  const runAnalysis = async () => {
    setTyping(true);
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emlContent: emlData.content,
          emlName: emlData.name,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      if (data.error === "rate_limit") {
        navigate("/forfaits");
        return;
      }

      let rep = null;
      if (
        data.report &&
        typeof data.report === "object" &&
        data.report.score !== undefined
      ) {
        rep = data.report;
      }
      if (!rep && data.result) {
        const text =
          typeof data.result === "string"
            ? data.result
            : JSON.stringify(data.result);
        const jm = text.match(/\{[\s\S]*?"score"[\s\S]*?"verdict"[\s\S]*?\}/);
        if (jm) {
          try {
            rep = JSON.parse(jm[0]);
          } catch (_) {}
        }
      }

      if (rep) setReport(rep);

      const sc = rep?.score ?? null;
      const vLabel =
        rep?.verdict === "SAFE"
          ? "Email sûr"
          : rep?.verdict === "SUSPICIOUS"
          ? "Suspect"
          : rep?.verdict === "DANGEROUS"
          ? "Dangereux"
          : "Inconnu";

      let chips =
        rep?.score >= 70
          ? [
              "Pourquoi il est sûr ?",
              "Puis-je répondre ?",
              "Détails techniques",
            ]
          : rep?.score >= 40
          ? ["Pourquoi suspect ?", "Quels risques ?", "Que faire ?"]
          : ["Pourquoi dangereux ?", "Supprimer email ?", "Signaler phishing"];

      let extraMsg =
        typeof data.result === "string"
          ? data.result
              .replace(/\{[\s\S]*?"score"[\s\S]*?"verdict"[\s\S]*?\}/, "")
              .trim()
          : "";

      const cm = extraMsg.match(/CHIPS:\s*(.+)/);
      if (cm) {
        chips = cm[1]
          .split("|")
          .map((s) => s.trim())
          .slice(0, 3);
        extraMsg = extraMsg.replace(/CHIPS:.*/, "").trim();
      }

      const baseContext = [
        {
          role: "user",
          content: `[CTX] ${JSON.stringify(rep)} ${emlData.content.substring(
            0,
            2000
          )}`,
        },
        { role: "assistant", content: "Prêt." },
      ];

      const authToken = getToken();
      if (authToken) {
        try {
          const planRes = await fetch("/auth-api/api/plan/analyze", {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const planData = await planRes.json();
          if (!planData.success) {
            navigate("/forfaits");
            return;
          }
          setUserTokens(planData.data.tokens);
        } catch {}
      }

      const welcomeText = rep
        ? `Bonjour ! 👋 J'ai analysé votre email **${
            emlData?.name || ""
          }**.\n\n` +
          `Voici ce que j'ai trouvé :\n` +
          `- Score de sécurité : **${sc}/100**\n` +
          `- Verdict : **${vLabel}**\n` +
          `- ${rep.summary || ""}\n\n` +
          (extraMsg ? `${extraMsg}\n\n` : "") +
          `Posez-moi vos questions sur cet email 👇`
        : `Bonjour ! L'analyse est terminée. Posez-moi vos questions 👇`;

      setTyping(false);
      setBusy(false);
      setMsgs([{ role: "bot", text: welcomeText, chips }]);
      setHistory(baseContext);

      // ============================================================
      // ✅ CONSENT LOGIC
      // checkIfEmailSaved importé de emailService — même hash garanti
      // ============================================================
      if (rep) {
        const alreadySaved = await checkIfEmailSaved(emlData.content);
        if (alreadySaved) {
          // Email deja sauvegardé → pas de modal
          await doSaveAnalysis(rep, meta);
        } else {
          // Email nouveau → afficher modal
          setPendingReport(rep);
          setPendingMeta(meta);
          setTimeout(() => setShowConsent(true), 1200);
        }
      }
    } catch (e) {
      setTyping(false);
      setBusy(false);
      setMsgs([
        {
          role: "bot",
          text: `Une erreur est survenue : ${e.message}`,
          chips: [],
        },
      ]);
    }
  };

  // ============================================================
  // 💬 SEND MESSAGE
  // ============================================================

  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (
        typeof overrideText === "string" ? overrideText : input
      ).trim();
      if (!text || typing) return;
      setInput("");

      const tokenResult = await deductChatToken();
      if (tokenResult && !tokenResult.success) {
        navigate("/forfaits");
        return;
      }
      if (tokenResult?.data?.tokens !== undefined)
        setUserTokens(tokenResult.data.tokens);

      setMsgs((p) => [
        ...p.map((m) => ({ ...m, chips: [] })),
        { role: "user", text },
      ]);

      const newH = [
        ...history.filter((m) => !m.content?.startsWith("[CTX]")),
        { role: "user", content: text },
      ];
      setHistory((p) => [...p, { role: "user", content: text }]);
      setTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newH.slice(-10),
            report,
            emlSnippet: emlData?.content?.substring(0, 2000),
          }),
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const reply = data.reply || "Désolé, veuillez réessayer.";

        if (reply === "__RATE_LIMIT__") {
          setTyping(false);
          navigate("/forfaits");
          return;
        }

        setTyping(false);
        setMsgs((p) => [...p, { role: "bot", text: reply, chips: [] }]);
        setHistory((p) => [...p, { role: "assistant", content: reply }]);

        if (emailId) {
          saveMessage(emailId, "user", text);
          saveMessage(emailId, "assistant", reply);
        }
      } catch (e) {
        setTyping(false);
        setMsgs((p) => [
          ...p,
          { role: "bot", text: `Erreur : ${e.message}`, chips: [] },
        ]);
      }
    },
    [input, typing, report, history, emlData, emailId, navigate]
  );

  // ============================================================
  // 📄 PDF DOWNLOAD
  // ============================================================

  const downloadPDF = async () => {
    if (!report) return alert("L'analyse n'est pas encore terminée.");
    setPdfBusy(true);

    const tokenResult = await deductPdfToken();
    if (tokenResult && !tokenResult.success) {
      setPdfBusy(false);
      navigate("/forfaits");
      return;
    }
    if (tokenResult?.data?.tokens !== undefined)
      setUserTokens(tokenResult.data.tokens);

    try {
      const res = await fetch("/api/report/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, meta }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CheckMail_${report.verdict}_${report.score}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Erreur PDF : ${e.message}`);
    } finally {
      setPdfBusy(false);
    }
  };

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  const score = report?.score ?? null;
  const ringColor =
    score === null
      ? "#e2e8f0"
      : score >= 70
      ? "#22c55e"
      : score >= 40
      ? "#f59e0b"
      : "#ef4444";

  const VM = {
    SAFE: { cls: "safe", label: "Email sûr" },
    SUSPICIOUS: { cls: "warn", label: "Suspect" },
    DANGEROUS: { cls: "danger", label: "Dangereux" },
  };
  const verdict = VM[report?.verdict] || {
    cls: "pending",
    label: "Analyse en cours",
  };

  return (
    <div className="rp-wrap">
      {showConsent && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}

      <div className="rp-left">
        <div className="rp-header">
          <div>
            <h1>Rapport de sécurité</h1>
            <span className="rp-fname">{emlData?.name || "—"}</span>
          </div>
          <div className="rp-header-btns">
            {onBack && (
              <button className="rp-btn-outline" onClick={onBack}>
                ← Retour
              </button>
            )}
            <button
              className="rp-btn-primary"
              onClick={downloadPDF}
              disabled={pdfBusy || !report}
            >
              {pdfBusy ? "Génération…" : "Télécharger PDF"}
            </button>
          </div>
        </div>

        <div className="rp-divider" />

        <div className="rp-score-section">
          <div className="rp-ring-wrap">
            <ScoreRing score={score ?? 0} color={ringColor} />
            <div className="rp-ring-center">
              <strong style={{ color: score !== null ? ringColor : "#94a3b8" }}>
                {score !== null ? score : "—"}
              </strong>
              <span>/100</span>
            </div>
          </div>
          <div className={`rp-verdict ${verdict.cls}`}>{verdict.label}</div>
          <p className="rp-summary">
            {report?.summary || "L'analyse de votre email est en cours…"}
          </p>
        </div>

        <div className="rp-divider" />

        <div>
          <div className="rp-section-title">Détails de l'email</div>
          <table className="rp-table">
            <tbody>
              <tr>
                <td>Fichier</td>
                <td>{emlData?.name || "—"}</td>
              </tr>
              <tr>
                <td>Expéditeur</td>
                <td style={{ wordBreak: "break-all" }}>{meta.from || "—"}</td>
              </tr>
              <tr>
                <td>Objet</td>
                <td style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                  {meta.subject || "—"}
                </td>
              </tr>
              <tr>
                <td>Liens</td>
                <td>{meta.links > 0 ? `${meta.links} lien(s)` : "Aucun"}</td>
              </tr>
              <tr>
                <td>Pièces jointes</td>
                <td>
                  {meta.attach > 0 ? `${meta.attach} pièce(s)` : "Aucune"}
                </td>
              </tr>
              <tr>
                <td>Date</td>
                <td>{meta.date || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rp-chat">
        <div className="rp-chat-topbar">
          <BotIcon size={60} />

          <div className="rp-chat-topbar-info">
            <h3>CheckMail</h3>
            <p>
              <span className="rp-dot" /> En ligne
            </p>
          </div>
          <div className="rp-topbar-right">
            {(typing || busy) && (
              <span className="rp-thinking">Analyse en cours…</span>
            )}
            <TokenBadge tokens={userTokens} />
          </div>
        </div>

        <div className="rp-msgs" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`rp-msg ${m.role}`}>
              <div className="rp-msg-inner">
                <div className="rp-msg-content">
                  <div className="rp-msg-sender">
                    {m.role === "bot" ? "CheckMail" : "Vous"}
                  </div>
                  {/* rp-bub handles bubble styling for both bot and user via CSS */}
                  <div
                    className="rp-bub"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }}
                  />
                  {m.chips?.length > 0 && (
                    <div className="rp-chips">
                      {m.chips.map((c, j) => (
                        <button
                          key={j}
                          className="rp-chip"
                          onClick={() => sendMessage(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="rp-msg bot">
              <div className="rp-msg-inner">
                <div className="rp-msg-content">
                  <div className="rp-msg-sender">CheckMail</div>
                  <div className="rp-tdots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rp-input-area">
          <div className="rp-input-box">
            <input
              className="rp-input"
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Posez votre question…"
            />
            <button
              className="rp-send"
              onClick={sendMessage}
              disabled={busy || !input.trim()}
            >
              <SendIcon />
            </button>
          </div>
          <p className="rp-input-hint">Appuyez sur Entrée pour envoyer</p>
        </div>
      </div>
    </div>
  );
}
