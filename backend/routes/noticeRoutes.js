const express = require("express");
const router = express.Router();
const {
  createNotice,
  getNoticeById,
  getNotices,
  updateNotice,
  deleteNotice
} = require("../controllers/noticeController");

const multer = require("multer");

// ✅ 파일 저장 경로 및 이름 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();

    // ✅ 기존 깨짐 방지 인코딩 제거하고, 공백 및 특수문자만 정리
    const safeName = file.originalname
      .replace(/\s+/g, "_")                 // 공백 → 언더바
      .replace(/[^\w가-힣.\-()_]/g, "");     // 특수문자 제거 (괄호 등 일부는 유지)

    cb(null, `${timestamp}-${safeName}`);
  },
});


const upload = multer({ storage });

// 기존: upload.single("file")
router.post("/", upload.array("files"), async (req, res, next) => {
  console.log("📂 업로드된 파일들:", req.files);
  next();
}, createNotice);

// 수정 라우터에서 PUT도 동일하게 변경
router.put("/:id", upload.array("files"), updateNotice);

router.get("/", getNotices);
router.get("/:id", getNoticeById);
router.delete("/:id", deleteNotice);

module.exports = router;
