// config/db.js
// Ce fichier gère la connexion à MongoDB

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Se connecter à MongoDB avec l'adresse du .env
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Si ça marche → afficher un message de succès
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);

  } catch (error) {
    // Si ça ne marche pas → afficher l'erreur et arrêter
    console.error(`❌ Erreur MongoDB : ${error.message}`);
    process.exit(1); // arrêter le serveur
  }
};

module.exports = connectDB;