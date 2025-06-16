import { defineStore } from "pinia";
import { fetchNotices } from "@/api/noticeApi";

export const useNoticeStore = defineStore("notice", {
  state: () => ({
    notices: [], // ✅ ref([]) 필요 없음, 그냥 배열로 선언하면 됨!
  }),
  actions: {
    async getNotices() {
      try {
        console.log("📢 공지사항 불러오는 중...");
        const data = await fetchNotices();
        this.notices = data; // ✅ Pinia 상태 업데이트
        console.log("📢 공지사항 불러오기 완료:", this.notices);
      } catch (error) {
        console.error("🚨 공지사항 불러오기 실패:", error);
      }
    },
  },
});
