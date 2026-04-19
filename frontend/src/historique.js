import { useState, useEffect, useRef } from "react";
import { getHistory, deleteAnalysis } from "./emailService";
import { getChatHistory } from "./chatService";
import "./Historique.css";
import { useNavigate } from "react-router-dom";

const EMAILS = [
  {
    id: 1,
    senderName: "Ahmed Benali",
    senderEmail: "ahmed.benali@gmail.com",
    subject: "Facture #2024-0512 — Paiement urgent requis",
    date: "2024-06-10",
    time: "09:14",
    size: "348 Ko",
    status: "Infecté",
    score: 94,
    attachments: 2,
    attachmentNames: ["facture.pdf", "paiement.exe"],
    headers: "Received: from mail.spam-domain.ru\nX-Mailer: PhishKit v3",
    bodyPreview:
      "Veuillez régler cette facture dans les 24h ou votre compte sera suspendu.",
    threats: [
      {
        icon: "🦠",
        text: "Exécutable malveillant joint (paiement.exe)",
        level: "high",
      },
      {
        icon: "🔗",
        text: "Lien de phishing détecté dans le corps",
        level: "high",
      },
      {
        icon: "⚠️",
        text: "Expéditeur usurpant un domaine légitime",
        level: "medium",
      },
    ],
  },
  {
    id: 2,
    senderName: "Mariem Trabelsi",
    senderEmail: "mariem.t@company.tn",
    subject: "Réunion projet Q3 — Ordre du jour",
    date: "2024-06-10",
    time: "08:02",
    size: "42 Ko",
    status: "Propre",
    score: 2,
    attachments: 1,
    attachmentNames: ["agenda_q3.pdf"],
    headers: "Received: from mail.company.tn\nDKIM: pass",
    bodyPreview:
      "Bonjour l'équipe, veuillez trouver ci-joint l'ordre du jour pour notre réunion de demain.",
    threats: [],
  },
  {
    id: 3,
    senderName: "Support PayPal",
    senderEmail: "noreply@paypa1-secure.com",
    subject: "Votre compte a été limité — Action requise",
    date: "2024-06-09",
    time: "22:51",
    size: "125 Ko",
    status: "Infecté",
    score: 99,
    attachments: 0,
    attachmentNames: [],
    headers: "Received: from mail.paypa1-secure.com\nSPF: fail",
    bodyPreview:
      "Nous avons détecté une activité suspecte sur votre compte. Connectez-vous immédiatement.",
    threats: [
      {
        icon: "🎣",
        text: "Domaine imitant PayPal (paypa1-secure.com)",
        level: "high",
      },
      {
        icon: "🔗",
        text: "URL de phishing dans le bouton d'action",
        level: "high",
      },
    ],
  },
  {
    id: 4,
    senderName: "Nour Khelifi",
    senderEmail: "nour.khelifi@univ-tunis.tn",
    subject: "Thèse — Résultats chapitre 4",
    date: "2024-06-09",
    time: "14:30",
    size: "2.1 Mo",
    status: "Propre",
    score: 0,
    attachments: 3,
    attachmentNames: ["chap4.docx", "data.xlsx", "graphs.zip"],
    headers: "Received: from smtp.univ-tunis.tn\nDKIM: pass\nSPF: pass",
    bodyPreview:
      "Bonjour, je vous transmets les résultats finaux du chapitre 4 de ma thèse.",
    threats: [],
  },
  {
    id: 5,
    senderName: "Amazon.fr",
    senderEmail: "confirm@amaz0n-delivery.info",
    subject: "Votre colis est en attente — Frais de douane",
    date: "2024-06-09",
    time: "11:17",
    size: "88 Ko",
    status: "Suspect",
    score: 71,
    attachments: 1,
    attachmentNames: ["suivi_colis.html"],
    headers: "Received: from amaz0n-delivery.info\nSPF: softfail",
    bodyPreview:
      "Votre colis est bloqué en douane. Veuillez payer 2,99 € pour le libérer.",
    threats: [
      { icon: "⚠️", text: "Domaine suspect imitant Amazon", level: "medium" },
      {
        icon: "📎",
        text: "Fichier HTML joint avec scripts embarqués",
        level: "medium",
      },
      {
        icon: "💳",
        text: "Demande de paiement non sollicitée",
        level: "medium",
      },
    ],
  },
  {
    id: 6,
    senderName: "Sarra Mansouri",
    senderEmail: "s.mansouri@cabinet-conseil.tn",
    subject: "Proposition commerciale — Partenariat 2024",
    date: "2024-06-08",
    time: "16:05",
    size: "560 Ko",
    status: "Propre",
    score: 8,
    attachments: 2,
    attachmentNames: ["proposition.pdf", "brochure.pdf"],
    headers: "Received: from mail.cabinet-conseil.tn\nDKIM: pass",
    bodyPreview:
      "Madame, Monsieur, suite à notre échange téléphonique, voici notre proposition.",
    threats: [],
  },
  {
    id: 7,
    senderName: "Microsoft Azure",
    senderEmail: "azure-alerts@m1crosoft-cloud.net",
    subject: "Alerte sécurité — Connexion inhabituelle",
    date: "2024-06-08",
    time: "03:22",
    size: "64 Ko",
    status: "Infecté",
    score: 97,
    attachments: 0,
    attachmentNames: [],
    headers: "Received: from m1crosoft-cloud.net\nSPF: fail\nDKIM: fail",
    bodyPreview:
      "Votre abonnement Azure a été suspendu suite à une activité suspecte.",
    threats: [
      {
        icon: "🦠",
        text: "Domaine typosquat imitant Microsoft",
        level: "high",
      },
      {
        icon: "🎣",
        text: "Tentative d'hameçonnage ciblé (spear phishing)",
        level: "high",
      },
      {
        icon: "🕐",
        text: "Envoi à 3h du matin — comportement anormal",
        level: "low",
      },
    ],
  },
  {
    id: 8,
    senderName: "Rami Bouazizi",
    senderEmail: "r.bouazizi@startup.io",
    subject: "Invitation Beta — Notre nouvelle application SaaS",
    date: "2024-06-07",
    time: "10:44",
    size: "78 Ko",
    status: "Suspect",
    score: 45,
    attachments: 0,
    attachmentNames: [],
    headers: "Received: from mail.startup.io\nDKIM: pass\nSPF: softfail",
    bodyPreview:
      "Nous vous invitons à tester en exclusivité notre nouvelle plateforme.",
    threats: [
      {
        icon: "⚠️",
        text: "SPF softfail — configuration email incomplète",
        level: "low",
      },
      {
        icon: "🔍",
        text: "Domaine récemment enregistré (< 30 jours)",
        level: "medium",
      },
    ],
  },
  {
    id: 9,
    senderName: "La Poste Tunisienne",
    senderEmail: "notification@poste.tn",
    subject: "Avis de passage — Colis référence TN24891",
    date: "2024-06-07",
    time: "08:10",
    size: "31 Ko",
    status: "Propre",
    score: 1,
    attachments: 0,
    attachmentNames: [],
    headers: "Received: from smtp.poste.tn\nDKIM: pass\nSPF: pass",
    bodyPreview: "Un avis de passage a été déposé pour votre colis TN24891.",
    threats: [],
  },
  {
    id: 10,
    senderName: "Inconnu",
    senderEmail: "xd8f2k@protonmail.com",
    subject: "URGENT: Vos données personnelles exposées",
    date: "2024-06-06",
    time: "19:58",
    size: "15 Ko",
    status: "En cours",
    score: null,
    attachments: 1,
    attachmentNames: ["voir_ici.zip"],
    headers: "En cours d'analyse…",
    bodyPreview: "Nous avons vos données. Contactez-nous avant 24h.",
    threats: [],
  },
  {
    id: 11,
    senderName: "Hana Dridi",
    senderEmail: "h.dridi@minfin.gov.tn",
    subject: "Déclaration fiscale 2023 — Accusé de réception",
    date: "2024-06-06",
    time: "14:22",
    size: "92 Ko",
    status: "Propre",
    score: 0,
    attachments: 1,
    attachmentNames: ["accuse_reception.pdf"],
    headers: "Received: from smtp.gov.tn\nDKIM: pass\nSPF: pass",
    bodyPreview:
      "Votre déclaration fiscale 2023 a bien été reçue et enregistrée.",
    threats: [],
  },
  {
    id: 12,
    senderName: "Lottery Winner",
    senderEmail: "winner@global-prize2024.win",
    subject: "Félicitations ! Vous avez gagné 1 500 000 €",
    date: "2024-06-05",
    time: "12:00",
    size: "210 Ko",
    status: "Infecté",
    score: 100,
    attachments: 1,
    attachmentNames: ["claim_form.doc"],
    headers: "Received: from bulk.global-prize2024.win\nSPF: fail",
    bodyPreview:
      "Vous avez été sélectionné pour recevoir un prix. Remplissez le formulaire joint.",
    threats: [
      {
        icon: "🦠",
        text: "Document Word avec macros malveillantes",
        level: "high",
      },
      {
        icon: "🎣",
        text: "Arnaque classique à la loterie (advance-fee fraud)",
        level: "high",
      },
      {
        icon: "🌍",
        text: "Serveur d'envoi en masse blacklisté",
        level: "high",
      },
    ],
  },
];

export default function HistoriquePage() {
  const navigate = useNavigate();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [report, setReport] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(true);
  const [history, setHistory] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [emailId, setEmailId] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const chatRef = useRef();

  const meta = emails.find((e) => e.id === emailId) || {};

  const printFallback = (email) => {
    const win = window.open("", "_blank");

    const threats = email.threats.length
      ? email.threats.map((t) => `<li>${t.icon} ${t.text}</li>`).join("")
      : "<li>Aucune menace</li>";

    win.document.write(`
      <html>
        <head>
          <title>Rapport Email</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #1e40af; }
            .box { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>📧 Rapport Email</h1>
          <div class="box"><b>Expéditeur:</b> ${email.senderName}</div>
          <div class="box"><b>Email:</b> ${email.senderEmail}</div>
          <div class="box"><b>Sujet:</b> ${email.subject}</div>
          <div class="box"><b>Date:</b> ${email.date} ${email.time}</div>
          <div class="box"><b>Status:</b> ${email.status}</div>
          <div class="box"><b>Score:</b> ${email.score ?? "--"}</div>
          <h3>Menaces</h3>
          <ul>${threats}</ul>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  const downloadPDF = async () => {
    const email = selectedEmail;

    try {
      setPdfBusy(true);

      const res = await fetch("/api/report/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, meta }),
      });

      if (!res.ok) throw new Error("API failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `CheckMail_${email.status}_${email.score}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.log("Fallback print 🚀");
      printFallback(email);
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await getHistory(1, 50);
      if (data && data.emails && data.emails.length > 0) {
        const mapped = data.emails.map((e) => ({
          id: e._id,
          senderName: e.senderEmail?.split("@")[0] || "Inconnu",
          senderEmail: e.senderEmail || "—",
          subject: e.subject || "—",
          date: e.createdAt?.split("T")[0] || "—",
          time: e.createdAt?.split("T")[1]?.substring(0, 5) || "—",
          size: "—",
          status: e.verdict || "Inconnu",
          score: e.score ?? null,
          attachments: 0,
          attachmentNames: [],
          headers: "",
          bodyPreview: e.bodyPreview || "—",
          threats: e.threats || [],
        }));
        setEmails(mapped);
      } else {
        setEmails(EMAILS);
      }
    } catch (err) {
      setEmails(EMAILS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="title">CheckMail — Historique</h1>

      <div className="stats">
        <div className="stat">Total: {emails.length}</div>
        <div className="stat green">
          Propre: {emails.filter((e) => e.status === "Propre").length}
        </div>
        <div className="stat red">
          Infecté: {emails.filter((e) => e.status === "Infecté").length}
        </div>
        <div className="stat orange">
          Suspect: {emails.filter((e) => e.status === "Suspect").length}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid">
          {emails.map((email) => {
            const color =
              email.status === "Propre"
                ? "green"
                : email.status === "Suspect"
                ? "orange"
                : email.status === "Infecté"
                ? "red"
                : "orange";

            return (
              <div
                key={email.id}
                className={`card ${color}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="card-header">
                  <div className="avatar">{email.senderName?.[0] ?? "?"}</div>
                  <div>
                    <div className="name">{email.senderName}</div>
                    <div className="email">{email.senderEmail}</div>
                  </div>
                </div>

                <div className="subject">{email.subject}</div>

                <div className="card-footer">
                  <span className={`badge ${color}`}>{email.status}</span>

                  <div className="score">
                    <div className="bar">
                      <div
                        className="fill"
                        style={{ width: `${email.score || 0}%` }}
                      ></div>
                    </div>
                    <span>{email.score ?? "--"}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEmail && (
        <div className="modal-bg" onClick={() => setSelectedEmail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span
              className="modal-close-x"
              onClick={() => setSelectedEmail(null)}
            >
              ✕
            </span>

            <h2>{selectedEmail.subject}</h2>

            <p>
              <b>Expéditeur:</b> {selectedEmail.senderEmail}
            </p>
            <p>
              <b>Date:</b> {selectedEmail.date} {selectedEmail.time}
            </p>
            <p>
              <b>Taille:</b> {selectedEmail.size}
            </p>

            <p className="preview">{selectedEmail.bodyPreview}</p>

            {selectedEmail.threats.length > 0 && (
              <>
                <h3>⚠️ Menaces</h3>
                <ul>
                  {selectedEmail.threats.map((t, i) => (
                    <li key={i}>
                      {t.icon} {t.text}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="modal-actions">
              <button
                className="btn analyse"
                onClick={() =>
                  navigate("/results", {
                    state: {
                      emlData: {
                        name: selectedEmail.subject || "email.eml",
                        content: selectedEmail.bodyPreview || "",
                        _id: selectedEmail.id,
                      },
                      reportFromHistory: {
                        _id: selectedEmail.id,
                        score: selectedEmail.score,
                        verdict:
                          selectedEmail.status === "Propre"
                            ? "SAFE"
                            : selectedEmail.status === "Infecté"
                            ? "DANGEROUS"
                            : "SUSPICIOUS",
                        summary: selectedEmail.bodyPreview,
                        threats: selectedEmail.threats,
                        subject: selectedEmail.subject,
                        senderEmail: selectedEmail.senderEmail,
                      },
                    },
                  })
                }
              >
                Analyse
              </button>

              <button className="btn rapport" onClick={downloadPDF}>
                Rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
