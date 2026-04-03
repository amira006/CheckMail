import { useState, useMemo } from 'react';
import './Historique.css';

/* ── DATA ── */
const EMAILS = [
  { id:1, senderName:"Ahmed Benali", senderEmail:"ahmed.benali@gmail.com", subject:"Facture #2024-0512 — Paiement urgent requis", date:"2024-06-10", time:"09:14", size:"348 Ko", status:"Infecté", score:94, attachments:2, attachmentNames:["facture.pdf","paiement.exe"], headers:"Received: from mail.spam-domain.ru\nX-Mailer: PhishKit v3", bodyPreview:"Veuillez régler cette facture dans les 24h ou votre compte sera suspendu.", threats:[{icon:"🦠",text:"Exécutable malveillant joint (paiement.exe)",level:"high"},{icon:"🔗",text:"Lien de phishing détecté dans le corps",level:"high"},{icon:"⚠️",text:"Expéditeur usurpant un domaine légitime",level:"medium"}] },
  { id:2, senderName:"Mariem Trabelsi", senderEmail:"mariem.t@company.tn", subject:"Réunion projet Q3 — Ordre du jour", date:"2024-06-10", time:"08:02", size:"42 Ko", status:"Propre", score:2, attachments:1, attachmentNames:["agenda_q3.pdf"], headers:"Received: from mail.company.tn\nDKIM: pass", bodyPreview:"Bonjour l'équipe, veuillez trouver ci-joint l'ordre du jour pour notre réunion de demain.", threats:[] },
  { id:3, senderName:"Support PayPal", senderEmail:"noreply@paypa1-secure.com", subject:"Votre compte a été limité — Action requise", date:"2024-06-09", time:"22:51", size:"125 Ko", status:"Infecté", score:99, attachments:0, attachmentNames:[], headers:"Received: from mail.paypa1-secure.com\nSPF: fail", bodyPreview:"Nous avons détecté une activité suspecte sur votre compte. Connectez-vous immédiatement.", threats:[{icon:"🎣",text:"Domaine imitant PayPal (paypa1-secure.com)",level:"high"},{icon:"🔗",text:"URL de phishing dans le bouton d'action",level:"high"}] },
  { id:4, senderName:"Nour Khelifi", senderEmail:"nour.khelifi@univ-tunis.tn", subject:"Thèse — Résultats chapitre 4", date:"2024-06-09", time:"14:30", size:"2.1 Mo", status:"Propre", score:0, attachments:3, attachmentNames:["chap4.docx","data.xlsx","graphs.zip"], headers:"Received: from smtp.univ-tunis.tn\nDKIM: pass\nSPF: pass", bodyPreview:"Bonjour, je vous transmets les résultats finaux du chapitre 4 de ma thèse.", threats:[] },
  { id:5, senderName:"Amazon.fr", senderEmail:"confirm@amaz0n-delivery.info", subject:"Votre colis est en attente — Frais de douane", date:"2024-06-09", time:"11:17", size:"88 Ko", status:"Suspect", score:71, attachments:1, attachmentNames:["suivi_colis.html"], headers:"Received: from amaz0n-delivery.info\nSPF: softfail", bodyPreview:"Votre colis est bloqué en douane. Veuillez payer 2,99 € pour le libérer.", threats:[{icon:"⚠️",text:"Domaine suspect imitant Amazon",level:"medium"},{icon:"📎",text:"Fichier HTML joint avec scripts embarqués",level:"medium"},{icon:"💳",text:"Demande de paiement non sollicitée",level:"medium"}] },
  { id:6, senderName:"Sarra Mansouri", senderEmail:"s.mansouri@cabinet-conseil.tn", subject:"Proposition commerciale — Partenariat 2024", date:"2024-06-08", time:"16:05", size:"560 Ko", status:"Propre", score:8, attachments:2, attachmentNames:["proposition.pdf","brochure.pdf"], headers:"Received: from mail.cabinet-conseil.tn\nDKIM: pass", bodyPreview:"Madame, Monsieur, suite à notre échange téléphonique, voici notre proposition.", threats:[] },
  { id:7, senderName:"Microsoft Azure", senderEmail:"azure-alerts@m1crosoft-cloud.net", subject:"Alerte sécurité — Connexion inhabituelle", date:"2024-06-08", time:"03:22", size:"64 Ko", status:"Infecté", score:97, attachments:0, attachmentNames:[], headers:"Received: from m1crosoft-cloud.net\nSPF: fail\nDKIM: fail", bodyPreview:"Votre abonnement Azure a été suspendu suite à une activité suspecte.", threats:[{icon:"🦠",text:"Domaine typosquat imitant Microsoft",level:"high"},{icon:"🎣",text:"Tentative d'hameçonnage ciblé (spear phishing)",level:"high"},{icon:"🕐",text:"Envoi à 3h du matin — comportement anormal",level:"low"}] },
  { id:8, senderName:"Rami Bouazizi", senderEmail:"r.bouazizi@startup.io", subject:"Invitation Beta — Notre nouvelle application SaaS", date:"2024-06-07", time:"10:44", size:"78 Ko", status:"Suspect", score:45, attachments:0, attachmentNames:[], headers:"Received: from mail.startup.io\nDKIM: pass\nSPF: softfail", bodyPreview:"Nous vous invitons à tester en exclusivité notre nouvelle plateforme.", threats:[{icon:"⚠️",text:"SPF softfail — configuration email incomplète",level:"low"},{icon:"🔍",text:"Domaine récemment enregistré (< 30 jours)",level:"medium"}] },
  { id:9, senderName:"La Poste Tunisienne", senderEmail:"notification@poste.tn", subject:"Avis de passage — Colis référence TN24891", date:"2024-06-07", time:"08:10", size:"31 Ko", status:"Propre", score:1, attachments:0, attachmentNames:[], headers:"Received: from smtp.poste.tn\nDKIM: pass\nSPF: pass", bodyPreview:"Un avis de passage a été déposé pour votre colis TN24891.", threats:[] },
  { id:10, senderName:"Inconnu", senderEmail:"xd8f2k@protonmail.com", subject:"URGENT: Vos données personnelles exposées", date:"2024-06-06", time:"19:58", size:"15 Ko", status:"En cours", score:null, attachments:1, attachmentNames:["voir_ici.zip"], headers:"En cours d'analyse…", bodyPreview:"Nous avons vos données. Contactez-nous avant 24h.", threats:[] },
  { id:11, senderName:"Hana Dridi", senderEmail:"h.dridi@minfin.gov.tn", subject:"Déclaration fiscale 2023 — Accusé de réception", date:"2024-06-06", time:"14:22", size:"92 Ko", status:"Propre", score:0, attachments:1, attachmentNames:["accuse_reception.pdf"], headers:"Received: from smtp.gov.tn\nDKIM: pass\nSPF: pass", bodyPreview:"Votre déclaration fiscale 2023 a bien été reçue et enregistrée.", threats:[] },
  { id:12, senderName:"Lottery Winner", senderEmail:"winner@global-prize2024.win", subject:"Félicitations ! Vous avez gagné 1 500 000 €", date:"2024-06-05", time:"12:00", size:"210 Ko", status:"Infecté", score:100, attachments:1, attachmentNames:["claim_form.doc"], headers:"Received: from bulk.global-prize2024.win\nSPF: fail", bodyPreview:"Vous avez été sélectionné pour recevoir un prix. Remplissez le formulaire joint.", threats:[{icon:"🦠",text:"Document Word avec macros malveillantes",level:"high"},{icon:"🎣",text:"Arnaque classique à la loterie (advance-fee fraud)",level:"high"},{icon:"🌍",text:"Serveur d'envoi en masse blacklisté",level:"high"}] },
];

/* ── HELPERS ── */
const AVATAR_COLORS = ['#1e4d9b','#0f766e','#6d28d9','#b45309','#be185d','#0369a1','#047857'];
const avatarColor = s => { let h=0; for(let c of s) h=(h<<5)-h+c.charCodeAt(0); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };
const initials   = n => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const badgeCls   = s => ({ Propre:'clean', Infecté:'infected', Suspect:'suspect', 'En cours':'pending' }[s]||'pending');
const scoreColor = s => s===null?'#94a3b8':s>=75?'#ef4444':s>=40?'#f59e0b':'#10b981';
const formatDate = d => { const [y,m,day]=d.split('-'); return `${+day} ${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][+m-1]} ${y}`; };

const PER_PAGE = 8;

/* ── MODAL ── */
function Modal({ email, onClose }) {
  if (!email) return null;
  const bc = badgeCls(email.status);
  const sc = scoreColor(email.score);
  const verdictMap = {
    clean:    { icon:'✅', title:'Email Propre',     desc:'Aucune menace détectée. Cet email est sûr.' },
    infected: { icon:'🦠', title:'Email Infecté',    desc:'Menaces critiques détectées. Ne pas ouvrir les pièces jointes.' },
    suspect:  { icon:'⚠️', title:'Email Suspect',    desc:'Des éléments suspects ont été détectés. Prudence recommandée.' },
    pending:  { icon:'🔍', title:'Analyse en cours', desc:"L'analyse de cet email est en cours. Veuillez patienter." },
  };
  const v = verdictMap[bc];
  const levelLabel = { high:'Élevé', medium:'Moyen', low:'Faible' };

  return (
    <div className="modal-backdrop open" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{email.subject}</div>
            <div className="modal-subtitle">Email de {email.senderEmail} — reçu le {formatDate(email.date)} à {email.time}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className={`verdict-banner ${bc}`}>
            <span className="verdict-icon">{v.icon}</span>
            <div>
              <div className="verdict-title">{v.title}</div>
              <div className="verdict-desc">{v.desc}</div>
            </div>
          </div>

          <div className="section-title">Informations de l'email</div>
          <div className="report-grid">
            <div className="report-field"><div className="field-label">Expéditeur</div><div className="field-value">{email.senderName}</div></div>
            <div className="report-field"><div className="field-label">Adresse email</div><div className="field-value">{email.senderEmail}</div></div>
            <div className="report-field full"><div className="field-label">Sujet</div><div className="field-value">{email.subject}</div></div>
            <div className="report-field"><div className="field-label">Date & Heure</div><div className="field-value">{formatDate(email.date)} à {email.time}</div></div>
            <div className="report-field"><div className="field-label">Taille</div><div className="field-value">{email.size}</div></div>
            <div className="report-field"><div className="field-label">Score de menace</div><div className="field-value" style={{color:sc,fontFamily:'monospace',fontWeight:700}}>{email.score!==null?email.score+' / 100':'En cours…'}</div></div>
            <div className="report-field"><div className="field-label">Pièces jointes ({email.attachments})</div><div className="field-value">{email.attachmentNames.length?email.attachmentNames.join(', '):'Aucune'}</div></div>
            <div className="report-field full"><div className="field-label">En-têtes techniques</div><div className="field-value" style={{fontSize:12,whiteSpace:'pre-wrap',fontFamily:'monospace'}}>{email.headers}</div></div>
            <div className="report-field full"><div className="field-label">Aperçu du contenu</div><div className="field-value">{email.bodyPreview}</div></div>
          </div>

          {email.threats.length > 0 && (<>
            <div className="section-title">Menaces détectées ({email.threats.length})</div>
            <ul className="threat-list">
              {email.threats.map((t,i)=>(
                <li key={i} className={`threat-item ti-${t.level}`}>
                  <span className="ti-icon">{t.icon}</span>
                  <span className="ti-text">{t.text}</span>
                  <span className="ti-badge">{levelLabel[t.level]}</span>
                </li>
              ))}
            </ul>
          </>)}
          {email.threats.length===0 && bc!=='pending' && (
            <p style={{color:'#10b981',fontWeight:700,fontSize:13,padding:'12px 0'}}>✅ Aucune menace identifiée</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function Historique() {
  const [search,      setSearch]      = useState('');
  const [filterStatus,setFilterStatus]= useState('');
  const [filterSort,  setFilterSort]  = useState('date-desc');
  const [page,        setPage]        = useState(1);
  const [modal,       setModal]       = useState(null);

  const filtered = useMemo(() => {
    let data = EMAILS.filter(e => {
      const q = search.toLowerCase();
      return (!q || e.senderName.toLowerCase().includes(q) || e.senderEmail.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q))
          && (!filterStatus || e.status === filterStatus);
    });
    data.sort((a,b) => {
      if (filterSort==='date-desc')  return (b.date+b.time).localeCompare(a.date+a.time);
      if (filterSort==='date-asc')   return (a.date+a.time).localeCompare(b.date+b.time);
      if (filterSort==='score-desc') return (b.score??-1)-(a.score??-1);
      if (filterSort==='score-asc')  return (a.score??101)-(b.score??101);
      return 0;
    });
    return data;
  }, [search, filterStatus, filterSort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const stats = {
    total:    EMAILS.length,
    clean:    EMAILS.filter(e=>e.status==='Propre').length,
    infected: EMAILS.filter(e=>e.status==='Infecté').length,
    suspect:  EMAILS.filter(e=>e.status==='Suspect').length,
  };

  return (
    <div className="hist-page">

      {/* Stats */}
      <div className="hist-stats">
        <div className="stat-card"><div className="stat-num">{stats.total}</div><div className="stat-lbl">Total</div></div>
        <div className="stat-card clean"><div className="stat-num">{stats.clean}</div><div className="stat-lbl">Propres</div></div>
        <div className="stat-card infected"><div className="stat-num">{stats.infected}</div><div className="stat-lbl">Infectés</div></div>
        <div className="stat-card suspect"><div className="stat-num">{stats.suspect}</div><div className="stat-lbl">Suspects</div></div>
      </div>

      {/* Toolbar */}
      <div className="hist-toolbar">
        <input className="hist-search" placeholder="Rechercher un email…" value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        <select className="hist-select" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}>
          <option value="">Tous les statuts</option>
          <option value="Propre">Propre</option>
          <option value="Infecté">Infecté</option>
          <option value="Suspect">Suspect</option>
          <option value="En cours">En cours</option>
        </select>
        <select className="hist-select" value={filterSort} onChange={e=>setFilterSort(e.target.value)}>
          <option value="date-desc">Date (récent)</option>
          <option value="date-asc">Date (ancien)</option>
          <option value="score-desc">Score (élevé)</option>
          <option value="score-asc">Score (faible)</option>
        </select>
      </div>

      {/* Table */}
      <div className="hist-table-wrap">
        <table className="hist-table">
          <thead>
            <tr>
              <th>Expéditeur</th>
              <th>Sujet</th>
              <th>Date</th>
              <th>Taille</th>
              <th>Statut</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="hist-empty">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-5 9 5"/>
                  </svg>
                  <p>Aucun email trouvé</p>
                </div>
              </td></tr>
            ) : slice.map((e,i) => {
              const sc = scoreColor(e.score);
              return (
                <tr key={e.id} style={{animationDelay:`${i*40}ms`}}>
                  <td>
                    <div className="sender-cell">
                      <div className="avatar" style={{background:avatarColor(e.senderName)}}>{initials(e.senderName)}</div>
                      <div>
                        <div className="sender-name">{e.senderName}</div>
                        <div className="sender-email">{e.senderEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="subject-text" title={e.subject}>{e.subject}</span>
                    {e.attachments>0 && <div className="subject-attachments">📎 {e.attachments} pièce{e.attachments>1?'s':''} jointe{e.attachments>1?'s':''}</div>}
                  </td>
                  <td><div className="date-main">{formatDate(e.date)}</div><div className="date-time">{e.time}</div></td>
                  <td><span className="size-text">{e.size}</span></td>
                  <td>
                    <span className={`badge badge-${badgeCls(e.status)}`}>
                      <span className="badge-dot"></span>{e.status}
                    </span>
                  </td>
                  <td>
                    <div className="score-wrap">
                      <div className="score-bar-bg">
                        <div className="score-bar-fill" style={{width:`${e.score??0}%`,background:sc}}></div>
                      </div>
                      <span className="score-num" style={{color:sc}}>{e.score!==null?e.score+'%':'—'}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn-view" onClick={()=>setModal(e)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Voir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="hist-pagination">
        <span className="page-info">
          Affichage <strong>{filtered.length ? (currentPage-1)*PER_PAGE+1 : 0}–{Math.min(currentPage*PER_PAGE,filtered.length)}</strong> sur <strong>{filtered.length}</strong>
        </span>
        <div className="page-btns">
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} className={`page-btn${p===currentPage?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal email={modal} onClose={()=>setModal(null)} />
    </div>
  );
}