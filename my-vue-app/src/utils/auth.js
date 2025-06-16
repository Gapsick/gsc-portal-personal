import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// ✅ 사용자 인증 체크 함수 (JWT 토큰 확인 + 자동 갱신)
import axios from "axios";

// ✅ Access Token 갱신 함수 추가
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
      console.warn("❌ (auth.js) refreshToken이 없음. 자동 로그아웃 방지");
      return null;
  }

  try {
      console.log("🔄 (auth.js) Refresh Token을 사용해 새로운 Access Token 요청 중...");
      const response = await axios.post("http://localhost:5000/api/auth/refresh-token", { refreshToken });

      const newAccessToken = response.data.accessToken;
      console.log("✅ (auth.js) 새로운 Access Token 발급 완료:", newAccessToken);

      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
  } catch (error) {
      console.error("❌ (auth.js) Refresh Token 갱신 실패:", error);
      return null;
  }
}


// ✅ 사용자 인증 체크 함수 (갱신 포함)
export async function checkAuth() {
  let token = localStorage.getItem("accessToken");

  console.log("🔍 (auth.js) checkAuth() 실행됨, 저장된 Access Token:", token);

  if (!token) {
      console.log("❌ (auth.js) Access Token 없음, 로그인 필요");
      return null;
  }

  try {
      // ✅ 서버에 현재 사용자 정보 요청
      const response = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
      });

      console.log("✅ (auth.js) 로그인 유지됨, 사용자 정보:", response.data);
      return response.data;
  } catch (error) {
      console.log("🔄 (auth.js) Access Token 만료, Refresh Token 시도");

      try {
          // ✅ 새로운 Access Token 요청
          const userData = JSON.parse(localStorage.getItem("userData"));
          const email = userData?.email;

          if (!email) {
              console.log("❌ (auth.js) userData 없음, refresh 불가능");
              return null;
          }

          const newAccessToken = await refreshAccessToken(email);

          if (!newAccessToken) {
              console.error("❌ (auth.js) Refresh Token 갱신 실패, 로그인 필요");
              localStorage.removeItem("accessToken");
              return null;
          }

          // ✅ 새 Access Token으로 다시 사용자 정보 가져오기
          const response = await axios.get("http://localhost:5000/api/users/me", {
              headers: { Authorization: `Bearer ${newAccessToken}` },
              withCredentials: true,
          });

          console.log("✅ (auth.js) 로그인 유지 성공, 사용자 정보:", response.data);
          return response.data;
      } catch (refreshError) {
          console.error("❌ (auth.js) Refresh Token 만료됨, 로그인 필요");
          localStorage.removeItem("accessToken");
          return null;
      }
  }
}


// ✅ 사용자 역할(role) 가져오는 함수 (최신 데이터 유지)
export function getUserRole() {
    const userData = localStorage.getItem("userData");

    if (!userData) {
        console.log("⚠️ (auth.js) userData 없음, null 반환");
        return null;
    }

    try {
        const parsedData = JSON.parse(userData);
        console.log("🔍 (auth.js) getUserRole() 실행됨, 저장된 userData:", parsedData);
        return parsedData.role || null;
    } catch (error) {
        console.error("❌ (auth.js) JSON 파싱 오류:", error);
        return null;
    }
}
