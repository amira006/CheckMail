const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema(
  {
    // ── Lien avec l'utilisateur (RELATION) ──────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Infos du fichier uploadé ─────────────────────
    filename: {
      type:     String,
      required: true,
    },
    filepath: {
      type:    String,
      default: null,
    },
    fileSize: {
      type:    Number,
      default: 0,
    },

    // ── Statut de l'analyse ──────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'analyzing', 'done', 'error'],
      default: 'pending',
    },

    // ── Résultat de l'analyse ────────────────────────
    score: {
      type:    Number,
      min:     0,
      max:     100,
      default: null,
    },
    verdict: {
      type:    String,
      enum:    ['Propre', 'Suspect', 'Infecté', 'En cours', null],
      default: null,
    },

    // ── Contenu de l'email parsé ─────────────────────
    senderName:  { type: String, default: '' },
    senderEmail: { type: String, default: '' },
    subject:     { type: String, default: '' },
    bodyPreview: { type: String, default: '' },

    // ── En-têtes techniques ──────────────────────────
    headers: {
      spf:   { type: String, default: 'unknown' },
      dkim:  { type: String, default: 'unknown' },
      dmarc: { type: String, default: 'unknown' },
      raw:   { type: String, default: '' },
    },

    // ── Pièces jointes ───────────────────────────────
    attachments: [
      {
        filename:  { type: String },
        mimetype:  { type: String },
        size:      { type: Number },
        isClean:   { type: Boolean, default: null },
        virusName: { type: String,  default: null },
      },
    ],

    // ── URLs trouvées dans l'email ───────────────────
    urls: [{ type: String }],

    // ── Menaces détectées ────────────────────────────
    threats: [
      {
        icon:  { type: String, default: '⚠️' },
        text:  { type: String, required: true },
        level: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
      },
    ],

    // ── Message si erreur ────────────────────────────
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Email', EmailSchema);