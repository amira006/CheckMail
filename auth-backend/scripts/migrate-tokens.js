/**
 * migrate-tokens.js
 * Run ONCE to migrate existing users from analysisCount → tokens system
 * Usage: node scripts/migrate-tokens.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté à MongoDB");
  console.log("🚀 Début de la migration tokens...\n");

  const User = mongoose.connection.collection("users");

  const res1 = await User.updateMany(
    { tokens: { $exists: false } },
    {
      $set: { tokens: 100, lastTokenRefill: new Date() },
      $unset: { analysisCount: "", lastReset: "" },
    }
  );
  console.log(`✅ ${res1.modifiedCount} users migrés → 100 tokens`);

  const res2 = await User.updateMany(
    { tokens: { $exists: true }, lastTokenRefill: { $exists: false } },
    { $set: { lastTokenRefill: new Date() } }
  );
  console.log(`✅ ${res2.modifiedCount} users → lastTokenRefill ajouté`);

  const res3 = await User.updateMany(
    {
      $or: [
        { analysisCount: { $exists: true } },
        { lastReset: { $exists: true } },
      ],
    },
    { $unset: { analysisCount: "", lastReset: "" } }
  );
  console.log(`✅ ${res3.modifiedCount} users → anciens champs supprimés`);

  console.log("\n🎉 Migration terminée !");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
