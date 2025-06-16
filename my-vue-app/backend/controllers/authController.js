const axios = require("axios");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, JWT_SECRET } = process.env;

/**
 * 🔹 1️⃣ Google 로그인 URL 요청
 */
const getGoogleAuthUrl = (req, res) => {
  const baseUrl = "https://accounts.google.com/o/oauth2/auth";
  
  const options = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly" // ✅ Google Calendar API 권한 추가
    ].join(" "), // ✅ scope를 문자열로 결합
  };

  // URL 인코딩을 적용하여 쿼리 문자열을 생성
  const authUrl = `${baseUrl}?${new URLSearchParams(options).toString()}`;

  console.log("✅ (getGoogleAuthUrl) 생성된 OAuth URL:", authUrl); // ✅ 디버깅용 로그 추가

  return res.json({ authUrl });
};


/**
 * 🔹 2️⃣ Google OAuth 콜백 (인가 코드 받아서 사용자 정보 조회 후 응답)
 */
const googleCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.error("❌ 인가 코드 없음!");
    return res.status(400).json({ message: "❌ 인가 코드가 없습니다." });
  }

  try {
    // ✅ Google에서 Access Token 및 Refresh Token 요청
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code,
    });

    const { access_token, refresh_token } = tokenResponse.data;

    console.log("📢 (googleCallback) Google 응답:", tokenResponse.data); // ✅ Google 응답 전체 출력
    console.log("✅ (googleCallback) 받은 Access Token:", access_token);
    console.log("✅ (googleCallback) 받은 Refresh Token:", refresh_token || "없음");

    if (!access_token) {
      console.error("❌ Access Token 받기 실패!");
      return res.status(400).json({ message: "❌ Access Token을 받을 수 없습니다." });
    }

    // ✅ Access Token으로 사용자 정보 요청
    const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = userInfoResponse.data;
    console.log("✅ (googleCallback) Google 사용자 정보:", userInfo);

    // ✅ 이메일 변수 정리
    const email = userInfo.email;

    // ✅ @g.yju.ac.kr 이면 통과
    const isGyu = email.endsWith("@g.yju.ac.kr");

    // ✅ 그 외는 DB에서 approved_emails에 등록된 이메일인지 확인
    let isApproved = false;

    if (!isGyu) {
      const [approvedResults] = await db.promise().query(
        "SELECT * FROM approved_emails WHERE email = ? AND status = 'active'",
        [email]
      );
      isApproved = approvedResults.length > 0;
    }

    // ✅ 둘 다 아니면 거부
    if (!isGyu && !isApproved) {
      console.log("❌ 승인되지 않은 외부 이메일:", email);
      return res.send(`
        <script>
          window.opener.postMessage({ error: "승인되지 않은 이메일입니다." }, "http://localhost:5173");
          window.close();
        </script>
      `);
    }


    // ✅ DB에서 사용자 확인
    const [results] = await db.promise().query("SELECT * FROM users WHERE email = ?", [userInfo.email]);

      let user = results[0];

      if (results.length === 0) {
        console.log("🚀 신규 사용자 → 회원가입 유도 메시지 전송");
        return res.send(`
          <script>
            window.opener.postMessage({
              needRegister: true,
              email: "${userInfo.email}"
            }, "http://localhost:5173");
            window.close();
          </script>
        `);
      }
      
        console.log("✅ 기존 사용자 로그인!");

        // ✅ 기존 사용자라면 Refresh Token 업데이트
        await db.promise().query(
          "UPDATE users SET refresh_token = ? WHERE email = ?",
          [refresh_token || user.refresh_token, user.email]
        );
        console.log("✅ Refresh Token 업데이트 완료");

        proceedWithLogin(user);

      function proceedWithLogin(user) {
        // ✅ 승인 대기 상태 확인
        if (user.is_verified === 0) {
          console.log("⏳ 승인 대기 상태:", user.email);
          return res.send(`
            <script>
              window.opener.postMessage({ error: "승인 대기 중입니다." }, "http://localhost:5173");
              window.close();
            </script>
          `);
        }

        // ✅ JWT Access Token 발급 (1시간)
        const jwtToken = jwt.sign(
          {
            sub: user.google_id || "unknown",
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "student",
            is_verified: user.is_verified || 0,
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        console.log("✅ (googleCallback) 로그인 성공! JWT 발급 완료:", jwtToken);
        console.log("📢 (googleCallback) 클라이언트로 보낼 Refresh Token:", refresh_token || "없음");
        console.log("📢 (googleCallback) 클라이언트로 보낼 Google Access Token:", access_token);

        return res.send(`
          <script>
            window.opener.postMessage({ 
              token: "${jwtToken}", 
              googleAccessToken: "${access_token}",  // ✅ Google Access Token 추가
              refreshToken: "${refresh_token || ""}", 
              email: "${user.email}",
              role: "${user.role || "student"}",
              grade: "${user.grade || ""}",
              name: "${user.name}",
              specialLecture: "${user.special_lecture || ""}",
              class_group: "${user.class_group || ""}", //
              id: "${user.id}",
              is_foreign: "${user.is_foreign || 0}"
            }, "http://localhost:5173");
            window.close();
          </script>
        `);
      }
  } catch (error) {
    console.error("❌ Google OAuth 처리 중 오류 발생:", error.message);
    return res.status(500).json({ message: "Google 로그인 실패", error: error.message });
  }
};


module.exports = {
  getGoogleAuthUrl,
  googleCallback
};
