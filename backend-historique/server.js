const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// DB connect
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/emails", require("./routes/emailsRoutes"));

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});