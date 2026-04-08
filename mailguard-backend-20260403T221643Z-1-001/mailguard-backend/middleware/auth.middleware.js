const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // 1. Récupérer le token depuis le header
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Pas de token → accès refusé
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Connectez-vous d\'abord.',
      });
    }

    // 3. Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Vérifier que l'utilisateur existe encore en base
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable.',
      });
    }

    // 5. Ajouter l'user dans la requête
    req.user = { id: user._id.toString(), email: user.email };
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Reconnectez-vous.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalide.',
    });
  }
};

module.exports = { protect };