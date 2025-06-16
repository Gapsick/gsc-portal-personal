<template>
  <br><br>
  <div class="notice-container">
    <div class="notice-header">
      <h2>NOTICE</h2>
      <div class="notice-subtitle">공지사항</div>
    </div>

    <div class="notice-top">
      <div class="write-btn-container">
        <button v-if="isAdmin" @click="goToWritePage" class="write-btn">+ 새 공지 작성</button>
      </div>
    </div>

    <div class="search-area">
      <NoticeFilters
        v-model:searchQuery="searchQuery"
        v-model:selectedYear="selectedYear"
        v-model:selectedSubject="selectedSubject"
        :subjects="subjectList"
      />
    </div>

    <div class="notice-content">
      <p v-if="isLoading" class="loading-text">🔄 공지사항을 불러오는 중입니다...</p>

      <table v-else-if="filterNotices.length > 0" class="notice-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>대상학년</th>
            <th>과목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(notice, index) in paginatedNotices" :key="notice.id">
            <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
            <td>
              <router-link :to="`/notices/${notice.id}`" class="notice-title-link">
                <strong>{{ notice.title }}</strong>
                <span v-if="notice.is_pinned" class="pin">📌</span>
              </router-link>
            </td>
            <td>
              {{
                getDisplayAcademicYear(notice)
              }}
            </td>
            <td>{{ getSubjectName(notice.subject_id, notice.academic_year) }}</td>
            <td>{{ notice.author || "관리자" }}</td>
            <td>{{ formatDate(notice.created_at) }}</td>
            <td>{{ notice.views || 0 }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty-text">📢 현재 등록된 공지사항이 없습니다.</p>

      <div class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1"><</button>
        <span v-for="page in totalPages" :key="page">
          <button @click="currentPage = page" :class="{ active: currentPage === page }">{{ page }}</button>
        </span>
        <button @click="currentPage++" :disabled="currentPage === totalPages">></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, computed } from "vue";
import { storeToRefs } from "pinia";
import { useNoticeStore } from "@/stores/useNoticeStore";
import { useNoticeFilters } from "@/composables/useNoticeFilters";
import { useAuth } from "@/composables/useAuth";
import { useSubjects } from "@/composables/useSubjects";
import { formatDate } from "@/utils/formatUtils";
import { useRouter } from "vue-router";
import NoticeFilters from "@/components/NoticeFilters.vue";
import { fetchSubjects } from "@/api/subjectApi";

const router = useRouter();
const noticeStore = useNoticeStore();
const { notices } = storeToRefs(noticeStore);
const { searchQuery, selectedYear, selectedSubject, filterNotices } = useNoticeFilters(notices);
const { subjects } = useSubjects(selectedYear);
const { isAdmin } = useAuth();
const isLoading = ref(true);
// page navigation
const currentPage = ref(1);
const itemsPerPage = 10;
const subjectList = ref([]);


onMounted(async () => {
  isLoading.value = true;
  try {
    await noticeStore.getNotices();
    const subjects = await fetchSubjects(); // ← 새로 추가
    subjectList.value = subjects;
    console.log("📚 과목 리스트:", subjectList.value);
  } catch (error) {
    console.error("🚨 데이터 불러오기 실패:", error);
  } finally {
    isLoading.value = false;
  }
});


watchEffect(() => {
  isLoading.value = notices.value.length === 0 || subjects.value.length === 0;
});

const getSubjectName = (subjectId, noticeAcademicYear) => {
  if (!subjectId) return "공통";
  if (!subjectList.value || subjectList.value.length === 0) return "로딩 중...";

  const subject = subjectList.value.find((subj) => subj.id == subjectId);
  if (!subject) return "알 수 없음";

  if (subject.category === "특강") {
    return `[특강] ${subject.name}`;
  }

  if (subject.category === "한국어") {
    return `[한국어] ${subject.name}`;
  }

  return subject.name;
};

const getDisplayAcademicYear = (notice) => {
  const subject = subjectList.value.find((s) => s.id == notice.subject_id);
  if (subject?.category === "특강") return "특강";
  if (subject?.category === "한국어") return "한국어";

  if (notice.academic_year === 0) return "전체";
  if (notice.academic_year === null || notice.academic_year === undefined) return "전체";

  return `${notice.academic_year}학년`;
};



const goToWritePage = () => {
  router.push("/notices/write");
};

// pagenavigation 계산 속성
const paginatedNotices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filterNotices.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filterNotices.value.length / itemsPerPage);
});
</script>

<style scoped>
.notice-container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  font-family: 'Noto Sans KR', sans-serif;
}

.notice-header {
  text-align: center;
  margin-bottom: 40px;
}

.notice-header h2 {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #111827;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  margin: 0;
}

.notice-subtitle {
  font-size: 15px;
  color: #555;
  margin-top: 10px;
}

.notice-top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.write-btn-container {
  text-align: right;
}

.write-btn {
  background-color: #1d4ed8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.write-btn:hover {
  background-color: #1e40af;
}

.search-area {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.notice-content {
  margin-top: 15px;
}

.notice-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.notice-table th {
  background-color: #f8f9fa;
  color: #111827;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  border-top: 2px solid #333;
  border-bottom: 1px solid #ddd;
}

.notice-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  line-height: 1.4;
}

/* 각 열의 너비 조정 */
.notice-table th:nth-child(1), 
.notice-table td:nth-child(1) { /* 번호 */
  width: 70px;
  text-align: center;
}

.notice-table th:nth-child(2), 
.notice-table td:nth-child(2) { /* 제목 */
  width: calc(100% - 600px); /* 전체 너비에서 다른 열들의 너비 합을 뺀 값 */
  min-width: 200px;
}

.notice-table th:nth-child(3), 
.notice-table td:nth-child(3) { /* 대상학년 */
  width: 90px;
  text-align: center;
}

.notice-table th:nth-child(4), 
.notice-table td:nth-child(4) { /* 과목 */
  width: 180px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice-table th:nth-child(5), 
.notice-table td:nth-child(5) { /* 작성자 */
  width: 90px;
  text-align: center;
}

.notice-table th:nth-child(6), 
.notice-table td:nth-child(6) { /* 작성일 */
  width: 100px;
  text-align: center;
}

.notice-table th:nth-child(7), 
.notice-table td:nth-child(7) { /* 조회수 */
  width: 70px;
  text-align: center;
}

.notice-table tr:hover {
  background-color: #f8f9fa;
}

.notice-title-link {
  color: #111827;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-title-link:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

.notice-title-link strong {
  font-weight: 400;
}

.pin {
  color: #dc2626;
  font-size: 14px;
}

.loading-text,
.empty-text {
  text-align: center;
  color: #666;
  margin: 40px 0;
  font-size: 15px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
}

.pagination button {
  min-width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background-color: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination button:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #1d4ed8;
  color: #1d4ed8;
}

.pagination button.active {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  color: white;
  font-weight: 500;
}

.pagination button:disabled {
  background-color: #f8f9fa;
  border-color: #eee;
  color: #999;
  cursor: not-allowed;
}
</style>