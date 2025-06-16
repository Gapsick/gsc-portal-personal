// fileRoutes.js

const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const contentDisposition = require("content-disposition"); // 📦 설치 필요

// ✅ /files/download/:filename
// 📁 다운로드 라우트
router.get("/download/:filename", async (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
  }

  // ✅ DB에서 원래 파일명 조회 (original_name 사용)
  const db = require("../config/db"); // DB 연결 모듈
  try {
    const [rows] = await db.promise().query(
      "SELECT original_name FROM notice_files WHERE file_path LIKE ? LIMIT 1",
      [`%/${filename}`]
    );

    const originalName = rows[0]?.original_name || filename.replace(/^\d+-/, "downloaded_file");

    res.setHeader("Content-Disposition", contentDisposition(originalName));
    res.setHeader("Content-Type", "application/octet-stream");
    res.sendFile(filePath);
  } catch (err) {
    console.error("❌ 파일 다운로드 오류:", err);
    res.status(500).json({ message: "파일 다운로드 중 오류가 발생했습니다." });
  }
});


// ✅ /files/preview/:filename
router.get("/preview/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };

  const mimeType = mimeTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", "inline");
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
