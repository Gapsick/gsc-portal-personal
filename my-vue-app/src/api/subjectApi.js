import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// ✅ 전체 과목 가져오기
export const fetchSubjects = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subjects`);
    return response.data;
  } catch (error) {
    console.error("🚨 과목 목록 조회 실패:", error);
    return [];
  }
};

// ✅ 필터링된 과목 가져오기
export const fetchFilteredSubjects = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subjects`, { params });
    return response.data;
  } catch (error) {
    console.error("🚨 과목 목록 조회 실패:", error);
    return [];
  }
};

// ✅ 학년/카테고리별 과목 가져오기
export const fetchSubjectsByFilter = async (filter) => {
  try {
    const params = {};
    
    if (filter === "특강") {
      params.category = "특강";
    } else if (filter === "한국어") {
      params.category = "한국어";
    } else if (filter !== "전체") {
      params.academic_year = filter;
    }

    const response = await axios.get(`${API_BASE_URL}/subjects`, { params });
    
    // JLPT 과목 우선 정렬
    const subjects = response.data;
    subjects.sort((a, b) => {
      const isAJlpt = a.name?.startsWith("JLPT");
      const isBJlpt = b.name?.startsWith("JLPT");
      if (isAJlpt && !isBJlpt) return -1;
      if (!isAJlpt && isBJlpt) return 1;
      return 0;
    });

    return subjects;
  } catch (error) {
    console.error(`🚨 과목 목록 조회 실패:`, error);
    return [];
  }
};

// ✅ 학년별 과목 가져오기
export const fetchSubjectsByYear = async (academicYear) => {
  try {
    if (academicYear === "전체") {
      return await fetchSubjects(); // 전체 과목 반환
    }
    const response = await axios.get(`${API_BASE_URL}/subjects`, {
      params: { academic_year: academicYear } // ✅ 쿼리 파라미터로 요청!
    });
    return response.data;
  } catch (error) {
    console.error(`🚨 ${academicYear}학년 과목 목록 조회 실패:`, error);
    return [];
  }
};

