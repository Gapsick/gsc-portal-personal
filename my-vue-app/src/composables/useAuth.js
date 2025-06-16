import { ref } from "vue";

export function useAuth() {
  const userRole = ref(localStorage.getItem("role"));
  const userGrade = ref(Number(localStorage.getItem("grade"))); // ✅ 숫자로 변환
 
  console.log("🛠️ 현재 사용자 학년 (userGrade):", userGrade.value); // ✅ 디버깅용
  
  const isAdmin = ref(userRole.value === "admin" || userRole.value === "professor"); // ✅ 그냥 변수로 사용

  return { userRole, userGrade, isAdmin };
}

