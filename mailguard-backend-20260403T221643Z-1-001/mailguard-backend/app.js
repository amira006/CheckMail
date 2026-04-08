// app.js
// Ce fichier configure Express (les règles du serveur)

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Règles globales ──────────────────────────────────
// Autoriser le frontend à appeler le backend
app.use(cors());

// Comprendre le JSON dans les requêtes
app.use(express.json());

// Comprendre les formulaires HTML
app.use(express.urlencoded({ extended: true }));

// Rendre le dossier uploads accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes de l'API ──────────────────────────────────
app.use('/api/auth',   require('./routes/auth.routes'));
app.use('/api/emails', require('./routes/email.routes'));

// ── Route de test ────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ MailGuard API fonctionne !' });
});

// ── Gestion globale des erreurs ──────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop grand. Maximum 10 MB.'
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur'
  });
});

module.exports = app;