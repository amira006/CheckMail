import { useState, useEffect, useRef } from "react";
import { getHistory, deleteAnalysis } from "./emailService";
import { getChatHistory } from "./chatService";
import "./Historique.css";

// ── Helpers ────────────────────────────────────────────────────────────────
const VERDICT_MAP = {
  Propre: { cls: "safe", label: "Sûr", icon: "✅" },
  Suspect: { cls: "warn", label: "Suspect", icon: "⚠️" },
  Infecté: { cls: "danger", label: "Dangereux", icon: "🔴" },
};

function parseMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>")
    .replace(
      /(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g,
      (m) => `<ul>${m}</ul>`
    )
    .replace(/(?<!>)\n(?!<)/g, "<br/>")
    .replace(/(<br\/>){2,}/g, "<br/>");
}

// ── Composant principal ────────────────────────────────────────────────────
export default function Historique() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const chatRef = useRef();

  // ── Charger la liste des emails ────────────────────────────────────
  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await getHistory(1, 50);
      setEmails(data.emails || []);
    } catch (_) {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Ouvrir / fermer le chat d'un email ────────────────────────────
  const openChat = async (emailId) => {
    if (selectedId === emailId) {
      setSelectedId(null);
      setChatMsgs([]);
      return;
    }
    setSelectedId(emailId);
    setChatLoading(true);
    try {
      const msgs = await getChatHistory(emailId);
      setChatMsgs(msgs);
    } catch (_) {
      setChatMsgs([]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Auto-scroll chat ──────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMsgs]);

  // ── Supprimer un email ────────────────────────────────────────────
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer cette analyse ?")) return;
    setDeleting(id);
    const ok = await deleteAnalysis(id);
    if (ok) {
      setEmails((p) => p.filter((em) => em._id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setChatMsgs([]);
      }
    }
    setDeleting(null);
  };

  // ── Rendu ─────────────────────────────────────────────────────────
  return (
    <div className="hist-wrap">
      <div className="hist-header">
        <h1>Historique des analyses</h1>
        <span className="hist-count">{emails.length} email(s)</span>
      </div>

      {loading ? (
        <div className="hist-loading">Chargement…</div>
      ) : emails.length === 0 ? (
        <div className="hist-empty">
          <p>Aucune analyse enregistrée.</p>
        </div>
      ) : (
        <div className="hist-list">
          {emails.map((em) => {
            const v = VERDICT_MAP[em.verdict] || {
              cls: "warn",
              label: em.verdict,
              icon: "❓",
            };
            const isOpen = selectedId === em._id;

            return (
              <div key={em._id} className={`hist-card ${isOpen ? "open" : ""}`}>
                {/* ── Ligne principale ── */}
                <div className="hist-card-top" onClick={() => openChat(em._id)}>
                  <div className="hist-card-left">
                    <span className={`hist-verdict ${v.cls}`}>
                      {v.icon} {v.label}
                    </span>
                    <div className="hist-info">
                      <span className="hist-filename">{em.filename}</span>
                      <span className="hist-subject">{em.subject || "—"}</span>
                      <span className="hist-date">
                        {new Date(em.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="hist-card-right">
                    <div className={`hist-score ${v.cls}`}>{em.score}</div>
                    <button
                      className="hist-btn-chat"
                      onClick={() => openChat(em._id)}
                    >
                      {isOpen ? "Fermer chat ▲" : "Voir chat ▼"}
                    </button>
                    <button
                      className="hist-btn-delete"
                      onClick={(e) => handleDelete(e, em._id)}
                      disabled={deleting === em._id}
                    >
                      {deleting === em._id ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* ── Chat history ── */}
                {isOpen && (
                  <div className="hist-chat">
                    <div className="hist-chat-title">💬 Historique du chat</div>
                    {chatLoading ? (
                      <div className="hist-chat-loading">Chargement…</div>
                    ) : chatMsgs.length === 0 ? (
                      <div className="hist-chat-empty">
                        Aucun message enregistré pour cet email.
                      </div>
                    ) : (
                      <div className="hist-chat-msgs" ref={chatRef}>
                        {chatMsgs.map((m, i) => (
                          <div key={i} className={`hist-msg ${m.role}`}>
                            <span className="hist-msg-sender">
                              {m.role === "user" ? "Vous" : "Assistant"}
                            </span>
                            <div
                              className="hist-msg-bub"
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
          })}
        </div>
      )}
    </div>
  );
}
