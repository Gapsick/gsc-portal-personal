const db = require("../config/db");


const getPendingUsers = async (req, res) => {
    try {
      const [results] = await db.promise().query(
        "SELECT name, email, student_id, phone, grade, is_foreign, special_lecture FROM users WHERE is_verified = 0"
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "❌ 사용자 목록 불러오기 실패", error: err });
    }
  };
  
const registerUser = async (req, res) => {
  const { name, studentId, phone, grade, isForeign, email, specialLecture } = req.body;

  if (!name || !studentId || !phone || !grade || !email) {
    return res.status(400).json({ message: "❌ 모든 필드를 입력해주세요." });
  }

  try {
    const [existingUsers] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "❌ 이미 등록된 이메일입니다." });
    }

    const insertQuery = `
      INSERT INTO users (name, student_id, phone, grade, is_foreign, email, special_lecture, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, studentId, phone, grade, isForeign, email, specialLecture, false];

    await db.promise().query(insertQuery, values);

    console.log("✅ 회원가입 성공!");
    res.json({ success: true, message: "✅ 회원가입 신청 완료! 관리자의 승인을 기다려주세요." });

  } catch (err) {
    console.error("❌ 회원가입 중 오류:", err);
    res.status(500).json({ message: "❌ 서버 오류 발생", error: err });
  }
};

// 인증번호 Line
const generateLineAuthCode = async (req, res) => {
  try {
    const userId = req.user.id; // JWT 인증 미들웨어 통해 삽입된 값

    // 6자리 숫자 인증번호 생성
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("📥 인증번호 생성됨:", authCode, "for userId:", userId);

    // DB에 저장
    const [result] = await db.promise().query(
      `UPDATE users SET line_auth_code = ? WHERE id = ?`,
      [authCode, userId]
    );
    
    console.log("🧩 DB UPDATE 결과:", result);
    
    if (result.affectedRows === 0) {
      console.warn("⚠️ 유저 ID를 못 찾았거나 업데이트 실패함 (id: " + userId + ")");
    }
    

    res.json({
      success: true,
      code: authCode,
      message: "✅ 인증번호가 생성되었습니다. LINE으로 전송해주세요.",
    });
  } catch (err) {
    console.error("❌ 인증번호 생성 실패:", err);
    res.status(500).json({ message: "서버 오류로 인증번호 생성 실패" });
  }
};

const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 랜덤 숫자
};

const createLineAuthCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "이메일이 필요합니다." });
  }

  const code = generateRandomCode();

  try {
    const [result] = await db.promise().query(
      "UPDATE users SET line_auth_code = ? WHERE email = ?",
      [code, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "해당 사용자를 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "인증번호가 생성되었습니다.", code });
  } catch (err) {
    console.error("❌ 인증번호 생성 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
};

module.exports = { getPendingUsers, registerUser, generateLineAuthCode, generateRandomCode, createLineAuthCode };
