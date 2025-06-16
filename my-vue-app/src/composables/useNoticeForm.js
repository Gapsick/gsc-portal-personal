import { ref } from "vue";
import axios from "axios";
import { getAccessToken, refreshAccessToken } from "@/api/noticeApi";
import { useRouter } from "vue-router";
import { postNotice } from "@/api/noticeApi"

const API_BASE_URL = "http://localhost:5000/api"; // ✅ API URL

export function useNoticeForm(initialData = {}) {
  const router = useRouter();

  // ✅ 공지사항 데이터 초기화
  const noticeData = ref({
    title: initialData.title || "",
    content: initialData.content || "",
    academic_year: initialData.academic_year || null,
    subject_id: initialData.subject_id || null,
    is_pinned: initialData.is_pinned || false,
    files: [],
    sendLine: true, // ✅ 이 줄 추가!
  });

  // 🔹 파일 업로드 핸들러
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await axios.post("/api/upload", formData);
      // ✅ 서버가 실제 파일 경로를 반환한다고 가정 (예: res.data.url)
      return res.data.url;
    } catch (err) {
      console.error("파일 업로드 실패", err);
      return "";
    }
  };
  

  // 🔹 JWT 토큰을 포함한 요청 함수
  async function makeAuthorizedRequest(url, method, data) {
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
    if (data instanceof FormData) {
      requestData = data;
      headers["Content-Type"] = "multipart/form-data";
    } else {
      // ✅ null 값 필터링하여 전송
      requestData = Object.fromEntries(
        Object.entries({ ...data }).filter(([_, v]) => v !== null && v !== undefined && v !== "") 
      );
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await axios({
        method,
        url,
        data: requestData,
        headers,
        withCredentials: true,
      });

      console.log(`✅ (useNoticeForm.js) ${method.toUpperCase()} 요청 성공:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ (useNoticeForm.js) ${method.toUpperCase()} 요청 실패:`, error.response?.data || error);

      // 🔹 만약 403 오류라면, 토큰 갱신 후 재시도
      if (error.response?.status === 403) {
        console.warn("🔄 JWT 토큰 갱신 시도 중...");
        token = await refreshAccessToken();
        if (token) {
          return makeAuthorizedRequest(url, method, data); // ✅ 토큰 갱신 후 재시도
        }
      }

      alert("요청 처리 중 오류가 발생했습니다.");
      return { error: "요청 실패" };
    }
  }

  // 🔹 공지사항 작성
  async function createNotice() {
    const formData = prepareFormData();
  
    // ✅ 여기서 직접 noticeData.value에서 꺼내기
    const {
      title,
      content,
      category,
      academic_year,
      subject_id,
      level,
      class_group
    } = noticeData.value;
  
    console.log("📦 최종 INSERT 데이터", {
      title,
      category,
      academic_year,
      subject_id,
      level,
      class_group
    });
  
    return await makeAuthorizedRequest(`${API_BASE_URL}/notices`, "post", formData);
  }

  // 🔹 공지사항 수정
  async function updateNotice(noticeId) {
    const formData = prepareFormData();
    return await makeAuthorizedRequest(`${API_BASE_URL}/notices/${noticeId}`, "put", formData);
  }

  function prepareFormData() {
    const formData = new FormData();
  
    formData.append("title", noticeData.value.title);
    formData.append("content", noticeData.value.content);
    formData.append("category", noticeData.value.category);
  
    const academicYear = noticeData.value.academic_year;
    formData.append("academic_year", academicYear != null ? String(academicYear) : "");
  
    const subjectId = noticeData.value.subject_id;
    formData.append("subject_id", subjectId != null ? String(subjectId) : "");
  
    formData.append("is_pinned", noticeData.value.is_pinned ? "1" : "0");
    formData.append("sendLine", noticeData.value.sendLine ? "1" : "0");
  
    // ✅ 여러 파일 추가
    const files = noticeData.value.files || [];
    for (const file of files) {
      formData.append("files", file); // 🔥 여기서 이름은 반드시 백엔드의 multer field와 동일해야 함
    }
  
    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("author", user?.name || "관리자");
  
    return formData;
  }
  
  

  return {
    noticeData,
    handleFileUpload,
    createNotice,
    updateNotice,
  };

}
