<template>
  <div class="detail-container" v-if="notice">
    <div class="header">
      <h2 class="title">{{ notice.title || "제목 없음" }}</h2>
    </div>

    <div class="meta-info">
      <div class="meta-row">
        <span class="meta-label">글쓴이</span>
        <span class="meta-value">관리자</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">작성일</span>
        <span class="meta-value">{{ formattedDate }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">조회수</span>
        <span class="meta-value">{{ notice.views || 0 }}</span>
      </div>
      <!-- ✅ 다중 첨부파일 표시 -->
      <div class="meta-row file-row" v-if="notice.files && notice.files.length > 0">
        <span class="meta-label">첨부파일</span>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div
            v-for="file in notice.files"
            :key="file.id"
            class="file-line"
          >
            <span class="file-icon"></span>
            <a
              class="file-link"
              :href="`http://localhost:5000/files/download/${getFileNameOnly(file.file_path)}`"
            >
              {{ file.original_name }}
            </a>
            <button
              v-if="isPreviewable(file.file_path)"
              class="preview-btn"
              @click="previewFile(file.file_path)"
            >
              🔍 미리보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <p>{{ notice.content || "내용 없음" }}</p>
    </div>

    <div class="button-group">
      <button v-if="isAdmin" @click="editNotice" class="edit-btn">✏️ 수정</button>
      <button v-if="isAdmin" @click="deleteNotice" class="delete-btn">🗑 삭제</button>
      <button @click="goBack" class="back-btn">목록으로</button>
    </div>
  </div>

  <div v-else class="loading">📄 공지사항을 불러오는 중입니다...</div>
</template>


<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchNoticeDetail, deleteNotice } from "@/api/noticeApi";
import { useSubjects } from "@/composables/useSubjects";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const notice = ref(null);
    const noticeId = route.params.id;
    const selectedYear = ref("");
    const { subjects } = useSubjects(selectedYear);
    const userRole = ref(localStorage.getItem("role"));
    const isAdmin = computed(() => userRole.value === "admin" || userRole.value === "professor");

    onMounted(async () => {
      try {
        const data = await fetchNoticeDetail(noticeId);
        if (data) {
          notice.value = data;
          selectedYear.value = data.academic_year || "";
        }
      } catch (e) {
        console.error("📛 공지사항 로딩 오류:", e);
      }
    });

    const getFileName = (fullPath) => {
      return fullPath.split("/").pop(); // ex: uploads/1234-파일명.pdf → 파일명만 추출
    };

    const isPreviewable = (filePath) => {
      return /\.(jpg|jpeg|png|gif|pdf)$/i.test(filePath);
    };

    const previewFile = (filePath) => {
      const filename = encodeURIComponent(filePath.split("/").pop());
      window.open(`http://localhost:5000/files/preview/${filename}`, "_blank");
    };

    const getFileNameOnly = (path) => {
      return path?.split("/").pop(); // "uploads/..." → "파일명"만 추출
    };




    const getSubjectName = (subjectId) => {
      const subject = subjects.value.find(subj => subj.id == subjectId);
      return subject ? subject.name : "알 수 없음";
    };

    const formattedDate = computed(() => {
      if (!notice.value?.created_at) return "날짜 없음";
      const date = new Date(notice.value.created_at);
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
    });
    
    const goBack = () => router.push("/notices");
    const editNotice = () => router.push(`/notices/edit/${noticeId}`);
    const deleteNoticeHandler = async () => {
      if (confirm("정말 삭제하시겠습니까?")) {
        const response = await deleteNotice(noticeId);
        if (!response.error) {
          alert("공지사항이 삭제되었습니다.");
          router.push("/notices");
        }
      }
    };

    return {
      notice,
      formattedDate,
      isAdmin,
      goBack,
      editNotice,
      deleteNotice: deleteNoticeHandler,
      isPreviewable,
      previewFile,
      getFileName,
      getFileNameOnly
    };
  }
};
</script>

<style scoped>
.detail-container {
  max-width: 1000px;
  margin: 80px auto;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  font-family: 'Noto Sans KR', sans-serif;
}

.header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
  margin-bottom: 0;
}

.title {
  font-size: 20px;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.meta-info {
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
  font-size: 14px;
}

.meta-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-label {
  width: 100px;
  color: #666;
  font-weight: 500;
}

.meta-value {
  flex: 1;
  color: #111827;
}

.file-row {
  align-items: center;
}

.file-download {
  background: none;
  border: none;
  color: #2563eb;
  padding: 0;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

.file-download:hover {
  color: #1d4ed8;
}

.content {
  padding: 24px 0;
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.edit-btn,
.delete-btn,
.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #facc15;
  color: black;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
}

.back-btn {
  background-color: #1d4ed8;
  color: white;
}

.edit-btn:hover {
  background-color: #eab308;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.back-btn:hover {
  background-color: #2563eb;
}

/* 미리보기 */
.file-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  padding: 4px 0;
  color: #1d4ed8;
}

.file-link {
  text-decoration: none;
  color: #1d4ed8;
  font-weight: 500;
  transition: color 0.2s;
}

.file-link:hover {
  color: #1e3a8a;
  text-decoration: underline;
}

.preview-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  padding: 0 6px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.preview-btn:hover {
  color: #1e3a8a;
  text-decoration: underline;
}




</style>