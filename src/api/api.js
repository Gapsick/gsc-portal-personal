import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// ✅ Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 요청을 보낼 때 토큰을 자동으로 헤더에 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 응답을 받을 때 토큰이 만료되었으면 Refresh Token으로 재발급
api.interceptors.response.use(
  (response) => response, // 성공 응답은 그대로 반환
  async (error) => {
    if (error.response && error.response.status === 403) {
      console.log("🔄 토큰이 만료됨, 새로 발급 시도...");

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.log("❌ Refresh Token 없음. 다시 로그인 필요");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // 🔹 새로운 토큰 요청
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = refreshResponse.data.token;
        
        // ✅ 새로운 토큰을 저장하고 기존 요청을 다시 보냄
        localStorage.setItem("token", newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;

        return api(error.config); // ✅ 원래 요청 재시도
      } catch (refreshError) {
        console.log("❌ Refresh Token도 만료됨. 다시 로그인 필요");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ✅ 공지사항 목록 가져오기
export const fetchNotices = async () => {
  try {
    const response = await api.get("/notices"); // ✅ axios 인스턴스 사용
    return response.data;
  } catch (error) {
    console.error("🚨 공지사항 목록 조회 실패:", error);
    return [];
  }
};

export default api;
