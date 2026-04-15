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

// ───────────────────────────────
// DB CONNECT
// ───────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ───────────────────────────────
// HELPERS
// ───────────────────────────────
const hashEmail = (text) =>
  crypto
    .createHash("sha256")
    .update(text || "")
    .digest("hex");

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

// ───────────────────────────────
// MODELS
// ───────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  resetToken: String,
  resetTokenExpire: Date,
  createdAt: { type: Date, default: Date.now },
});

const emailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filename: String,
  contentHash: String,
  score: Number,
  verdict: String,
  subject: String,
  senderEmail: String,
  bodyPreview: String,
  status: String,
  headers: Object,
  threats: Array,
  urls: Array,
  createdAt: { type: Date, default: Date.now },
});

const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  emailId: String,
  role: { type: String, enum: ["user", "assistant"] },
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Email = mongoose.model("Email", emailSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

// ───────────────────────────────
// JWT MIDDLEWARE
// ───────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ success: false });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ success: false });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false });
  }
};

// ───────────────────────────────
// AUTH ROUTES
// ───────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email déjà utilisé" });

    const error = validatePassword(password);
    if (error) return res.status(400).json({ message: error });

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });

    res.json({
      token: generateToken(user._id),
      user,
    });
  } catch (e) {
    res.status(500).json({ message: "register error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "invalid credentials" });

    res.json({
      token: generateToken(user._id),
      user,
    });
  } catch (e) {
    res.status(500).json({ message: "login error" });
  }
});

// ───────────────────────────────
// EMAIL SAVE (FIXED)
// ───────────────────────────────
app.post("/api/emails/save", protect, async (req, res) => {
  try {
    const {
      filename,
      contentHash,
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

    let email = await Email.findOne({
      userId: req.user._id,
      contentHash,
    });

    if (email) {
      email.score = score ?? email.score;
      email.verdict = verdict ?? email.verdict;
      email.subject = subject ?? email.subject;
      email.senderEmail = senderEmail ?? email.senderEmail;
      email.bodyPreview = bodyPreview ?? email.bodyPreview;
      email.status = status ?? email.status;
      email.headers = headers ?? email.headers;
      email.threats = threats ?? email.threats;
      email.urls = urls ?? email.urls;
      email.createdAt = new Date();

      await email.save();
    } else {
      email = await Email.create({
        userId: req.user._id,
        filename,
        contentHash: contentHash || hashEmail(bodyPreview),
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

    res.json({
      success: true,
      data: email,
    });
  } catch (e) {
    res.status(500).json({ message: "save error" });
  }
});

// ───────────────────────────────
// GET EMAILS
// ───────────────────────────────
app.get("/api/emails", protect, async (req, res) => {
  const emails = await Email.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  res.json({ success: true, data: emails });
});

// ───────────────────────────────
// CHAT SAVE
// ───────────────────────────────
app.post("/api/chat/save", protect, async (req, res) => {
  const { emailId, role, content } = req.body;

  const msg = await ChatMessage.create({
    userId: req.user._id,
    emailId,
    role,
    content,
  });

  res.json({ success: true, message: msg });
});

// ───────────────────────────────
// CHAT GET
// ───────────────────────────────
app.get("/api/chat/:emailId", protect, async (req, res) => {
  const messages = await ChatMessage.find({
    userId: req.user._id,
    emailId: req.params.emailId,
  }).sort({ createdAt: 1 });

  res.json({ success: true, messages });
});

// ───────────────────────────────
// START SERVER
// ───────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
