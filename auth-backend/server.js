require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// ============================================================
// 👤 MODÈLE UTILISATEUR
// ============================================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpire: Date,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// ============================================================
// 📧 MODÈLE EMAIL
// ============================================================
const emailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  score: { type: Number, default: 0 },
  verdict: { type: String, default: "Suspect" },
  subject: { type: String, default: "" },
  senderEmail: { type: String, default: "" },
  bodyPreview: { type: String, default: "" },
  status: { type: String, default: "done" },
  headers: { type: Object, default: {} },
  threats: { type: Array, default: [] },
  urls: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});
const Email = mongoose.model("Email", emailSchema);

// ============================================================
// 💬 MODÈLE CHAT MESSAGE
// ============================================================
const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emailId: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

// ============================================================
// 🛠️ UTILITAIRES
// ============================================================
const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

const validatePassword = (password) => {
  if (!password || password.length < 8)
    return "Le mot de passe doit avoir au moins 8 caractères";
  if (!/[A-Z]/.test(password))
    return "Le mot de passe doit contenir au moins une majuscule";
  if (!/[0-9]/.test(password))
    return "Le mot de passe doit contenir au moins un chiffre";
  return null;
};

// ============================================================
// 🔒 MIDDLEWARE JWT
// ============================================================
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "Accès refusé" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur inexistant" });

    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
};

// ============================================================
// 🔐 ROUTES AUTH
// ============================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res
        .status(400)
        .json({ success: false, message: "Email déjà utilisé" });

    const passwordError = validatePassword(password);
    if (passwordError)
      return res.status(400).json({ success: false, message: passwordError });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    const token = generateToken(newUser._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name, email },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de l'inscription" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ success: false, message: "Identifiants incorrects" });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur de connexion" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ success: true, message: "Lien envoyé si l'email existe" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000;
    await user.save();

    console.log(
      `Lien de reset : http://localhost:3000/reset-password?token=${token}`
    );
    res.json({
      success: true,
      message: "Email de récupération envoyé (simulé)",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================================
// 📧 ROUTES EMAILS
// ============================================================

// ── Sauvegarder ou mettre à jour une analyse ──
app.post("/api/emails/save", protect, async (req, res) => {
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

    // كان الإيميل موجود بنفس الاسم → نحدثو
    let email = await Email.findOne({ userId: req.user._id, filename });

    if (email) {
      email.score = score;
      email.verdict = verdict;
      email.subject = subject;
      email.senderEmail = senderEmail;
      email.bodyPreview = bodyPreview;
      email.status = status;
      email.headers = headers;
      email.threats = threats;
      email.urls = urls;
      email.createdAt = new Date();
      await email.save();
    } else {
      email = await Email.create({
        userId: req.user._id,
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
      });
    }

    res.status(201).json({
      success: true,
      data: { id: email._id, filename: email.filename, status: email.status },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erreur sauvegarde email" });
  }
});

// ── Récupérer l'historique ──
app.get("/api/emails", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const emails = await Email.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Email.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: { emails, pagination: { page, limit, total } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur récupération" });
  }
});

// ── Supprimer une analyse ──
app.delete("/api/emails/:id", protect, async (req, res) => {
  try {
    await Email.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur suppression" });
  }
});

// ── Statistiques ──
app.get("/api/emails/stats", protect, async (req, res) => {
  try {
    const total = await Email.countDocuments({ userId: req.user._id });
    const safe = await Email.countDocuments({
      userId: req.user._id,
      verdict: "Propre",
    });
    const suspect = await Email.countDocuments({
      userId: req.user._id,
      verdict: "Suspect",
    });
    const dangerous = await Email.countDocuments({
      userId: req.user._id,
      verdict: "Infecté",
    });
    res.json({ success: true, data: { total, safe, suspect, dangerous } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur stats" });
  }
});

// ============================================================
// 💬 ROUTES CHAT HISTORY
// ============================================================

// ── Sauvegarder un message ──
app.post("/api/chat/save", protect, async (req, res) => {
  try {
    const { emailId, role, content } = req.body;
    if (!emailId || !role || !content)
      return res
        .status(400)
        .json({ success: false, message: "Données manquantes" });

    const msg = await ChatMessage.create({
      userId: req.user._id,
      emailId,
      role,
      content,
    });
    res.status(201).json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur sauvegarde" });
  }
});

// ── Récupérer l'historique d'un email ──
app.get("/api/chat/:emailId", protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      userId: req.user._id,
      emailId: req.params.emailId,
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur récupération" });
  }
});

// ============================================================
// 🚀 LANCEMENT
// ============================================================
app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));
