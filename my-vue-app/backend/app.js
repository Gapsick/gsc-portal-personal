const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// ✅ 추가적인 JSON 처리 (bodyParser와 중복되면 이건 생략 가능)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ webhook 등록은 json 미들웨어 바로 다음
const webhookRoutes = require('./config/webhook');
app.use('/webhook', webhookRoutes);

// --- 나머지 코드는 기존대로 ---
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const timetableRoutes = require("./routes/timetable");
const holidayRoutes = require("./routes/holidays");
const publicHolidays = require("./routes/publicHolidays")
const fileRoutes = require("./routes/fileRoutes")
const googleCalendarRoutes = require("./routes/googleCalendarRoutes")



// ✅ CORS 설정
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// ✅ 정적 파일
app.use("/uploads", express.static("uploads"));

// ✅ API 라우터
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api", timetableRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api", publicHolidays)
app.use("/files", fileRoutes);
app.use("/api/google-calendar", googleCalendarRoutes)

// ✅ 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: 포트 ${PORT}`);
});
