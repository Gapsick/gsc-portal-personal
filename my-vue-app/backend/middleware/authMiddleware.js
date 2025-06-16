const jwt = require("jsonwebtoken");
const db = require("../config/db"); // ✅ DB 연결 추가

module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    console.log("📢 (authMiddleware) 요청 받은 Authorization 헤더:", req.headers.authorization);
    console.log("📢 (authMiddleware) 분리된 토큰:", token);

    if (!token) {
        console.log("❌ (authMiddleware) 토큰 없음!");
        return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ (authMiddleware) 검증된 토큰 정보:", decoded);

        // 🔹 DB에서 role 정보 가져오기
        const [rows] = await db.promise().query("SELECT role FROM users WHERE email = ?", [decoded.email]);

        if (rows.length === 0) {
            console.log("❌ (authMiddleware) 해당 유저 없음:", decoded.email);
            return res.status(403).json({ message: "유효하지 않은 사용자입니다." });
        }

        req.user = { id: decoded.id, email: decoded.email, role: rows[0].role };
        console.log("✅ (authMiddleware) 검증된 유저 정보:", req.user);
        
        next();
    } catch (error) {
        console.error("❌ (authMiddleware) 잘못된 토큰:", error.message);
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};
