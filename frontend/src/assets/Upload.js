import { useState, useRef } from 'react';
import './Upload.css';

export default function Upload({ onAnalyze }) {
  const [file, setFile]     = useState(null);
  const [over, setOver]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep]     = useState(0);
  const ref = useRef();

  const STEPS = [
    'Lecture des métadonnées…',
    'Scan des liens…',
    'Analyse du contenu…',
    'Génération du rapport…',
  ];

  const pick = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.eml')) {
      alert('Veuillez sélectionner un fichier .eml');
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

  return (
    <div className="upload-page">
      {}
      <div className="upload-header">
        <div className="upload-badge">📁 Étape 1 sur 2</div>
        <h1>Importez votre <span>Email</span></h1>
        <p>Chargez votre fichier .eml et laissez notre plateforme analyser les menaces de sécurité en quelques secondes.</p>
      </div>

      {}
      <div className="upload-card">

        {}
        <div
          className={`drop-zone ${over ? 'over' : ''} ${file ? 'done' : ''}`}
          onClick={() => ref.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
        >
          <input
            ref={ref}
            type="file"
            accept=".eml"
            style={{ display: 'none' }}
            onChange={(e) => pick(e.target.files[0])}
          />
          <span className="drop-icon">{file ? '✅' : '📨'}</span>
          <h3>{file ? 'Fichier sélectionné !' : 'Glissez-déposez votre fichier ici'}</h3>
          <p>ou <strong>cliquez pour sélectionner</strong> un fichier depuis votre ordinateur</p>
        </div>

        {}
        {file && (
          <div className="file-preview">
            <div className="file-icon-box">📄</div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <button
              className="file-remove"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
            >✕</button>
          </div>
        )}

        {}
        <div className="upload-hint">
          <span></span>
          <p>
            Pour exporter au format <strong>.eml</strong> depuis Outlook : clic droit → "Enregistrer sous".
            Depuis Gmail : menu "Plus" → "Télécharger le message".
          </p>
        </div>

        {}
        <button
          className="analyze-btn"
          disabled={!file}
          onClick={analyze}
        >
          Analyser cet email
        </button>
      </div>

      {}
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
                  className={`load-step ${i < step ? 'done' : i === step ? 'active' : ''}`}
                >
                  {i < step ? '' : ''} {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
