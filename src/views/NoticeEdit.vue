<template>
  <div class="notice-edit-container">
    <h2>공지사항 수정</h2>
    <form @submit.prevent="updateNoticeData">
      <label>제목</label>
      <input type="text" v-model="notice.title" required />

      <label>내용</label>
      <textarea v-model="notice.content" required></textarea>

      <label>분류</label>
      <select v-model="notice.category">
        <option value="학과">정규 과목</option>
        <option value="과목별">특강</option>
        <option value="한국어">한국어</option>
      </select>

      <label v-if="notice.category === '학과'">학년</label>
      <select v-if="notice.category === '학과'" v-model="selectedYear">
        <option value="">전체</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <div v-if="filteredSubjects.length > 0">
        <label>과목</label>
        <select v-model="notice.subject_id">
          <option value="">과목 선택</option>
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <!-- 기존 첨부파일 -->
      <div class="form-group">
        <label>기존 첨부파일</label>
        <div v-for="(file, index) in notice.files" :key="file.id" class="file-upload-box">
          <span class="file-name">
            📄 <a :href="`http://localhost:5000/${file.file_path}`" target="_blank">
              {{ file.original_name }}
            </a>
          </span>
          <button type="button" class="file-remove-btn" @click="removeExistingFile(index)">❌</button>
        </div>
      </div>

      <!-- 새 파일 추가 -->
      <div class="form-group">
        <label>파일 추가</label>
        <div v-for="(file, index) in newFiles" :key="index" class="file-upload-box">
          <span class="file-name">📎 {{ file.name }}</span>
          <button type="button" class="file-remove-btn" @click="removeNewFile(index)">❌</button>
        </div>
        <label for="file-upload" class="file-label">📁 파일 선택</label>
        <input id="file-upload" type="file" multiple @change="handleFileUpload" hidden />
      </div>

      <div class="form-group switch-container">
        <span class="switch-label">공지 고정</span>
        <input type="checkbox" v-model="notice.is_pinned" />
      </div>

      <div class="action-buttons">
        <button type="submit">저장</button>
        <button type="button" @click="cancelEdit">취소</button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchNoticeDetail, updateNotice } from "@/api/noticeApi";
import { useSubjects } from "@/composables/useSubjects";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const notice = ref({ files: [] });
    const selectedYear = ref("");
    const { subjects, loadSubjects } = useSubjects(selectedYear);
    const newFiles = ref([]);
    const deletedFileIds = ref([]);

    onMounted(async () => {
      const data = await fetchNoticeDetail(route.params.id);
      notice.value = data;
      selectedYear.value = data.academic_year || "";
      await loadSubjects();
    });

    const filteredSubjects = computed(() => {
      const category = notice.value.category;
      if (category === "과목별") return subjects.value.filter((s) => s.category === "특강");
      if (category === "한국어") return subjects.value.filter((s) => s.category === "한국어");
      return subjects.value.filter((s) => s.category === "정규" && s.academic_year == selectedYear.value);
    });

    const handleFileUpload = (event) => {
      const files = Array.from(event.target.files);
      newFiles.value.push(...files);
    };

    const removeExistingFile = (index) => {
      const file = notice.value.files.splice(index, 1)[0];
      if (file && file.id) deletedFileIds.value.push(file.id);
    };

    const removeNewFile = (index) => {
      newFiles.value.splice(index, 1);
    };
    
    const updateNoticeData = async () => {
    const formData = new FormData();
    formData.append("title", notice.value.title);
    formData.append("content", notice.value.content);
    formData.append("category", notice.value.category || "학과");
    formData.append("academic_year", notice.value.category === "학과" ? selectedYear.value : null);
    formData.append("subject_id", notice.value.subject_id || "");
    formData.append("is_pinned", notice.value.is_pinned ? "1" : "0");

    // ✅ 새 파일 추가
    for (const file of newFiles.value) {
      formData.append("files", file);
    }

    // ✅ 삭제할 파일 ID 목록을 문자열로 전송
    formData.append("deletedFileIds", JSON.stringify(deletedFileIds.value));

    const response = await updateNotice(route.params.id, formData);
    if (!response.error) {
      alert("공지사항이 수정되었습니다.");
      router.push(`/notices/${route.params.id}`);
    } else {
      alert("수정 실패: " + response.error);
    }
  };
  
  const cancelEdit = () => {
  router.push(`/notices/${route.params.id}`);
};


    return {
      notice,
      selectedYear,
      subjects,
      filteredSubjects,
      newFiles,
      deletedFileIds,
      handleFileUpload,
      removeExistingFile,
      removeNewFile,
      updateNoticeData,
      cancelEdit,
    };
  },
};
</script>


<style scoped>
.notice-edit-container {
  max-width: 800px;
  margin: 100px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Noto Sans KR', sans-serif;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 8px;
  color: #555;
}

input[type="text"],
textarea,
select {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ddd;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #1d4ed8;
}

/* ✅ 공지 고정 스위치 */
.switch-container {
  display: flex;
  align-items: center; /* 👈 center로 바꾸면 정확히 수직 중앙 정렬 */
  gap: 12px;
  margin-top: 20px;
}

.switch-label {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  line-height: 22px;
}

.switch-container input[type="checkbox"] {
  width: 42px;
  height: 22px;
  border-radius: 50px;
  appearance: none;
  background-color: #ccc;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.switch-container input[type="checkbox"]::before {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.switch-container input[type="checkbox"]:checked {
  background-color: #4caf50;
}

.switch-container input[type="checkbox"]:checked::before {
  transform: translateX(20px);
}


/* ✅ 파일 업로드 */
.file-upload-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f3f4f6;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 14px;
}

.file-name a {
  color: #2563eb;
  text-decoration: underline;
  overflow-wrap: anywhere;
}

.file-remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
}

.file-remove-btn:hover {
  color: #dc2626;
}

.file-label {
  display: inline-block;
  background-color: #1d4ed8;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
/* ✅ 새 파일 업로드 버튼 */
.file-label {
  display: inline-block;
  margin-top: 12px;
  background-color: #1d4ed8;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

/* ✅ 버튼 그룹 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 40px;
}

.action-buttons button {
  flex: 1;
  padding: 12px 0;
  font-size: 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.2s ease;
}

.action-buttons button[type="submit"] {
  background-color: #1d4ed8;
  color: white;
}

.action-buttons button[type="submit"]:hover {
  background-color: #2563eb;
}

.action-buttons button[type="button"] {
  background-color: #9ca3af;
  color: white;
}

.action-buttons button[type="button"]:hover {
  background-color: #6b7280;
}

</style>

