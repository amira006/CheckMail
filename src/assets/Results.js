import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';

function ScoreRing({ score, color }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function Results({ emlData }) {
  const navigate  = useNavigate();
  const [report,  setReport]  = useState(null);
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [busy,    setBusy]    = useState(true);
  const [history, setHistory] = useState([]);
  const msgsRef = useRef();

  const meta = emlData?.content ? {
    from:    (emlData.content.match(/^From:\s*(.+)$/im)    || [])[1] || '—',
    subject: (emlData.content.match(/^Subject:\s*(.+)$/im) || [])[1] || '—',
    date:    (emlData.content.match(/^Date:\s*(.+)$/im)    || [])[1] || '—',
    links:   (emlData.content.match(/https?:\/\/[^\s"<>]+/g) || []).length,
    attach:  (emlData.content.match(/filename[*=]+["']?([^"'\s;]+)/gi) || []).length,
  } : {};

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing]);

  const addBot = (text, chips = []) => setMsgs(p => [...p, { role: 'bot', text, chips }]);

  useEffect(() => {
    if (!emlData?.content) {
      addBot('Aucun email chargé. Retournez importer un fichier .eml.');
      setBusy(false); return;
    }
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setTyping(true); setBusy(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emlContent: emlData.content, emlName: emlData.name }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      const text = data.result || '';

      const jm = text.match(/\{[\s\S]*?"recommendation"[\s\S]*?\}/);
      let rep = null;
      if (jm) { try { rep = JSON.parse(jm[0]); setReport(rep); } catch(e) {} }

      let msg = text.replace(/\{[\s\S]*?"recommendation"[\s\S]*?\}/, '').trim();
      let chips = ['Risque de phishing ?', 'Les liens sont-ils sûrs ?', 'Que faire maintenant ?'];
      const cm = msg.match(/CHIPS:\s*(.+)/);
      if (cm) {
        chips = cm[1].split('|').map(s => s.trim()).slice(0, 3);
        msg = msg.replace(/CHIPS:.*/, '').trim();
      }

      setHistory([
        { role: 'user',      content: `[CTX] ${JSON.stringify(rep)} ${emlData.content.substring(0, 2000)}` },
        { role: 'assistant', content: 'Prêt.' },
      ]);
      setTyping(false); setBusy(false);
      if (msg) addBot(msg, chips);
    } catch(e) {
      setTyping(false); setBusy(false);
      addBot(`Une erreur est survenue : ${e.message}`);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    setMsgs(p => [...p.map(m => ({ ...m, chips: [] })), { role: 'user', text }]);
    const newH = [...history.filter(m => !m.content?.startsWith('[CTX]')), { role: 'user', content: text }];
    setHistory(p => [...p, { role: 'user', content: text }]);
    setTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newH.slice(-10), report, emlSnippet: emlData?.content?.substring(0, 2000) }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTyping(false);
      addBot(data.reply || 'Désolé, veuillez réessayer.');
      setHistory(p => [...p, { role: 'assistant', content: data.reply }]);
    } catch(e) {
      setTyping(false);
      addBot(`Erreur : ${e.message}`);
    }
  }, [input, typing, report, history, emlData]);

  const downloadPDF = () => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = 210, M = 18, CW = W - M * 2; let y = 0;
      const sf = (style, size, color = [84,101,255]) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
      const chk = (n = 20) => { if (y + n > 275) { doc.addPage(); y = 20; } };

      doc.setFillColor(17,24,39); doc.rect(0,0,W,38,'F');
      sf('bold',20,[255,255,255]); doc.text('Secure',M,25);
      sf('bold',20,[84,101,255]);  doc.text('Mail',M+26,25);
      sf('normal',8,[107,114,128]); doc.text('Rapport de sécurité · '+new Date().toLocaleDateString('fr-FR'),M+52,25);
      y = 48;

      sf('bold',8,[107,114,128]); doc.text('FICHIER ANALYSÉ',M,y); y+=5;
      sf('normal',10,[84,101,255]); doc.text(emlData?.name||'email.eml',M,y); y+=14;

      if (report) {
        const sc  = Math.max(0,Math.min(100,report.score||0));
        const col = sc>=70?[22,163,74]:sc>=40?[217,119,6]:[220,38,38];
        const vl  = { SAFE:'Email Sûr', SUSPICIOUS:'Suspect', DANGEROUS:'Dangereux' };
        doc.setFillColor(249,250,251); doc.setDrawColor(229,231,235);
        doc.roundedRect(M,y,CW,36,4,4,'FD');
        sf('bold',22,col); doc.text(String(sc),M+20,y+20,{align:'center'});
        sf('normal',7,[156,163,175]); doc.text('/100',M+20,y+26,{align:'center'});
        sf('bold',14,col); doc.text(vl[report.verdict]||'—',M+46,y+14);
        sf('normal',9,[107,114,128]);
        doc.text(doc.splitTextToSize(report.summary||'',CW-52),M+46,y+22); y+=46;

        chk(55); sf('bold',8,[107,114,128]); doc.text("DÉTAILS DE L'EMAIL",M,y); y+=8;
        [
          ['Fichier',       emlData?.name||'—'],
          ['Expéditeur',    meta.from],
          ['Objet',         meta.subject],
          ['Liens',         meta.links ? meta.links+' lien(s)' : 'Aucun'],
          ['Pièces jointes',meta.attach ? meta.attach+' pièce(s)' : 'Aucune'],
          ['Date',          meta.date],
        ].forEach(([l,v]) => {
          chk(10); doc.setFillColor(249,250,251); doc.setDrawColor(243,244,246);
          doc.roundedRect(M,y,CW,9,2,2,'FD');
          sf('bold',7,[156,163,175]); doc.text(l.toUpperCase(),M+4,y+6);
          sf('normal',8,[55,65,81]); doc.text(String(v||'—').substring(0,85),M+52,y+6); y+=11;
        });
      }

      const pg = doc.getNumberOfPages();
      for(let i=1;i<=pg;i++){
        doc.setPage(i); doc.setFillColor(249,250,251); doc.rect(0,287,W,10,'F');
        doc.setDrawColor(229,231,235); doc.line(0,287,W,287);
        sf('normal',6.5,[156,163,175]);
        doc.text('SecureMail · Rapport généré par IA · Confidentiel',M,293);
        doc.text(`Page ${i} / ${pg}`,W-M,293,{align:'right'});
      }
      doc.save(`SecureMail_${(emlData?.name||'email').replace('.eml','')}.pdf`);
    };
    if (!window.jspdf) document.head.appendChild(s); else s.onload();
  };

  const score   = report?.score ?? null;
  const ringColor = score === null ? '#e5e7eb' : score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const VM = {
    SAFE:      { cls: 'safe',    label: 'Email sûr'  },
    SUSPICIOUS:{ cls: 'warn',    label: 'Suspect'     },
    DANGEROUS: { cls: 'danger',  label: 'Dangereux'   },
  };
  const verdict = VM[report?.verdict] || { cls: 'pending', label: 'Analyse en cours' };

  return (
    <div className="rp-wrap">

      {}
      <div className="rp-left">

        {}
        <div className="rp-header">
          <div>
            <h1>Rapport de sécurité</h1>
            <span className="rp-fname">{emlData?.name || '—'}</span>
          </div>
          <div className="rp-header-btns">
            <button className="rp-btn-outline" onClick={() => navigate('/analyze')}>← Retour</button>
            <button className="rp-btn-primary" onClick={downloadPDF}>Télécharger PDF</button>
          </div>
        </div>

        <div className="rp-divider" />

        {}
        <div className="rp-score-section">
          <div className="rp-ring-wrap">
            <ScoreRing score={score ?? 0} color={ringColor} />
            <div className="rp-ring-center">
              <strong style={{ color: score !== null ? ringColor : '#9ca3af' }}>
                {score !== null ? score : '—'}
              </strong>
              <span>/100</span>
            </div>
          </div>
          <div className={`rp-verdict ${verdict.cls}`}>{verdict.label}</div>
          <p className="rp-summary">{report?.summary || 'L\'analyse de votre email est en cours…'}</p>
        </div>

        <div className="rp-divider" />

        {}
        <div>
          <div className="rp-section-title">Détails de l'email</div>
          <table className="rp-table">
            <tbody>
              <tr><td>Fichier</td><td>{emlData?.name || '—'}</td></tr>
              <tr><td>Expéditeur</td><td>{meta.from || '—'}</td></tr>
              <tr><td>Objet</td><td>{meta.subject || '—'}</td></tr>
              <tr><td>Liens</td><td>{meta.links > 0 ? `${meta.links} lien(s)` : 'Aucun'}</td></tr>
              <tr><td>Pièces jointes</td><td>{meta.attach > 0 ? `${meta.attach} pièce(s)` : 'Aucune'}</td></tr>
              <tr><td>Date</td><td>{meta.date || '—'}</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      {}
      <div className="rp-chat">

        {}
        <div className="rp-chat-topbar">
          <div className="rp-chat-topbar-icon"><ShieldIcon /></div>
          <div className="rp-chat-topbar-info">
            <h3>Assistant SecureMail</h3>
            <p><span className="rp-dot" /> En ligne</p>
          </div>
          {(typing || busy) && <span className="rp-thinking">Analyse en cours…</span>}
        </div>

        {/* Messages */}
        <div className="rp-msgs" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`rp-msg ${m.role}`}>
              <div className="rp-msg-sender">{m.role === 'bot' ? 'Assistant' : 'Vous'}</div>
              <div className="rp-bub" dangerouslySetInnerHTML={{ __html: m.text }} />
              {m.chips?.length > 0 && (
                <div className="rp-chips">
                  {m.chips.map((c, j) => (
                    <button key={j} className="rp-chip" onClick={() => setInput(c)}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="rp-msg bot">
              <div className="rp-msg-sender">Assistant</div>
              <div className="rp-tdots"><span /><span /><span /></div>
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
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Posez votre question sur cet email…"
            />
            <button className="rp-send" onClick={sendMessage} disabled={busy || !input.trim()}>
              <SendIcon />
            </button>
          </div>
          <p className="rp-input-hint">Appuyez sur Entrée pour envoyer</p>
        </div>

      </div>
    </div>
  );
}