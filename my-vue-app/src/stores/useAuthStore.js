import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    userRole: localStorage.getItem("role") || null,
    userInfo: JSON.parse(localStorage.getItem("user")) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token, // ✅ 로그인 여부 확인
    isAdmin: (state) => state.userRole === "admin" || state.userRole === "professor",
  },
  actions: {
    login(token, userObj) {
      this.token = token;
      this.userRole = userObj.role;
      this.userInfo = userObj;
    
      localStorage.setItem("token", token);
      localStorage.setItem("role", userObj.role);
      localStorage.setItem("user", JSON.stringify(userObj));
    },
    logout() {
      this.token = null;
      this.userRole = null;
      this.userInfo = null;
    
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("googleAccessToken"); // ✅ 추가
      localStorage.removeItem("refreshToken");      // ✅ 추가
    },
    checkAuth() {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
    
      if (token && userStr) {
        this.token = token;
        this.userInfo = JSON.parse(userStr);
        this.userRole = this.userInfo?.role || "student";
      } else {
        this.logout();
      }
    },
  },
});
