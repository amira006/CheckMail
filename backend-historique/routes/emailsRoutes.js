const express = require("express");
const router = express.Router();
const Email = require("../models/Email");


// 📌 GET HISTORIQUE (tableau emails)
router.get("/historique", async (req, res) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: emails
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur historique"
    });
  }
});


// 📌 GET ANALYSE EMAIL BY ID
router.get("/analyse/:id", async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email introuvable"
      });
    }

    res.json({
      success: true,
      data: email
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur analyse"
    });
  }
});


// 📌 ADD EMAIL (optionnel test)
router.post("/add", async (req, res) => {
  try {
    const newEmail = new Email(req.body);
    await newEmail.save();

    res.json({
      success: true,
      data: newEmail
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur création email"
    });
  }
});

module.exports = router;