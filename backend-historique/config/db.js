const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://arijmanai:Arij123@cluster0.kwuwl6e.mongodb.net/ChekEmail?retryWrites=true&w=majority");
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.log("❌ Erreur DB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;