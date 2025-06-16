const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { sendNoticeAlert } = require("../utils/lineMessageUtil");

// ✅ 공지사항 목록 조회 (과목 정보 포함)
const getNotices = async (req, res) => {
  try {
    const sql = `
      SELECT 
        n.*, 
        s.name AS subject_name, 
        s.category AS subject_category 
      FROM notices n
      LEFT JOIN subjects s ON n.subject_id = s.id
      ORDER BY n.is_pinned DESC, n.created_at DESC
    `;

    const [rows] = await db.promise().query(sql);

    const formatted = rows.map((row) => ({
      ...row,
      subject: {
        id: row.subject_id,
        name: row.subject_name,
        category: row.subject_category,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ 공지사항 조회 실패:", err);
    res.status(500).json({ message: "공지사항을 가져올 수 없습니다." });
  }
};

// ✅ 공지사항 상세 조회 (파일까지 포함)
const getNoticeById = async (req, res) => {
  const noticeId = req.params.id;
  try {
    // 조회수 증가
    await db.promise().query("UPDATE notices SET views = views + 1 WHERE id = ?", [noticeId]);

    // 공지사항 + 과목 조인
    const [notices] = await db.promise().query(`
      SELECT 
        n.*, 
        s.name AS subject_name, 
        s.category AS subject_category
      FROM notices n
      LEFT JOIN subjects s ON n.subject_id = s.id
      WHERE n.id = ?
    `, [noticeId]);

    if (notices.length === 0) {
      return res.status(404).json({ message: "해당 공지사항을 찾을 수 없습니다." });
    }

    const notice = {
      ...notices[0],
      subject: {
        id: notices[0].subject_id,
        name: notices[0].subject_name,
        category: notices[0].subject_category,
      },
    };

    // ✅ 파일 목록 조회 추가
    const [files] = await db.promise().query(
      "SELECT id, file_path, original_name FROM notice_files WHERE notice_id = ?",
      [noticeId]
    );

    notice.files = files; // 프론트에 넘길 파일 리스트

    res.json(notice);
  } catch (err) {
    console.error("❌ 공지사항 상세 조회 실패:", err);
    res.status(500).json({ message: "공지사항을 불러올 수 없습니다." });
  }
};

// 공지사항 작성
const createNotice = async (req, res) => {
  try {
    console.log("📢 (createNotice) 요청된 데이터:", req.body);
    console.log("📂 (createNotice) 업로드된 파일들:", req.files);

    let {
      title,
      content,
      category,
      academic_year,
      subject_id,
      is_pinned,
      author,
      level,
      class_group
    } = req.body;

    const finalCategory = category || "학과";
    const finalAuthor = author || "관리자";

    if (!title || !content) {
      return res.status(400).json({ message: "제목과 내용은 필수 입력값입니다." });
    }

    // 🔹 academic_year 처리
    academic_year =
      academic_year === "null" || academic_year === "" ? null : parseInt(academic_year, 10);
    subject_id =
      subject_id === "null" || subject_id === "" ? null : parseInt(subject_id, 10);

    // ✅ 1단계: notices 테이블에 삽입
    const insertNoticeSql = `
      INSERT INTO notices (title, content, category, academic_year, subject_id, file_path, is_pinned, author)
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
    `;
    const noticeValues = [
      title,
      content,
      finalCategory,
      academic_year,
      subject_id,
      is_pinned === "1" ? 1 : 0,
      finalAuthor,
    ];

    const [result] = await db.promise().query(insertNoticeSql, noticeValues);
    const noticeId = result.insertId;
    console.log("✅ 공지사항 작성 완료 ID:", noticeId);

    // ✅ 2단계: notice_files 테이블에 여러 파일 insert
    const uploadedFiles = req.files || [];

    for (const file of uploadedFiles) {
      const originalName = Buffer.from(file.originalname, "latin1").toString("utf8"); // ✅ 한글 복원
      const cleanPath = `uploads/${file.filename}`.replace(/\\/g, "/");
    
      await db.promise().query(
        `INSERT INTO notice_files (notice_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [result.insertId, cleanPath, originalName]
      );
    }

    // ✅ 3단계: 공지사항 + 과목 정보 함께 조회
    const [notices] = await db.promise().query(`
      SELECT 
        n.*, 
        s.name AS subject_name, 
        s.category AS subject_category
      FROM notices n
      LEFT JOIN subjects s ON n.subject_id = s.id
      WHERE n.id = ?
    `, [noticeId]);

    const formatted = {
      ...notices[0],
      subject: {
        id: notices[0].subject_id,
        name: notices[0].subject_name,
        category: notices[0].subject_category,
      },
    };

    res.status(201).json(formatted);

    // 📌 subject_id로 level/class_group 자동 조회
    level = req.body.level;
    class_group = req.body.class_group;

    if (finalCategory === '과목별' && req.body.subject_id) {
      const [subjectRow] = await db.promise().query(
        "SELECT level, class_group FROM subjects WHERE id = ?",
        [req.body.subject_id]
      );
      if (subjectRow.length > 0) {
        level = subjectRow[0].level;
        class_group = subjectRow[0].class_group;
      }
    }


    // ✅ 4단계: LINE 알림 대상 필터링
    let userQuery = 'SELECT line_user_id FROM users WHERE line_user_id IS NOT NULL';
    let userParams = [];

    if (finalCategory === '한국어') {
      if (level) {
        userQuery += ' AND special_lecture = ?';
        userParams.push(level);
      }
    } else if (academic_year === 0) {
      userQuery += ' AND special_lecture = ?';
      userParams.push(level);
    
      // ✅ '전체'일 경우를 포함해서 필터링
      if (class_group && class_group !== '전체') {
        userQuery += ' AND (class_group = ? OR class_group = "전체")';
        userParams.push(class_group);
      }
    }
     else if (academic_year !== null) {
      userQuery += ' AND grade = ?';
      userParams.push(academic_year);
    }

    const [users] = await db.promise().query(userQuery, userParams);
    const userIds = users.map(user => user.line_user_id);
    const link = `http://localhost:5173/notices/${noticeId}`;

    if (req.body.sendLine === "1" && userIds.length > 0) {
      await sendNoticeAlert(userIds, {
        type: 'create',
        title,
        content,
        author: finalAuthor,
        academic_year,
        category: finalCategory,
        level,
        class_group,
        link,
        file_path: req.files.map(f => `uploads/${f.filename}`),
      });
    }
  } catch (err) {
    console.error("❌ 공지사항 작성 실패:", err);
    res.status(500).json({ message: "공지사항을 작성할 수 없습니다." });
  }
};

// ✅ 공지사항 수정
const updateNotice = async (req, res) => {
  const noticeId = req.params.id;
  try {
    let {
      title,
      content,
      category,
      academic_year,
      subject_id,
      is_pinned,
      level,
      class_group,
      author,
      deletedFileIds = "[]", // JSON 문자열로 들어옴
    } = req.body;

    const finalCategory = category || "학과";
    const finalAuthor = author || "관리자";

    academic_year =
      academic_year === "" || academic_year === "null" ? null : parseInt(academic_year, 10);
    subject_id =
      subject_id === "" || subject_id === "null" ? null : parseInt(subject_id, 10);
    const parsedDeletedFileIds = Array.isArray(deletedFileIds)
      ? deletedFileIds
      : JSON.parse(deletedFileIds);

    // ✅ 1단계: 공지사항 내용 수정
    await db.promise().query(
      `UPDATE notices
       SET title = ?, content = ?, category = ?, academic_year = ?, subject_id = ?, is_pinned = ?, author = ?
       WHERE id = ?`,
      [
        title,
        content,
        finalCategory,
        academic_year,
        subject_id,
        is_pinned === "1" ? 1 : 0,
        finalAuthor,
        noticeId,
      ]
    );

    // ✅ 2단계: 삭제된 파일 제거
    for (const fileId of parsedDeletedFileIds) {
      const [[file]] = await db
        .promise()
        .query("SELECT file_path FROM notice_files WHERE id = ? AND notice_id = ?", [
          fileId,
          noticeId,
        ]);
      if (file) {
        const fullPath = path.join(__dirname, "..", file.file_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        await db.promise().query("DELETE FROM notice_files WHERE id = ?", [fileId]);
      }
    }

    // ✅ 3단계: 새 파일 삽입
    const uploadedFiles = req.files || [];
    for (const file of uploadedFiles) {
      const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
      const filePath = `uploads/${file.filename}`.replace(/\\/g, "/");

      await db.promise().query(
        `INSERT INTO notice_files (notice_id, file_path, original_name)
         VALUES (?, ?, ?)`,
        [noticeId, filePath, originalName]
      );
    }

    res.json({ message: "공지사항이 수정되었습니다!" });
  } catch (err) {
    console.error("❌ 공지사항 수정 실패:", err);
    res.status(500).json({ message: "공지사항을 수정할 수 없습니다." });
  }
};

// ✅ 공지사항 삭제
const deleteNotice = async (req, res) => {
  const noticeId = req.params.id;

  try {
    // 🔹 1단계: 첨부파일 경로들 조회
    const [files] = await db.promise().query(
      "SELECT file_path FROM notice_files WHERE notice_id = ?",
      [noticeId]
    );

    // 🔹 2단계: 첨부파일 실제 파일 시스템에서 삭제
    for (const file of files) {
      const absolutePath = path.join(__dirname, "..", file.file_path);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.error("❌ 파일 삭제 실패:", err);
        }
      }
    }

    // 🔹 3단계: 첨부파일 DB 레코드 삭제
    await db.promise().query("DELETE FROM notice_files WHERE notice_id = ?", [noticeId]);

    // 🔹 4단계: 공지사항 자체 삭제
    const [result] = await db.promise().query("DELETE FROM notices WHERE id = ?", [noticeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "공지사항 삭제 실패: 존재하지 않는 ID" });
    }

    res.json({ message: "공지사항이 삭제되었습니다!" });

  } catch (err) {
    console.error("❌ 공지사항 삭제 실패:", err);
    res.status(500).json({ message: "공지사항을 삭제할 수 없습니다." });
  }
};


// ✅ 모듈 내보내기
module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
};
