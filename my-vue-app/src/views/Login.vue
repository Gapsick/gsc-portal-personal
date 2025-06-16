<script setup>
import { useRouter } from "vue-router";
import axios from "axios";
import { onMounted } from "vue";
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()


const router = useRouter();

// ✅ 팝업 창에서 메시지를 받을 이벤트 리스너 한 번만 등록
onMounted(() => {
  window.addEventListener("message", handleMessage);
});

// ✅ 메시지 처리 함수 분리
function handleMessage(event) {
  console.log("🔍 메시지 수신: ", event.origin);

  if (event.origin !== "http://localhost:5000") {
    console.warn("🚨 허용되지 않은 출처에서 메시지 수신됨!");
    return;
  }

  console.log("✅ 메인 창에서 받은 메시지:", event.data);

  if (event.data.error) {
    alert(event.data.error);
    return;
  }

  if (event.data.token) {
    saveUserData(event.data);
    router.push("/main");
  } else if (event.data.needRegister) {
    localStorage.setItem("register_email", event.data.email);
    router.push("/register");
  }
}

// ✅ 로컬 스토리지 저장 함수 추가
function saveUserData(data) {
  console.log("🧩 saveUserData 전달받은 data:", data);

  const user = {
    id: data.id, // ✅ 추가!
    name: data.name,
    email: data.email,
    role: data.role,
    grade: data.grade || null,
    specialLecture: data.specialLecture || null,
    class_group: data.class_group || null,
    is_foreign: data.is_foreign || 0  // ✅ 이거 추가!
  }

  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem("token", data.token)
  localStorage.setItem("googleAccessToken", data.googleAccessToken || "")
  localStorage.setItem("refreshToken", data.refreshToken || "")

  auth.login(data.token, user)  // ✅ Pinia 상태 반영 추가
}



// ✅ Google 로그인 팝업 열기
async function openGooglePopup() {
  try {
    const response = await axios.get("http://localhost:5000/api/auth/google/url");
    const googleLoginUrl = response.data.authUrl;

    // 🔹 팝업 창 열기
    window.open(googleLoginUrl, "Google Login", "width=500,height=600");
  } catch (error) {
    console.error("🚨 Google 로그인 URL 요청 실패:", error);
    alert("Google 로그인 URL 요청 실패!");
  }
}
</script>

<template>
  <div class="login-container">
    <img src="@/assets/uni_logo.svg" alt="로고" class="logo" />
    <h1 class="title">글시융 포털</h1>
    <p class="subtitle">글로벌시스템포털에 오신 것을 환영합니다.</p>

    <button class="google-button" @click="openGooglePopup">
      Google 로그인
    </button>

    <p class="note">@g.yju.ac.kr 이메일만 사용 가능합니다.</p>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic&display=swap');

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f8ff; /* 연한 파랑 */
  font-family: 'Nanum Gothic', sans-serif;
  text-align: center;
}

.logo {
  width: 90px;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 14px;
  color: #555;
  margin-bottom: 30px;
}

.google-button {
  padding: 10px 20px;
  border: 1px solid #4285f4;
  background-color: white;
  color: #4285f4;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: 0.3s;
}

.google-button:hover {
  background-color: #4285f4;
  color: white;
}

.note {
  font-size: 12px;
  color: #888;
  margin-top: 20px;
}
</style>



