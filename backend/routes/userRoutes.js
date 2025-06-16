const express = require("express");
const { registerUser, generateLineAuthCode, createLineAuthCode } = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware"); // ✅ JWT 인증 미들웨어 불러오기

const router = express.Router();

// 회원가입 요청
router.post("/register", registerUser);

// ✅ 라인 인증번호 생성 (로그인한 사용자만 접근 가능)
router.get("/generate-line-code", authenticate, generateLineAuthCode);

// ✅ 인증번호 생성
router.post("/line-auth", createLineAuthCode);

module.exports = router;
