const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth.middleware");
const {
  saveAnalysis,
  createEmail,
  getAllEmails,
  getEmailById,
  getEmailStatus,
  deleteEmail,
  getStats,
} = require("../controllers/email.controller");

// Configuration upload fichiers .eml
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Toutes les routes nécessitent un token JWT
router.use(protect);

router.post("/save", saveAnalysis); // POST   /api/emails/save  ← NOUVEAU
router.get("/stats", getStats); // GET    /api/emails/stats
router.post("/", upload.single("file"), createEmail); // POST   /api/emails
router.get("/", getAllEmails); // GET    /api/emails
router.get("/:id", getEmailById); // GET    /api/emails/:id
router.get("/:id/status", getEmailStatus); // GET    /api/emails/:id/status
router.delete("/:id", deleteEmail); // DELETE /api/emails/:id

module.exports = router;
