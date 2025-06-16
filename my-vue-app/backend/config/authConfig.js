// 📌 backend/config/authConfig.js
require("dotenv").config();

console.log("🔹 GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("🔹 GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Loaded" : "❌ Not Found");
console.log("🔹 JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Not Found");
console.log("🔹 REDIRECT_URI:", process.env.REDIRECT_URI);

module.exports = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
    REDIRECT_URI: process.env.REDIRECT_URI
};

