import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// ✅ Access Token 가져오는 함수 추가
export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// ✅ Refresh Token 가져오는 함수 추가
export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

// 🔹 공지사항 목록 조회
export const fetchNotices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notices`);
    console.log("📢 API 응답:", response.data);
    return response.data;
  } catch (error) {
    console.error("🚨 공지사항 목록 조회 실패:", error);
    return [];
  }
};

// 🔹 공지사항 상세 조회 (수정된 버전)
export async function fetchNoticeDetail(noticeId) {
  console.log(`📢 (noticeApi.js) API 호출: /api/notices/${noticeId}`);

  try {
    const response = await axios.get(`${API_BASE_URL}/notices/${noticeId}`);
    const notice = response.data;
    console.log("📢 (noticeApi.js) 응답 데이터:", notice);

    if (!notice || Object.keys(notice).length === 0) {
      console.warn("❌ (noticeApi.js) 응답이 비어 있음");
      return null;
    }

    // ✅ subject_id 안전 처리
    if (!notice.hasOwnProperty("subject_id") || notice.subject_id === null) {
      notice.subject_id = null;
    }

    // ✅ 이제는 백엔드에서 files 배열을 직접 내려주니까, 따로 가공 필요 없음
    return notice;
  } catch (error) {
    console.error("❌ (noticeApi.js) 공지사항 상세 조회 실패:", error);
    return null;
  }
}



// 🔹 공지사항 작성 (FormData 사용)
export function createNotice(formData) {
  const token = getAccessToken();

  return axios.post(`${API_BASE_URL}/notices`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
}

// 🔹 Refresh Token을 이용해 새로운 Access Token 요청
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  const email = localStorage.getItem("userEmail");

  if (!refreshToken || !email) {
    console.error("❌ (noticeApi.js) Refresh Token 또는 Email 없음, 갱신 불가");
    return null;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      { email },
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
        withCredentials: true,
      }
    );

    console.log("✅ 새로운 Access Token 발급 완료:", response.data.accessToken);

    localStorage.setItem("accessToken", response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error("❌ Access Token 갱신 실패:", error);
    return null;
  }
}

// ✅ 공지사항 작성 요청 (JWT 토큰 자동 갱신 포함)
export async function postNotice(formData) {
  let token = getAccessToken();

  if (!token) {
    alert("로그인이 필요합니다.");
    return { error: "로그인이 필요합니다." };
  }

  console.log("📢 (noticeApi.js) 전송할 FormData:");
  for (let [key, value] of formData.entries()) {
    console.log(`📌 ${key}:`, value);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/notices`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data", // ✅ 올바르게 설정!
      },
      withCredentials: true,
    });

    console.log("✅ (noticeApi.js) 공지사항 작성 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ (noticeApi.js) 공지사항 작성 오류:", error.response?.data || error);
    return { error: "공지사항 작성 실패" };
  }
}


// ✅ 공지사항 삭제 요청
export async function deleteNotice(noticeId) {
  let token = getAccessToken();

  if (!token) {
    console.warn("❌ JWT 토큰이 없음, 새로 갱신 시도");
    token = await refreshAccessToken();
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      return { error: "로그인이 필요합니다." };
    }
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/notices/${noticeId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    console.log("✅ (noticeApi.js) 공지사항 삭제 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ (noticeApi.js) 공지사항 삭제 실패:", error.response?.data || error);
    return { error: "공지사항 삭제 실패" };
  }
}

// ✅ 공지사항 수정 요청
export async function updateNotice(noticeId, noticeData) {
  let token = getAccessToken();

  if (!token) {
    console.warn("❌ JWT 토큰이 없음, 새로 갱신 시도");
    token = await refreshAccessToken();
    if (!token) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      return { error: "로그인이 필요합니다." };
    }
  }

  let headers = {
    Authorization: `Bearer ${token}`,
  };

  let requestData;
  if (noticeData instanceof FormData) {
    requestData = noticeData;
    headers["Content-Type"] = "multipart/form-data"; // ✅ FormData 사용
  } else {
    requestData = { ...noticeData };
    headers["Content-Type"] = "application/json"; // ✅ 일반 JSON 요청
  }

  try {
    const response = await axios.put(`${API_BASE_URL}/notices/${noticeId}`, requestData, {
      headers,
      withCredentials: true,
    });

    console.log("✅ 공지사항 수정 성공:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 공지사항 수정 오류:", error.response?.data || error);
    return { error: "공지사항 수정 실패" };
  }
}
