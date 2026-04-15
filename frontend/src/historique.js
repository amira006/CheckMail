import { useState, useEffect, useRef } from "react";
import { getHistory, deleteAnalysis } from "./emailService";
import { getChatHistory } from "./chatService";
import "./Historique.css";

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconSafe = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconWarn = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconDanger = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconUnknown = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconChat = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconChevronUp = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconSpinner = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
const VERDICT_MAP = {
  Propre: { cls: "safe", label: "Sûr", icon: <IconSafe /> },
  Suspect: { cls: "warn", label: "Suspect", icon: <IconWarn /> },
  Infecté: { cls: "danger", label: "Dangereux", icon: <IconDanger /> },
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
              icon: <IconUnknown />,
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
                      <IconChat />
                      {isOpen ? (
                        <>
                          <span>Fermer chat</span> <IconChevronUp />
                        </>
                      ) : (
                        <>
                          <span>Voir chat</span> <IconChevronDown />
                        </>
                      )}
                    </button>
                    <button
                      className="hist-btn-delete"
                      onClick={(e) => handleDelete(e, em._id)}
                      disabled={deleting === em._id}
                    >
                      {deleting === em._id ? <IconSpinner /> : <IconTrash />}
                    </button>
                  </div>
                </div>

                {/* ── Chat history ── */}
                {isOpen && (
                  <div className="hist-chat">
                    <div className="hist-chat-title">
                      <IconChat /> Historique du chat
                    </div>
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
