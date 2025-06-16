<template>
    <header class="nav-bar">
      <div class="nav-content">
        <div class="logo">GSC Portal</div>
  
        <nav class="nav-menu">
          <RouterLink to="/main" class="nav-link">메인</RouterLink>
          <RouterLink to="/notices" class="nav-link">공지</RouterLink>
          <RouterLink to="/schedule" class="nav-link">일정</RouterLink>
          <RouterLink to="/timetable" class="nav-link">시간표</RouterLink>
          <RouterLink v-if="isAdmin" to="/admin" class="nav-link">관리자</RouterLink>
        </nav>
  
        <div class="user-actions">
          <button @click="isModalOpen = true" class="line-connect-btn">
            <i class="line-icon"></i>
            LINE 연동
          </button>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </div>
      </div>
  
      <!-- LINE 연동 모달 -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
        <div class="modal-wrapper">
          <h2>LINE 연동</h2>
          <p>아래 QR코드를 스캔하여 친구 추가 후, 인증번호를 받으실 수 있습니다.</p>
  
          <img
            src="https://qr-official.line.me/gs/M_667khdmy_GW.png?oat_content=qr"
            alt="LINE QR코드"
            class="qr-img"
          />
  
          <div v-if="!authCode" class="modal-actions">
            <button class="generate-btn" @click="generateCode">인증번호 발급받기</button>
          </div>
  
          <div v-if="authCode" class="auth-code-box">
            <div class="auth-code-label">인증번호</div>
            <code>{{ authCode }}</code>
            <button @click="copyToClipboard">복사하기</button>
          </div>
        </div>
      </div>
    </header>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/useAuthStore'
  import { computed, ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import axios from 'axios'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const isAdmin = computed(() => authStore.isAdmin)
  
  // LINE 연동 관련 상태
  const isModalOpen = ref(false)
  const authCode = ref("")
  
  function logout() {
    authStore.logout()
    router.push('/login')
  }
  
  const generateCode = async () => {
  const token = localStorage.getItem("token")  // ✅ 여기 수정!
  try {
    const { data } = await axios.get("http://localhost:5000/api/user/generate-line-code", {
      headers: { Authorization: `Bearer ${token}` }
    });
    authCode.value = data.code
  } catch (err) {
    console.error("❌ 인증번호 생성 실패:", err)
  }
}


  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(authCode.value)
      alert("인증번호가 복사되었습니다.")
    } catch (err) {
      alert("복사 실패!")
    }
  }
  </script>
  
  <style scoped>
  .nav-bar {
    position: fixed;
    top: 0;
    width: 100%;
    height: 70px;
    background-color: #f4faff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    z-index: 999;
    display: flex;
    justify-content: center;
  }
  
  .nav-content {
    width: 100%;
    max-width: 1200px;
    padding: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    font-size: 22px;
    font-weight: 700;
    color: #1e3a8a;
  }
  
  .nav-menu {
    display: flex;
    gap: 30px;
  }
  
  .nav-link {
    font-size: 15px;
    color: #333;
    font-weight: 500;
    text-decoration: none;
    position: relative;
  }
  
  .nav-link.router-link-active {
    color: #1d4ed8;
    font-weight: bold;
  }
  
  .user-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .line-connect-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #1d4ed8;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .line-connect-btn:hover {
    background-color: #1e40af;
  }
  
  .line-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.282.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.282.63.63 0 .348-.281.63-.63.63h-2.386c-.348 0-.63-.282-.63-.63V8.108c0-.348.282-.63.63-.63h2.386c.349 0 .63.282.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zM14.856 11.348h1.755c.349 0 .63.282.63.63 0 .349-.281.63-.63.63h-2.386c-.348 0-.63-.282-.63-.63V8.108c0-.348.282-.63.63-.63h2.386c.349 0 .63.282.63.63 0 .349-.281.63-.63.63h-1.755v1.125h1.755c.349 0 .63.282.63.63 0 .348-.281.63-.63.63h-1.755v1.125zM12.15 8.108v3.5c0 .348-.282.63-.63.63-.349 0-.63-.282-.63-.63v-3.5c0-.348.281-.63.63-.63.348 0 .63.282.63.63zM8.934 11.348h1.755c.349 0 .63.282.63.63 0 .349-.281.63-.63.63H8.304c-.348 0-.63-.282-.63-.63V8.108c0-.348.282-.63.63-.63h2.386c.349 0 .63.282.63.63 0 .349-.281.63-.63.63H8.934v1.125h1.755c.349 0 .63.282.63.63 0 .348-.281.63-.63.63H8.934v1.125zM5.718 8.108v3.5c0 .348-.282.63-.63.63-.349 0-.63-.282-.63-.63v-3.5c0-.348.281-.63.63-.63.348 0 .63.282.63.63zM2.5 8.108v3.5c0 .348-.281.63-.63.63-.348 0-.63-.282-.63-.63v-3.5c0-.348.282-.63.63-.63.349 0 .63.282.63.63z"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
  }
  
  .logout-btn {
    background: none;
    border: none;
    color: #1d4ed8;
    font-size: 14px;
    cursor: pointer;
  }
  
  .logout-btn:hover {
    text-decoration: underline;
  }
  
  /* 모달 스타일 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .modal-wrapper {
    background-color: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 90%;
    width: 400px;
    text-align: center;
  }
  
  .modal-wrapper h2 {
    color: #1e3a8a;
    margin-bottom: 16px;
    font-size: 20px;
    font-weight: 600;
  }
  
  .modal-wrapper p {
    color: #4b5563;
    margin-bottom: 24px;
    line-height: 1.6;
  }
  
  .qr-img {
    width: 200px;
    height: 200px;
    margin: 0 auto 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .modal-actions {
    margin-top: 24px;
  }
  
  .generate-btn {
    background-color: #1d4ed8;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .generate-btn:hover {
    background-color: #1e40af;
  }
  
  .auth-code-box {
    background-color: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .auth-code-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
  
  .auth-code-box code {
    font-family: monospace;
    font-size: 24px;
    color: #1e3a8a;
    font-weight: 600;
    letter-spacing: 2px;
  }
  
  .auth-code-box button {
    background-color: #1d4ed8;
    color: white;
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
    margin-top: 8px;
  }
  
  .auth-code-box button:hover {
    background-color: #1e40af;
  }
  </style>
  