import { createApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";
import router from "./router"; // ✅ 라우터 추가

const pinia = createPinia(); // ✅ Pinia 인스턴스 생성

const app = createApp(App);
app.use(pinia); // ✅ Pinia 사용 등록
app.use(router); // ✅ 라우터 활성화
app.mount("#app");
