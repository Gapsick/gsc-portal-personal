// 📌 backend/config/db.js
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || "210.101.236.159",
    user: process.env.DB_USER || "ss",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "ss_vue_test"
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL 연결 실패:", err);
    } else {
        console.log("✅ MySQL 연결 성공!");
    }
});

module.exports = db;
