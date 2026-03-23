/* ═══════════════════════════════════════════════════════
   MAILGUARD — HISTORIQUE DES EMAILS
   Fichier : historique.js
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════
   DONNÉES
═══════════════════════════════════════ */
const EMAILS = [
  {
    id: 1,
    senderName: "Ahmed Benali",
    senderEmail: "ahmed.benali@gmail.com",
    subject: "Facture #2024-0512 — Paiement urgent requis",
    date: "2024-06-10", time: "09:14", size: "348 Ko",
    status: "Infecté", score: 94,
    attachments: 2,
    attachmentNames: ["facture.pdf", "paiement.exe"],
    headers: "Received: from mail.spam-domain.ru\nX-Mailer: PhishKit v3",
    bodyPreview: "Veuillez régler cette facture dans les 24h ou votre compte sera suspendu.",
    threats: [
      { icon: "🦠", text: "Exécutable malveillant joint (paiement.exe)", level: "high" },
      { icon: "🔗", text: "Lien de phishing détecté dans le corps", level: "high" },
      { icon: "⚠️", text: "Expéditeur usurpant un domaine légitime", level: "medium" }
    ]
  },
  {
    id: 2,
    senderName: "Mariem Trabelsi",
    senderEmail: "mariem.t@company.tn",
    subject: "Réunion projet Q3 — Ordre du jour",
    date: "2024-06-10", time: "08:02", size: "42 Ko",
    status: "Propre", score: 2,
    attachments: 1,
    attachmentNames: ["agenda_q3.pdf"],
    headers: "Received: from mail.company.tn\nDKIM: pass",
    bodyPreview: "Bonjour l'équipe, veuillez trouver ci-joint l'ordre du jour pour notre réunion de demain.",
    threats: []
  },
  {
    id: 3,
    senderName: "Support PayPal",
    senderEmail: "noreply@paypa1-secure.com",
    subject: "Votre compte a été limité — Action requise",
    date: "2024-06-09", time: "22:51", size: "125 Ko",
    status: "Infecté", score: 99,
    attachments: 0, attachmentNames: [],
    headers: "Received: from mail.paypa1-secure.com\nSPF: fail",
    bodyPreview: "Nous avons détecté une activité suspecte sur votre compte. Connectez-vous immédiatement.",
    threats: [
      { icon: "🎣", text: "Domaine imitant PayPal (paypa1-secure.com)", level: "high" },
      { icon: "🔗", text: "URL de phishing dans le bouton d'action", level: "high" }
    ]
  },
  {
    id: 4,
    senderName: "Nour Khelifi",
    senderEmail: "nour.khelifi@univ-tunis.tn",
    subject: "Thèse — Résultats chapitre 4",
    date: "2024-06-09", time: "14:30", size: "2.1 Mo",
    status: "Propre", score: 0,
    attachments: 3,
    attachmentNames: ["chap4.docx", "data.xlsx", "graphs.zip"],
    headers: "Received: from smtp.univ-tunis.tn\nDKIM: pass\nSPF: pass",
    bodyPreview: "Bonjour, je vous transmets les résultats finaux du chapitre 4 de ma thèse.",
    threats: []
  },
  {
    id: 5,
    senderName: "Amazon.fr",
    senderEmail: "confirm@amaz0n-delivery.info",
    subject: "Votre colis est en attente — Frais de douane",
    date: "2024-06-09", time: "11:17", size: "88 Ko",
    status: "Suspect", score: 71,
    attachments: 1,
    attachmentNames: ["suivi_colis.html"],
    headers: "Received: from amaz0n-delivery.info\nSPF: softfail",
    bodyPreview: "Votre colis est bloqué en douane. Veuillez payer 2,99 € pour le libérer.",
    threats: [
      { icon: "⚠️", text: "Domaine suspect imitant Amazon", level: "medium" },
      { icon: "📎", text: "Fichier HTML joint avec scripts embarqués", level: "medium" },
      { icon: "💳", text: "Demande de paiement non sollicitée", level: "medium" }
    ]
  },
  {
    id: 6,
    senderName: "Sarra Mansouri",
    senderEmail: "s.mansouri@cabinet-conseil.tn",
    subject: "Proposition commerciale — Partenariat 2024",
    date: "2024-06-08", time: "16:05", size: "560 Ko",
    status: "Propre", score: 8,
    attachments: 2,
    attachmentNames: ["proposition.pdf", "brochure.pdf"],
    headers: "Received: from mail.cabinet-conseil.tn\nDKIM: pass",
    bodyPreview: "Madame, Monsieur, suite à notre échange téléphonique, voici notre proposition.",
    threats: []
  },
  {
    id: 7,
    senderName: "Microsoft Azure",
    senderEmail: "azure-alerts@m1crosoft-cloud.net",
    subject: "Alerte sécurité — Connexion inhabituelle",
    date: "2024-06-08", time: "03:22", size: "64 Ko",
    status: "Infecté", score: 97,
    attachments: 0, attachmentNames: [],
    headers: "Received: from m1crosoft-cloud.net\nSPF: fail\nDKIM: fail",
    bodyPreview: "Votre abonnement Azure a été suspendu suite à une activité suspecte.",
    threats: [
      { icon: "🦠", text: "Domaine typosquat imitant Microsoft", level: "high" },
      { icon: "🎣", text: "Tentative d'hameçonnage ciblé (spear phishing)", level: "high" },
      { icon: "🕐", text: "Envoi à 3h du matin — comportement anormal", level: "low" }
    ]
  },
  {
    id: 8,
    senderName: "Rami Bouazizi",
    senderEmail: "r.bouazizi@startup.io",
    subject: "Invitation Beta — Notre nouvelle application SaaS",
    date: "2024-06-07", time: "10:44", size: "78 Ko",
    status: "Suspect", score: 45,
    attachments: 0, attachmentNames: [],
    headers: "Received: from mail.startup.io\nDKIM: pass\nSPF: softfail",
    bodyPreview: "Nous vous invitons à tester en exclusivité notre nouvelle plateforme.",
    threats: [
      { icon: "⚠️", text: "SPF softfail — configuration email incomplète", level: "low" },
      { icon: "🔍", text: "Domaine récemment enregistré (< 30 jours)", level: "medium" }
    ]
  },
  {
    id: 9,
    senderName: "La Poste Tunisienne",
    senderEmail: "notification@poste.tn",
    subject: "Avis de passage — Colis référence TN24891",
    date: "2024-06-07", time: "08:10", size: "31 Ko",
    status: "Propre", score: 1,
    attachments: 0, attachmentNames: [],
    headers: "Received: from smtp.poste.tn\nDKIM: pass\nSPF: pass",
    bodyPreview: "Un avis de passage a été déposé pour votre colis TN24891.",
    threats: []
  },
  {
    id: 10,
    senderName: "Inconnu",
    senderEmail: "xd8f2k@protonmail.com",
    subject: "URGENT: Vos données personnelles exposées",
    date: "2024-06-06", time: "19:58", size: "15 Ko",
    status: "En cours", score: null,
    attachments: 1,
    attachmentNames: ["voir_ici.zip"],
    headers: "En cours d'analyse…",
    bodyPreview: "Nous avons vos données. Contactez-nous avant 24h.",
    threats: []
  },
  {
    id: 11,
    senderName: "Hana Dridi",
    senderEmail: "h.dridi@minfin.gov.tn",
    subject: "Déclaration fiscale 2023 — Accusé de réception",
    date: "2024-06-06", time: "14:22", size: "92 Ko",
    status: "Propre", score: 0,
    attachments: 1,
    attachmentNames: ["accuse_reception.pdf"],
    headers: "Received: from smtp.gov.tn\nDKIM: pass\nSPF: pass",
    bodyPreview: "Votre déclaration fiscale 2023 a bien été reçue et enregistrée.",
    threats: []
  },
  {
    id: 12,
    senderName: "Lottery Winner",
    senderEmail: "winner@global-prize2024.win",
    subject: "Félicitations ! Vous avez gagné 1 500 000 €",
    date: "2024-06-05", time: "12:00", size: "210 Ko",
    status: "Infecté", score: 100,
    attachments: 1,
    attachmentNames: ["claim_form.doc"],
    headers: "Received: from bulk.global-prize2024.win\nSPF: fail",
    bodyPreview: "Vous avez été sélectionné pour recevoir un prix. Remplissez le formulaire joint.",
    threats: [
      { icon: "🦠", text: "Document Word avec macros malveillantes", level: "high" },
      { icon: "🎣", text: "Arnaque classique à la loterie (advance-fee fraud)", level: "high" },
      { icon: "🌍", text: "Serveur d'envoi en masse blacklisté", level: "high" }
    ]
  }
];

/* ═══════════════════════════════════════
   ÉTAT GLOBAL
═══════════════════════════════════════ */
let currentPage  = 1;
const PER_PAGE   = 8;
let currentEmail = null;

/* ═══════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════ */
const AVATAR_COLORS = [
  '#1e4d9b', '#0f766e', '#6d28d9',
  '#b45309', '#be185d', '#0369a1', '#047857'
];

/**
 * Retourne une couleur d'avatar déterministe selon le nom
 */
function avatarColor(str) {
  let hash = 0;
  for (let c of str) {
    hash = (hash << 5) - hash + c.charCodeAt(0);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Retourne les initiales (max 2 lettres) d'un nom
 */
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Retourne la classe CSS du badge selon le statut
 */
function badgeClass(status) {
  const map = {
    'Propre':   'clean',
    'Infecté':  'infected',
    'Suspect':  'suspect',
    'En cours': 'pending'
  };
  return map[status] || 'pending';
}

/**
 * Retourne la couleur du score de menace
 */
function scoreColor(score) {
  if (score === null) return '#94a3b8';
  if (score >= 75)   return '#ef4444';
  if (score >= 40)   return '#f59e0b';
  return '#10b981';
}

/**
 * Formate une date ISO en format lisible français
 */
function formatDate(d) {
  const [y, m, day] = d.split('-');
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `${+day} ${months[+m - 1]} ${y}`;
}

/* ═══════════════════════════════════════
   STATISTIQUES
═══════════════════════════════════════ */
function updateStats() {
  document.getElementById('stat-total').textContent    = EMAILS.length;
  document.getElementById('stat-clean').textContent    = EMAILS.filter(e => e.status === 'Propre').length;
  document.getElementById('stat-infected').textContent = EMAILS.filter(e => e.status === 'Infecté').length;
  document.getElementById('stat-suspect').textContent  = EMAILS.filter(e => e.status === 'Suspect').length;
}

/* ═══════════════════════════════════════
   FILTRE ET TRI
═══════════════════════════════════════ */
function getFiltered() {
  const query  = document.getElementById('search').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const sort   = document.getElementById('filterSort').value;

  let data = EMAILS.filter(e => {
    const matchQuery  = !query  || e.senderName.toLowerCase().includes(query)
                                || e.senderEmail.toLowerCase().includes(query)
                                || e.subject.toLowerCase().includes(query);
    const matchStatus = !status || e.status === status;
    return matchQuery && matchStatus;
  });

  data.sort((a, b) => {
    if (sort === 'date-desc')  return (b.date + b.time).localeCompare(a.date + a.time);
    if (sort === 'date-asc')   return (a.date + a.time).localeCompare(b.date + b.time);
    if (sort === 'score-desc') return (b.score ?? -1)  - (a.score ?? -1);
    if (sort === 'score-asc')  return (a.score ?? 101) - (b.score ?? 101);
    return 0;
  });

  return data;
}

/* ═══════════════════════════════════════
   RENDU DU TABLEAU
═══════════════════════════════════════ */
function renderTable() {
  const filtered   = getFiltered();
  const total      = filtered.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const tbody = document.getElementById('emailTableBody');

  if (slice.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-5 9 5"/>
            </svg>
            <p>Aucun email trouvé</p>
          </div>
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = slice.map((e, i) => {
      const scColor = scoreColor(e.score);
      const scPct   = e.score !== null ? e.score : 0;

      return `
        <tr style="animation-delay:${i * 40}ms">
          <td>
            <div class="sender-cell">
              <div class="avatar" style="background:${avatarColor(e.senderName)}">${initials(e.senderName)}</div>
              <div>
                <div class="sender-name">${e.senderName}</div>
                <div class="sender-email">${e.senderEmail}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="subject-text" title="${e.subject}">${e.subject}</span>
            ${e.attachments > 0
              ? `<div class="subject-attachments">
                   <span>📎</span>${e.attachments} pièce${e.attachments > 1 ? 's' : ''} jointe${e.attachments > 1 ? 's' : ''}
                 </div>`
              : ''}
          </td>
          <td>
            <div class="date-main">${formatDate(e.date)}</div>
            <div class="date-time">${e.time}</div>
          </td>
          <td><span class="size-text">${e.size}</span></td>
          <td>
            <span class="badge badge-${badgeClass(e.status)}">
              <span class="badge-dot"></span>${e.status}
            </span>
          </td>
          <td>
            <div class="score-wrap">
              <div class="score-bar-bg">
                <div class="score-bar-fill" style="width:${scPct}%;background:${scColor}"></div>
              </div>
              <span class="score-num" style="color:${scColor}">
                ${e.score !== null ? e.score + '%' : '—'}
              </span>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="btn-view" onclick="openModal(${e.id})" title="Voir le rapport">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button class="btn-print" onclick="openModal(${e.id}, true)">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M6 9V2h12v7"/>
                  <rect x="6" y="14" width="12" height="8"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                </svg>
                Imprimer
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // Info pagination
  const start = total ? (currentPage - 1) * PER_PAGE + 1 : 0;
  const end   = Math.min(currentPage * PER_PAGE, total);
  document.getElementById('pageInfo').innerHTML =
    `Affichage <strong>${start}–${end}</strong> sur <strong>${total}</strong>`;

  // Boutons pagination
  const pBtns = document.getElementById('pageBtns');
  pBtns.innerHTML = '';
  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement('button');
    btn.className  = 'page-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = p;
    btn.onclick    = () => { currentPage = p; renderTable(); };
    pBtns.appendChild(btn);
  }
}

/* ═══════════════════════════════════════
   MODAL
═══════════════════════════════════════ */
function openModal(id, autoPrint = false) {
  const email = EMAILS.find(e => e.id === id);
  if (!email) return;
  currentEmail = email;

  document.getElementById('modalTitle').textContent    = email.subject;
  document.getElementById('modalSubtitle').textContent =
    `Email de ${email.senderEmail} — reçu le ${formatDate(email.date)} à ${email.time}`;

  const bc = badgeClass(email.status);
  const verdictMap = {
    clean:    { icon: '✅', title: 'Email Propre',     desc: 'Aucune menace détectée. Cet email est sûr.' },
    infected: { icon: '🦠', title: 'Email Infecté',    desc: 'Menaces critiques détectées. Ne pas ouvrir les pièces jointes.' },
    suspect:  { icon: '⚠️', title: 'Email Suspect',    desc: 'Des éléments suspects ont été détectés. Prudence recommandée.' },
    pending:  { icon: '🔍', title: 'Analyse en cours', desc: "L'analyse de cet email est en cours. Veuillez patienter." },
  };
  const v       = verdictMap[bc];
  const scColor = scoreColor(email.score);

  document.getElementById('modalBody').innerHTML = `
    <div class="verdict-banner ${bc}">
      <span class="verdict-icon">${v.icon}</span>
      <div>
        <div class="verdict-title">${v.title}</div>
        <div class="verdict-desc">${v.desc}</div>
      </div>
    </div>

    <div class="section-title">Informations de l'email</div>
    <div class="report-grid">
      <div class="report-field">
        <div class="field-label">Expéditeur</div>
        <div class="field-value">${email.senderName}</div>
      </div>
      <div class="report-field">
        <div class="field-label">Adresse email</div>
        <div class="field-value">${email.senderEmail}</div>
      </div>
      <div class="report-field full">
        <div class="field-label">Sujet</div>
        <div class="field-value">${email.subject}</div>
      </div>
      <div class="report-field">
        <div class="field-label">Date &amp; Heure</div>
        <div class="field-value">${formatDate(email.date)} à ${email.time}</div>
      </div>
      <div class="report-field">
        <div class="field-label">Taille</div>
        <div class="field-value">${email.size}</div>
      </div>
      <div class="report-field">
        <div class="field-label">Score de menace</div>
        <div class="field-value" style="color:${scColor};font-family:monospace;font-weight:700">
          ${email.score !== null ? email.score + ' / 100' : 'En cours…'}
        </div>
      </div>
      <div class="report-field">
        <div class="field-label">Pièces jointes (${email.attachments})</div>
        <div class="field-value">
          ${email.attachmentNames.length ? email.attachmentNames.join(', ') : 'Aucune'}
        </div>
      </div>
      <div class="report-field full">
        <div class="field-label">En-têtes techniques</div>
        <div class="field-value" style="font-size:12px;white-space:pre-wrap;font-family:monospace">
          ${email.headers}
        </div>
      </div>
      <div class="report-field full">
        <div class="field-label">Aperçu du contenu</div>
        <div class="field-value">${email.bodyPreview}</div>
      </div>
    </div>

    ${email.threats.length > 0
      ? `<div class="section-title">Menaces détectées (${email.threats.length})</div>
         <ul class="threat-list">
           ${email.threats.map(t => `
             <li class="threat-item ti-${t.level}">
               <span class="ti-icon">${t.icon}</span>
               <span class="ti-text">${t.text}</span>
               <span class="ti-badge">${{ high: 'Élevé', medium: 'Moyen', low: 'Faible' }[t.level]}</span>
             </li>`).join('')}
         </ul>`
      : bc !== 'pending'
        ? `<div class="section-title">Menaces détectées</div>
           <p style="color:#10b981;font-weight:700;font-size:13px;padding:12px 0">✅ Aucune menace identifiée</p>`
        : ''
    }
  `;

  document.getElementById('modalBackdrop').classList.add('open');
  if (autoPrint) setTimeout(() => printReport(), 350);
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  currentEmail = null;
}

// Fermer en cliquant en dehors
document.getElementById('modalBackdrop').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

/* ═══════════════════════════════════════
   IMPRESSION
   Ouvre une nouvelle fenêtre propre avec
   le rapport formaté, puis window.print()
═══════════════════════════════════════ */
function printReport() {
  if (!currentEmail) return;
  const e = currentEmail;
  const bc = badgeClass(e.status);

  const verdictMap = {
    clean:    { icon: '✅', title: 'Email Propre',     desc: 'Aucune menace détectée. Cet email est sûr.' },
    infected: { icon: '🦠', title: 'Email Infecté',    desc: 'Menaces critiques détectées. Ne pas ouvrir les pièces jointes.' },
    suspect:  { icon: '⚠️', title: 'Email Suspect',    desc: 'Éléments suspects détectés. Prudence recommandée.' },
    pending:  { icon: '🔍', title: 'Analyse en cours', desc: "L'analyse de cet email est en cours." },
  };

  const v          = verdictMap[bc];
  const now        = new Date().toLocaleString('fr-FR');
  const scColor    = scoreColor(e.score);
  const verdictBg  = { clean: '#d1fae5', infected: '#fee2e2', suspect: '#fef3c7', pending: '#e0e7ff' }[bc];
  const verdictCol = { clean: '#065f46', infected: '#991b1b', suspect: '#92400e', pending: '#3730a3' }[bc];
  const reportId   = String(e.id).padStart(5, '0');

  // Construction HTML des menaces
  const threatsHtml = e.threats.length > 0
    ? e.threats.map(t => {
        const bg  = { high: '#fee2e2', medium: '#fef3c7', low: '#d1fae5' }[t.level];
        const col = { high: '#991b1b', medium: '#92400e', low: '#065f46' }[t.level];
        const lbl = { high: 'Élevé',   medium: 'Moyen',   low: 'Faible'  }[t.level];
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 13px;
                      background:#f1f5f9;border-radius:8px;margin-bottom:7px;font-size:13px;">
            <span style="font-size:17px">${t.icon}</span>
            <span style="flex:1;color:#0a1628">${t.text}</span>
            <span style="font-size:11px;font-weight:700;padding:3px 10px;
                         border-radius:99px;background:${bg};color:${col}">${lbl}</span>
          </div>`;
      }).join('')
    : `<p style="color:#10b981;font-weight:700;font-size:13px;padding:8px 0;">
         ✅ Aucune menace identifiée
       </p>`;

  // Template HTML complet du rapport (styles inline = pas de dépendances)
  const reportHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport MailGuard — #${reportId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0a1628;
      background: #ffffff;
      padding: 40px 52px;
      font-size: 14px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 3px solid #1e4d9b;
      margin-bottom: 26px;
    }
    .logo-title { font-size: 21px; font-weight: 900; color: #1e4d9b; }
    .logo-sub   { font-size: 11px; color: #64748b; margin-top: 5px; }
    .meta       { text-align: right; font-size: 12px; color: #64748b; line-height: 1.8; }
    .meta strong { display: block; font-size: 14px; color: #0a1628; font-weight: 700; }
    .verdict {
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      background: ${verdictBg};
    }
    .v-icon  { font-size: 28px; }
    .v-title { font-size: 17px; font-weight: 800; color: ${verdictCol}; }
    .v-desc  { font-size: 12px; color: #475569; margin-top: 3px; }
    .section-title {
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .9px; color: #2563eb;
      margin: 24px 0 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .field { background: #f1f5f9; border-radius: 8px; padding: 11px 14px; }
    .field.full { grid-column: 1 / -1; }
    .field .lbl {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .6px; color: #94a3b8; margin-bottom: 5px;
    }
    .field .val {
      font-size: 13px; font-weight: 600; color: #0a1628;
      white-space: pre-wrap; word-break: break-word;
    }
    .score-val  { color: ${scColor}; font-size: 15px; }
    .footer {
      margin-top: 40px; padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex; justify-content: space-between;
      font-size: 11px; color: #94a3b8;
    }
    @media print {
      body { padding: 24px 32px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="logo-title">📧 MailGuard — Rapport d'analyse</div>
      <div class="logo-sub">Rapport généré automatiquement par le système MailGuard</div>
    </div>
    <div class="meta">
      <strong>Rapport #${reportId}</strong>
      Généré le ${now}
    </div>
  </div>

  <div class="verdict">
    <span class="v-icon">${v.icon}</span>
    <div>
      <div class="v-title">${v.title}</div>
      <div class="v-desc">${v.desc}</div>
    </div>
  </div>

  <div class="section-title">Informations de l'email</div>
  <div class="grid">
    <div class="field"><div class="lbl">Expéditeur</div><div class="val">${e.senderName}</div></div>
    <div class="field"><div class="lbl">Adresse email</div><div class="val">${e.senderEmail}</div></div>
    <div class="field full"><div class="lbl">Sujet</div><div class="val">${e.subject}</div></div>
    <div class="field"><div class="lbl">Date &amp; Heure</div><div class="val">${formatDate(e.date)} à ${e.time}</div></div>
    <div class="field"><div class="lbl">Taille</div><div class="val">${e.size}</div></div>
    <div class="field">
      <div class="lbl">Score de menace</div>
      <div class="val score-val">${e.score !== null ? e.score + ' / 100' : 'En cours…'}</div>
    </div>
    <div class="field">
      <div class="lbl">Pièces jointes (${e.attachments})</div>
      <div class="val">${e.attachmentNames.length ? e.attachmentNames.join(', ') : 'Aucune'}</div>
    </div>
    <div class="field full">
      <div class="lbl">En-têtes techniques</div>
      <div class="val" style="font-family:Courier New,monospace;font-size:12px">${e.headers}</div>
    </div>
    <div class="field full">
      <div class="lbl">Aperçu du contenu</div>
      <div class="val">${e.bodyPreview}</div>
    </div>
  </div>

  <div class="section-title">
    Menaces détectées${e.threats.length > 0 ? ' (' + e.threats.length + ')' : ''}
  </div>
  ${threatsHtml}

  <div class="footer">
    <span>MailGuard — Système d'analyse d'emails</span>
    <span>Rapport #${reportId} — Document confidentiel</span>
  </div>

  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  <\/script>
</body>
</html>`;

  // Ouvre une nouvelle fenêtre et y injecte le rapport
  const win = window.open('', '_blank', 'width=860,height=960,scrollbars=yes');
  if (!win) {
    alert('⚠️ Veuillez autoriser les popups pour imprimer le rapport.');
    return;
  }
  win.document.open();
  win.document.write(reportHTML);
  win.document.close();
}

/* ═══════════════════════════════════════
   INITIALISATION
═══════════════════════════════════════ */
updateStats();
renderTable();
