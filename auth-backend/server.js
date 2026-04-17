require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion MongoDB:", err));
const PLANS = {
  pro: { price: 500, name: "Pro" },
  business: { price: 1500, name: "Business" },
};

// ============================================================
// 📨 NODEMAILER TRANSPORTER
// ============================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================================================
// 👤 MODÈLE UTILISATEUR
// ============================================================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  picture: { type: String, default: null },
  resetToken: String,
  resetTokenExpire: Date,
  plan: {
    type: String,
    enum: ["gratuit", "pro", "business"],
    default: "gratuit",
  },
  analysisCount: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// ============================================================
// 📧 MODÈLE EMAIL
// ============================================================
const emailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  contentHash: { type: String, unique: false },
  score: Number,
  verdict: String,
  subject: String,
  senderEmail: String,
  bodyPreview: String,
  status: String,
  headers: Object,
  threats: Array,
  urls: Array,
  createdAt: Date,
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

// ── Helper : reset quotidien si besoin ──
const resetDailyIfNeeded = async (user) => {
  const now = new Date();
  const diffHours = (now - new Date(user.lastReset)) / (1000 * 60 * 60);
  if (diffHours >= 168) {
    user.analysisCount = 0;
    user.lastReset = now;
    await user.save();
  }
};

// ── Helper : limites par plan ──
const PLAN_LIMITS = { gratuit: 3, pro: 50, business: Infinity };

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

    // ✅ Generate default avatar with ui-avatars
    const defaultPicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=4f46e5&color=fff&size=128`;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      picture: defaultPicture, // ✅ Save in DB
    });

    const token = generateToken(newUser._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name,
        email,
        picture: defaultPicture, // ✅ Return in response
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de l'inscription" });
  }
});
app.post("/api/payment/create-checkout-session", protect, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Plan invalide" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Plan ${PLANS[plan].name}`,
            },
            unit_amount: PLANS[plan].price,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        plan,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur paiement" });
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

    if (!user.picture) {
      user.picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=4f46e5&color=fff&size=128`;
      await user.save();
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur de connexion" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res
        .status(400)
        .json({ success: false, message: "Token Google manquant" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email.split("@")[0];

    if (!email)
      return res
        .status(401)
        .json({ success: false, message: "Google token invalide" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: "google-auth",
        picture: payload.picture || null,
      });
    } else {
      user.picture = payload.picture || user.picture;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: payload.picture || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: "Erreur Google login" });
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

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"SecureMail" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #1a1a2e;">🔐 Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <a href="${resetLink}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #888; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>.</p>
          <p style="color: #888; font-size: 13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #aaa; font-size: 12px;">© SecureMail — Ne pas répondre à cet email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Email de récupération envoyé" });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Lien invalide ou expiré" });

    const passwordError = validatePassword(password);
    if (passwordError)
      return res.status(400).json({ success: false, message: passwordError });

    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Mot de passe réinitialisé" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================================
// 📊 ROUTES PLAN / QUOTA
// ============================================================

// ── Vérifier le quota (lecture seule) ──
app.get("/api/plan/check", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await resetDailyIfNeeded(user);

    const limit = PLAN_LIMITS[user.plan];
    const allowed = user.analysisCount < limit;
    const remaining = Math.max(
      0,
      limit === Infinity ? 999 : limit - user.analysisCount
    );

    res.json({
      success: true,
      data: {
        plan: user.plan,
        analysisCount: user.analysisCount,
        limit: limit === Infinity ? "illimité" : limit,
        remaining,
        allowed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ✅ NOUVELLE ROUTE SÉCURISÉE : Check + Incrément atomique avant analyse
// Cette route REMPLACE les anciens /check + /increment séparés côté client.
// Le frontend appelle cette route AVANT de lancer l'analyse.
// Si la réponse est success:false → quota dépassé, on n'analyse pas.
// Si success:true → le quota est déjà incrémenté, on lance l'analyse.
app.post("/api/plan/analyze", protect, async (req, res) => {
  try {
    // Récupérer le document complet (pas la version select("-password") du middleware)
    const user = await User.findById(req.user._id);

    // Reset quotidien automatique
    await resetDailyIfNeeded(user);

    const limit = PLAN_LIMITS[user.plan];

    // ── Refus si quota dépassé ──
    if (user.analysisCount >= limit) {
      return res.status(403).json({
        success: false,
        message: "Quota dépassé. Passez à un forfait supérieur.",
        data: {
          plan: user.plan,
          analysisCount: user.analysisCount,
          limit: limit === Infinity ? "illimité" : limit,
          remaining: 0,
          allowed: false,
        },
      });
    }

    // ── Autoriser et incrémenter en même temps ──
    user.analysisCount += 1;
    await user.save();

    const remaining = Math.max(
      0,
      limit === Infinity ? 999 : limit - user.analysisCount
    );

    res.json({
      success: true,
      data: {
        plan: user.plan,
        analysisCount: user.analysisCount,
        limit: limit === Infinity ? "illimité" : limit,
        remaining,
        allowed: remaining > 0,
      },
    });
  } catch (error) {
    console.error("Erreur /api/plan/analyze:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ── [DÉPRÉCIÉE] Incrémenter après analyse — gardée pour compatibilité mais ne plus utiliser ──
// Utiliser /api/plan/analyze à la place.
app.post("/api/plan/increment", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const limit = PLAN_LIMITS[user.plan];

    if (user.analysisCount >= limit)
      return res.status(403).json({ success: false, message: "Quota dépassé" });

    user.analysisCount += 1;
    await user.save();

    res.json({ success: true, data: { analysisCount: user.analysisCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ============================================================
// 📧 ROUTES EMAILS
// ============================================================

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

    let email = await Email.findOne({ userId: req.user._id, contentHash });

    if (email) {
      email.score = score;
      email.verdict = verdict;
      email.subject = subject;
      email.senderEmail = senderEmail;
      email.bodyPreview = bodyPreview;
      email.contentHash = contentHash;
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
        createdAt: new Date(),
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

app.delete("/api/emails/:id", protect, async (req, res) => {
  try {
    await Email.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur suppression" });
  }
});

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
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      await User.findByIdAndUpdate(userId, {
        plan: plan,
      });

      console.log("💳 Paiement OK → plan:", plan);
    }

    res.json({ received: true });
  }
);
// ============================================================
// 💳 PAIEMENT LOCAL (DEV ONLY - sans Stripe)
// ============================================================
app.post("/api/payment/fake-upgrade", protect, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!["pro", "business"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Plan invalide" });
    }

    await User.findByIdAndUpdate(req.user._id, { plan });

    res.json({
      success: true,
      message: `Plan mis à jour : ${plan}`,
      plan,
    });
  } catch (err) {
    console.error("Erreur fake-upgrade:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ============================================================
// 🚀 LANCEMENT
// ============================================================
app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));
