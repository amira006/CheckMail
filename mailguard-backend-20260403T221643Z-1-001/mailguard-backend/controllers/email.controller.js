const Email = require("../models/Email");
const fs = require("fs");

// POST /api/emails/save — Sauvegarder résultat analyse Flask
exports.saveAnalysis = async (req, res) => {
  try {
    const {
      filename,
      score,
      verdict,
      subject,
      senderEmail,
      bodyPreview,
      status,
      headers,
      threats,
      urls,
    } = req.body;

    const email = await Email.create({
      userId: req.user.id,
      filename: filename || "email.eml",
      score: score ?? null,
      verdict: verdict || null,
      subject: subject || "",
      senderEmail: senderEmail || "",
      bodyPreview: bodyPreview || "",
      status: status || "done",
      headers: headers || { spf: "unknown", dkim: "unknown", dmarc: "unknown" },
      threats: threats || [],
      urls: urls || [],
      fileSize: 0,
    });

    res.status(201).json({
      success: true,
      message: "Analyse sauvegardée",
      data: {
        id: email._id,
        filename: email.filename,
        status: email.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/emails — Uploader un fichier .eml
exports.createEmail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier fourni",
      });
    }

    const email = await Email.create({
      userId: req.user.id,
      filename: req.file.originalname,
      filepath: req.file.path,
      fileSize: req.file.size,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Email reçu, analyse en cours...",
      data: {
        id: email._id,
        filename: email.filename,
        status: email.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/emails — Historique de l'utilisateur
exports.getAllEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const total = await Email.countDocuments(filter);
    const emails = await Email.find(filter)
      .select("-filepath -headers.raw -urls")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        emails,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/emails/:id — Rapport complet
exports.getEmailById = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email introuvable",
      });
    }

    res.status(200).json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/emails/:id/status
exports.getEmailStatus = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select("status score verdict");

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email introuvable",
      });
    }

    res.status(200).json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/emails/:id
exports.deleteEmail = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email introuvable",
      });
    }

    if (email.filepath && fs.existsSync(email.filepath)) {
      fs.unlinkSync(email.filepath);
    }

    await email.deleteOne();

    res.status(200).json({
      success: true,
      message: "Email supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/emails/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await Email.countDocuments({ userId });
    const propre = await Email.countDocuments({ userId, verdict: "Propre" });
    const infecte = await Email.countDocuments({ userId, verdict: "Infecté" });
    const suspect = await Email.countDocuments({ userId, verdict: "Suspect" });
    const enCours = await Email.countDocuments({ userId, status: "pending" });

    res.status(200).json({
      success: true,
      data: { total, propre, infecte, suspect, enCours },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
