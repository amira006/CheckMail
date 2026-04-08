// server.js
// Ce fichier démarre le serveur

const dotenv    = require('dotenv');
const fs        = require('fs');
const app       = require('./app');
const connectDB = require('./config/db');

// 1. Charger les variables du fichier .env
dotenv.config();

// 2. Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Dossier uploads/ créé');
}

// 3. Se connecter à MongoDB, puis démarrer le serveur
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  });
});