<template>
    <div class="line-connect-container">
      <h2>LINE 연동</h2>
      <p>아래의 인증번호를 복사하여 LINE 메시지로 보내주세요.</p>
  
      <div class="auth-code-box">
        <code>{{ authCode }}</code>
        <button @click="copyToClipboard">복사</button>
      </div>
  
      <p class="note">LINE 친구 추가 후 인증번호를 메시지로 보내면 연동이 완료됩니다.</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  
  const authCode = ref("")
  
  const fetchAuthCode = async () => {
    const token = localStorage.getItem("accessToken")
    try {
      const { data } = await axios.post("http://localhost:5000/api/line/generate-code", {}, {
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
  
  onMounted(() => {
    fetchAuthCode()
  })
  </script>
  
  <style scoped>
  .line-connect-container {
    max-width: 500px;
    margin: 100px auto;
    padding: 30px;
    background: #fff;
    border-radius: 10px;
    text-align: center;
    font-family: 'Noto Sans KR', sans-serif;
  }
  
  .auth-code-box {
    margin: 20px 0;
    font-size: 24px;
    font-weight: bold;
    background: #f3f4f6;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
  }
  
  .auth-code-box button {
    padding: 6px 12px;
    border: none;
    background: #2563eb;
    color: white;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .note {
    margin-top: 20px;
    color: #555;
  }
  </style>
  