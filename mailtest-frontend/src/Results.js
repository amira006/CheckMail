import { useState, useEffect, useRef, useCallback } from "react";
import "./Results.css";
import { saveAnalysis, getHistory } from "./emailService";
import { saveMessage, getChatHistory } from "./chatService";

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
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>")
    .replace(
      /(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g,
      (m) => `<ul>${m}</ul>`
    )
    .replace(/(?<!>)\n(?!<)/g, "<br/>")
    .replace(/(<br\/>){2,}/g, "<br/>");
}

function ScoreRing({ score, color }) {
  const r = 42,
    circ = 2 * Math.PI * r;
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

function BotIcon() {
  return (
    <img
      src="/robott.png"
      alt="robot"
      className="robot-icon"
      style={{ width: 50, height: 50, objectFit: "contain" }}
    />
  );
}

function HistIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const VERDICT_MAP = {
  SAFE: { cls: "safe", icon: "✅" },
  SUSPICIOUS: { cls: "warn", icon: "⚠️" },
  DANGEROUS: { cls: "danger", icon: "🔴" },
};

export default function Results({ emlData, onBack }) {
  const [report, setReport] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [history, setHistory] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [emailId, setEmailId] = useState(null);

  const [histOpen, setHistOpen] = useState(false);
  const [histEmails, setHistEmails] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [openedId, setOpenedId] = useState(null);
  const [openedMsgs, setOpenedMsgs] = useState([]);
  const [openedLoading, setOpenedLoading] = useState(false);

  const msgsRef = useRef();
  const histMsgsRef = useRef();

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
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing]);

  useEffect(() => {
    if (histMsgsRef.current)
      histMsgsRef.current.scrollTop = histMsgsRef.current.scrollHeight;
  }, [openedMsgs]);

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

  // ── Historique sidebar ─────────────────────────────────────────────────
  const loadHist = async () => {
    setHistLoading(true);
    try {
      const data = await getHistory(1, 30);
      setHistEmails(data.emails || []);
    } catch (_) {
      setHistEmails([]);
    } finally {
      setHistLoading(false);
    }
  };

  const toggleHist = () => {
    const next = !histOpen;
    setHistOpen(next);
    if (next && histEmails.length === 0) loadHist();
  };

  const openHistChat = async (id) => {
    if (openedId === id) {
      setOpenedId(null);
      setOpenedMsgs([]);
      return;
    }
    setOpenedId(id);
    setOpenedLoading(true);
    try {
      const msgs = await getChatHistory(id);
      setOpenedMsgs(msgs);
    } catch (_) {
      setOpenedMsgs([]);
    } finally {
      setOpenedLoading(false);
    }
  };

  // ── Analyse ────────────────────────────────────────────────────────────
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

      if (rep) {
        saveAnalysis(emlData.name, rep, meta)
          .then(async (saved) => {
            if (saved?.id) {
              setEmailId(saved.id);
              // ── تحميل الـ chat history الموجود ──
              try {
                const oldMsgs = await getChatHistory(saved.id);
                if (oldMsgs.length > 0) {
                  // نحول الـ messages القديمة لـ format الـ chat
                  const formattedOld = oldMsgs.map((m) => ({
                    role: m.role === "user" ? "user" : "bot",
                    text: m.content,
                    chips: [],
                  }));
                  setMsgs((prev) => [...prev, ...formattedOld]);
                  // نحدث الـ history للـ context
                  setHistory((prev) => [
                    ...prev,
                    ...oldMsgs.map((m) => ({
                      role: m.role === "user" ? "user" : "assistant",
                      content: m.content,
                    })),
                  ]);
                }
              } catch (_) {}
            }
          })
          .catch(() => {});
      }

      // ── Calcul couleur et verdict pour le message ──────────────────
      const sc = rep?.score ?? null;
      const color =
        sc === null
          ? "#94a3b8"
          : sc >= 70
          ? "#22c55e"
          : sc >= 40
          ? "#f59e0b"
          : "#ef4444";

      const vLabel =
        rep?.verdict === "SAFE"
          ? "Email sûr "
          : rep?.verdict === "SUSPICIOUS"
          ? "Suspect "
          : rep?.verdict === "DANGEROUS"
          ? "Dangereux "
          : "Inconnu ";

      let chips =
        Array.isArray(data.chips) && data.chips.length
          ? data.chips
          : [
              "Risque de phishing ?",
              "Les liens sont-ils sûrs ?",
              "Que faire maintenant ?",
            ];

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

      setHistory([
        {
          role: "user",
          content: `[CTX] ${JSON.stringify(rep)} ${emlData.content.substring(
            0,
            2000
          )}`,
        },
        { role: "assistant", content: "Prêt." },
      ]);

      setTyping(false);
      setBusy(false);

      // ── Message de bienvenue avec résultat ─────────────────────────
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

      setMsgs([{ role: "bot", text: welcomeText, chips }]);
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

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
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
  }, [input, typing, report, history, emlData, emailId]);

  // ── Download PDF ───────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!report) return alert("L'analyse n'est pas encore terminée.");
    setPdfBusy(true);
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

  // ── Score & verdict ────────────────────────────────────────────────────
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
      {/* ── Panneau gauche ── */}
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
                <td>Fichier</td> <td>{emlData?.name || "—"}</td>
              </tr>
              <tr>
                <td>Expéditeur</td>{" "}
                <td style={{ wordBreak: "break-all" }}>{meta.from || "—"}</td>
              </tr>
              <tr>
                <td>Objet</td>{" "}
                <td style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                  {meta.subject || "—"}
                </td>
              </tr>
              <tr>
                <td>Liens</td>{" "}
                <td>{meta.links > 0 ? `${meta.links} lien(s)` : "Aucun"}</td>
              </tr>
              <tr>
                <td>Pièces jointes</td>{" "}
                <td>
                  {meta.attach > 0 ? `${meta.attach} pièce(s)` : "Aucune"}
                </td>
              </tr>
              <tr>
                <td>Date</td> <td>{meta.date || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panneau droit : sidebar + chat ── */}
      <div className="rp-chat-wrap">
        {/* ── Sidebar historique ── */}
        <div className={`rp-hist-sidebar ${histOpen ? "open" : ""}`}>
          <div className="rp-hist-header">
            <span> Historique</span>
            <button
              className="rp-hist-close"
              onClick={() => setHistOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="rp-hist-body">
            {histLoading ? (
              <div className="rp-hist-empty">Chargement…</div>
            ) : histEmails.length === 0 ? (
              <div className="rp-hist-empty">Aucune analyse.</div>
            ) : (
              histEmails.map((em) => {
                const v = VERDICT_MAP[em.verdict] || {
                  cls: "warn",
                };
                const isOpen = openedId === em._id;
                return (
                  <div key={em._id} className="rp-hist-item">
                    <div
                      className={`rp-hist-row ${isOpen ? "active" : ""}`}
                      onClick={() => openHistChat(em._id)}
                    >
                      <span className="rp-hist-icon">{v.icon}</span>
                      <div className="rp-hist-info">
                        <span className="rp-hist-fname">{em.filename}</span>
                        <span className="rp-hist-date">
                          {new Date(em.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span className={`rp-hist-score ${v.cls}`}>
                        {em.score}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="rp-hist-chat">
                        {openedLoading ? (
                          <div
                            className="rp-hist-empty"
                            style={{ padding: "12px 0" }}
                          >
                            Chargement…
                          </div>
                        ) : openedMsgs.length === 0 ? (
                          <div
                            className="rp-hist-empty"
                            style={{ padding: "12px 0" }}
                          >
                            Aucun message.
                          </div>
                        ) : (
                          <div className="rp-hist-msgs" ref={histMsgsRef}>
                            {openedMsgs.map((m, i) => (
                              <div key={i} className={`rp-hist-msg ${m.role}`}>
                                <span className="rp-hist-msg-sender">
                                  {m.role === "user" ? "Vous" : "AI"}
                                </span>
                                <div
                                  className="rp-hist-msg-bub"
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(m.content),
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className="rp-chat">
          {/* Topbar */}
          <div className="rp-chat-topbar">
            <button
              className={`rp-hist-btn ${histOpen ? "active" : ""}`}
              onClick={toggleHist}
              title="Historique"
            >
              <HistIcon />
            </button>
            <div className="rp-chat-topbar-icon">
              <BotIcon />
            </div>
            <div className="rp-chat-topbar-info">
              <h3>CheckMail</h3>
              <p>
                <span className="rp-dot" /> En ligne
              </p>
            </div>
            {(typing || busy) && (
              <span className="rp-thinking">Analyse en cours…</span>
            )}
          </div>

          {/* Messages */}
          <div className="rp-msgs" ref={msgsRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`rp-msg ${m.role}`}>
                <div className="rp-msg-inner">
                  <div className="rp-msg-avatar">
                    {m.role === "bot" ? <BotIcon /> : "V"}
                  </div>
                  <div className="rp-msg-content">
                    <div className="rp-msg-sender">
                      {m.role === "bot" ? "CheckMail" : "Vous"}
                    </div>
                    <div
                      className="rp-bub"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(m.text),
                      }}
                    />
                    {m.chips?.length > 0 && (
                      <div className="rp-chips">
                        {m.chips.map((c, j) => (
                          <button
                            key={j}
                            className="rp-chip"
                            onClick={() => setInput(c)}
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
                  <div className="rp-msg-avatar">
                    <BotIcon />
                  </div>
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

          {/* Input */}
          <div className="rp-input-area">
            <div className="rp-input-box">
              <input
                className="rp-input"
                value={input}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Posez votre question sur cet email…"
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
    </div>
  );
}
