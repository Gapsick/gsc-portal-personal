<template>
  <div class="register-container">
    <h2>회원가입 신청</h2>
    <form @submit.prevent="submitRegister">
      <label>이름</label>
      <input v-model="name" type="text" required />

      <label>학번</label>
      <input v-model="studentId" type="text" required />

      <label>전화번호</label>
      <input v-model="phone" type="text" required />

      <label>학년</label>
      <select v-model="grade">
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <div class="form-row">
        <div>
          <label>유학생 여부</label>
          <select v-model="form.isForeign">
            <option value="false">아니오</option>
            <option value="true">예</option>
          </select>
        </div>
        <div>
          <label>어학 레벨</label>
          <select v-model="form.specialLecture">
            <option value="">선택 안함</option>
            <option
              v-for="option in filteredLectures"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <label>이메일</label>
      <input v-model="email" type="email" disabled />

      <!-- ✅ 버튼 그룹 -->
      <div class="button-group">
        <button type="submit">회원가입 신청</button>
        <button type="button" class="cancel" @click="router.push('/login')">취소</button>
      </div>
    </form>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

// ✅ 반응형 변수 선언 (Composition API `ref` 사용)
const name = ref("");
const studentId = ref("");
const phone = ref("");
const grade = ref("1");
const email = ref("");
const errorMessage = ref("");

// ✅ `localStorage`에서 이메일 가져오기
onMounted(() => {
  email.value = localStorage.getItem("register_email") || "";
});

const form = ref({
  isForeign: 'false', // 초기값은 문자열 'false'
  specialLecture: '',
});

const lectureOptions = {
  foreign: [
    { value: 'N3', label: 'N3' },
    { value: 'N2', label: 'N2' },
    { value: 'N1', label: 'N1' },
  ],
  local: [
    { value: 'TOPIK4', label: 'TOPIK 4급' },
    { value: 'TOPIK6', label: 'TOPIK 6급' },
  ],
};

const filteredLectures = computed(() => {
  return form.value.isForeign === "true"
    ? lectureOptions.local      // 유학생이면 TOPIK ❌
    : lectureOptions.foreign;   // 내국인이면 JLPT ❌
});



// ✅ 회원가입 신청 함수
const submitRegister = async () => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/register", {
      name: name.value,
      studentId: studentId.value,
      phone: phone.value,
      grade: grade.value,
      isForeign: form.value.isForeign === "true",
      specialLecture: form.value.specialLecture,
      email: email.value
    });

    if (response.data.success) {
      alert("✅ 회원가입 신청 완료! 관리자의 승인을 기다려주세요.");
      localStorage.removeItem("register_email");
      router.push("/login"); // 로그인 페이지로 이동
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "❌ 회원가입 신청 실패!";
  }
};
</script>

<style scoped>
/* 전체 폼 컨테이너 */
.register-container {
  max-width: 480px;
  margin: 100px auto;
  padding: 40px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  font-family: 'Noto Sans KR', sans-serif;
  box-sizing: border-box;
}

h2 {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 32px;
  color: #111827;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 필드 간 간격 약간 더 줄임 */
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px; /* 입력 필드와 label 간격 줄이기 */
  display: block;
}

/* 모든 입력/셀렉트 */
input[type="text"],
input[type="email"],
select {
  width: 100%;
  height: 42px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f9fafb;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

/* 유학생 / 어학 레벨 묶음 */
.form-row {
  display: flex;
  gap: 16px;
  margin-top: 4px; /* 유학생/레벨 쌍 위에 살짝 띄우기 */
}

.form-row > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px; /* label과 select 사이 */
}

.form-row label {
  flex: 1;
  margin-bottom: 0; /* 내부 라벨은 위에서 margin 있음 */
}

/* 버튼 영역 */
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

button {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

button[type="submit"] {
  background-color: #3b82f6;
  color: white;
}

button[type="submit"]:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}

button.cancel {
  background-color: #e5e7eb;
  color: #111827;
}
button.cancel:hover {
  background-color: #d1d5db;
}

.error-message {
  margin-top: 20px;
  text-align: center;
  color: #dc2626;
  font-weight: 500;
  font-size: 14px;
}


</style>

