const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  content: {
    type: String,
    required: true
  },

  analysis: {
    spam: Boolean,
    score: Number,
    details: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Email", emailSchema);