const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const authController = require("../controllers/authController");
const { registerUser } = require("../controllers/userController")
require("dotenv").config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET } = process.env;

/**
 * 🔹 Google 로그인 관련
 */
router.get("/google/url", authController.getGoogleAuthUrl);
router.post("/google", authController.googleCallback);
router.get("/google/callback", authController.googleCallback);

/**
 * 회원가입 경로
 */

router.post("/register", registerUser)

/**
 * 🔹 1️⃣ Refresh Token을 사용하여 새로운 JWT Access Token 발급
 */
router.post("/refresh-token", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            console.log("❌ (authRoutes) email 없음!");
            return res.status(400).json({ message: "이메일이 필요합니다." });
        }

        // ✅ 1. DB에서 Refresh Token 조회
        const refreshToken = await getRefreshToken(email);
        if (!refreshToken) {
            console.log("❌ (authRoutes) Refresh Token 없음!");
            return res.status(403).json({ message: "Refresh Token이 없습니다." });
        }

        // ✅ 2. Google OAuth로 새로운 Access Token 요청
        const newAccessToken = await getNewAccessToken(refreshToken);
        if (!newAccessToken) {
            return res.status(403).json({ message: "Google에서 Access Token 갱신 실패" });
        }

        console.log("✅ (authRoutes) 새로운 Access Token 발급 완료:", newAccessToken);

        // ✅ 3. 새로운 JWT Access Token 발급 후 응답
        const newJwtToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ accessToken: newJwtToken });

    } catch (error) {
        console.error("❌ (authRoutes) Refresh Token 갱신 중 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

/**
 * 🔹DB에서 Refresh Token 조회
 */
async function getRefreshToken(email) {
    const [results] = await db.promise().query(
      "SELECT refresh_token FROM users WHERE email = ?",
      [email]
    );
    if (results.length === 0) throw new Error("Refresh Token 없음");
    return results[0].refresh_token;
  }
  

/**
 * 🔹 Google OAuth를 통해 새로운 Access Token 요청
 */
function getNewAccessToken(refreshToken) {
    return axios
        .post("https://oauth2.googleapis.com/token", {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        })
        .then((response) => response.data.access_token)
        .catch((error) => {
            console.error("❌ (authRoutes) Google Refresh Token 요청 실패:", error.response?.data || error.message);
            return null;
        });
}

module.exports = router;
