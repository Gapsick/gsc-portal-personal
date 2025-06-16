import axios from "axios";

/**
 * ✅ Google 로그인 팝업 열기
 */
export async function openGooglePopup() {
  try {
    const response = await axios.get("http://localhost:5000/api/auth/google/url");
    const googleLoginUrl = response.data.authUrl;
    window.open(googleLoginUrl, "Google Login", "width=500,height=600");

    console.log("🛠️ Google 로그인 팝업 생성됨:", googleLoginUrl);
  } catch (error) {
    console.error("🚨 Google 로그인 URL 요청 실패:", error);
    alert("Google 로그인 URL 요청 실패!");
  }
}

/**
 * ✅ Google 로그인 후 메시지 리스너
 */
export function handleGoogleMessage(event, router) {
  console.log("✅ 메인 창에서 받은 메시지:", event.data);

  if (!event.data) {
      console.error("❌ event.data가 undefined입니다! 메시지가 올바르게 전달되지 않음.");
      return;
  }

  if (event.data.error) {
      alert(event.data.error);
      return;
  }

  if (event.data.token) {  
      console.log("🛠️ Access Token 저장 중:", event.data.token);
      localStorage.setItem("accessToken", event.data.token);
      localStorage.setItem("role", event.data.role);

      if (event.data.refreshToken) {  
          console.log("📢 (googleAuth.js) Refresh Token 저장 중:", event.data.refreshToken);
          localStorage.setItem("refreshToken", event.data.refreshToken);
      } else {
          console.error("❌ (googleAuth.js) 받은 Refresh Token이 없음!");
      }

      console.log("🔍 저장 후 Access Token 확인:", localStorage.getItem("accessToken"));
      console.log("🔍 저장 후 Refresh Token 확인:", localStorage.getItem("refreshToken"));

      router.push("/main");
  } else if (event.data.needRegister) {
      localStorage.setItem("register_email", event.data.email);
      router.push("/register");
  }
}


  
