const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/timetable/:academic_year/date/:date", async (req, res) => {
  const { academic_year, date } = req.params;

  try {
    const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" });

    let query = "";
    let values = [date, date, dayOfWeek];  // 먼저 공통적으로 들어가는 3개

    if (academic_year === "KOR") {
      query = `
        SELECT t.id, t.day, t.start_period, t.end_period, t.professor, t.classroom,
              DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(t.end_date, '%Y-%m-%d') AS end_date,
              s.name AS subject_name, s.category, s.level,
              s.academic_year,
              s.class_group AS subject_class_group,
              t.class_group AS class_group,
              t.subject_id,
              EXISTS (
                SELECT 1 FROM holidays h
                WHERE h.subject_id = t.subject_id
                  AND DATE(h.holiday_date) = DATE(?)
                  AND LOWER(h.day) = LOWER(t.day)
                  AND h.lecture_period = t.start_period
              ) AS is_absent
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE ? BETWEEN t.start_date AND t.end_date
          AND t.day = ?
          AND s.category = '한국어'
          AND s.academic_year IS NULL
        ORDER BY t.start_period;
      `;
    } else {
      query = `
        SELECT t.id, t.day, t.start_period, t.end_period, t.professor, t.classroom,
              DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(t.end_date, '%Y-%m-%d') AS end_date,
              s.name AS subject_name, s.category, s.level,
              s.academic_year,
              s.class_group AS subject_class_group,
              t.class_group AS class_group,
              t.subject_id,
              EXISTS (
                SELECT 1 FROM holidays h
                WHERE h.subject_id = t.subject_id
                  AND DATE(h.holiday_date) = DATE(?)
                  AND LOWER(h.day) = LOWER(t.day)
                  AND h.lecture_period = t.start_period
              ) AS is_absent
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE ? BETWEEN t.start_date AND t.end_date
          AND t.day = ?
          AND (
            (s.category = '정규' AND s.academic_year = ?)
            OR s.category = '특강'
          )
        ORDER BY t.start_period;
      `;
      values.push(academic_year);  // academic_year는 정규 수업 쿼리만 필요
    }

    const [results] = await db.promise().query(query, values);
    res.json(results);
  } catch (err) {
    console.error("❌ 날짜별 시간표 조회 오류:", err);
    res.status(500).json({ error: "시간표 조회 중 오류 발생" });
  }
});



// ✅ 주간 시간표 조회 (학년 기준)
router.get("/timetable", async (req, res) => {
  try {
    const { academic_year, is_korean } = req.query; // 'is_korean' 파라미터로 한국어 여부 판단

    // if (!academic_year && !is_korean) {
    //   return res.status(400).json({ error: "학년 또는 한국어 여부 필요" });
    // }

    // 특강(0), 정규(1/2/3), 한국어(NULL) 각각 조건 분기
    let condition = "";
    if (academic_year === "0") {
      // 특강
      condition = "s.academic_year = 0";
    } else if (academic_year === "1" || academic_year === "2" || academic_year === "3") {
      // 정규
      condition = `s.academic_year = ${db.escape(academic_year)}`;
    } else if (academic_year === "KOR") {
      // 한국어 (subjects.academic_year IS NULL)
      condition = "s.academic_year IS NULL";
    } else {
      // 기본: 아무것도 전달 안 되면 전체 or 에러
      // return res.status(400).json({ error: "학년 정보가 없습니다." });
      condition = "1=1"; // 전체
    }

    const sql = `
    SELECT 
      t.id, t.day, t.start_period, t.end_period, t.professor, t.classroom,
      DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(t.end_date, '%Y-%m-%d') AS end_date,
      s.name AS subject_name, t.subject_id, t.class_group,
      s.academic_year, s.category, s.level, s.class_group AS subject_class_group
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE ${condition}
      ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday'), t.start_period
    `;
  
    const [rows] = await db.promise().query(sql);
    res.json(rows); // 배열 그대로 응답
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});


// ✅ 학생 개별 시간표 조회
router.get("/timetable/user/:id/date/:date", async (req, res) => {
  const { id, date } = req.params;

  if (!date) return res.status(400).json({ error: '날짜가 필요합니다.' });

  try {
    const [userResult] = await db.promise().query(
      "SELECT grade, special_lecture, class_group, is_foreign FROM users WHERE id = ?",
      [id]
    );
    const user = userResult[0];
    if (!user) return res.status(404).json({ error: "사용자 정보를 찾을 수 없습니다." });

    const { grade, special_lecture, class_group, is_foreign } = user;

    const query = `
    SELECT t.id, t.day, t.start_period, t.end_period, t.professor, t.classroom,
          DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(t.end_date, '%Y-%m-%d') AS end_date,
          s.name AS subject_name, s.category, s.level,
          s.academic_year,
          s.class_group AS subject_class_group,
          t.class_group AS class_group,
          t.subject_id,
          EXISTS (
            SELECT 1 FROM holidays h
            WHERE h.subject_id = t.subject_id
              AND DATE(h.holiday_date) = DATE(?)
              AND LOWER(h.day) = LOWER(t.day)
              AND h.lecture_period = t.start_period
          ) AS is_absent
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE 
        (
          (s.category = '정규' AND s.academic_year = ?) OR
          (s.category = '특강' AND s.level = ? AND (t.class_group = ? OR t.class_group = '전체')) OR
          (s.category = '한국어' AND ? = 1)
        )
      ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday'), t.start_period
    `;

    const [rows] = await db.promise().query(query, [
      date,               // for holiday check
      grade,              // 정규 수업 필터
      special_lecture,    // 특강 level
      class_group,        // 특강 반
      is_foreign          // 유학생 여부 (한국어 수업 조건)
    ])

    res.json(rows);
  } catch (err) {
    console.error("❌ 학생 맞춤 시간표 오류:", err);
    res.status(500).json({ error: "학생 시간표 불러오기 중 오류 발생" });
  }
});


const { sendTimetableAlert } = require("../utils/lineMessageUtil")
// ✅ 시간표 추가
router.post("/timetable", async (req, res) => {
  try {
    const {
      subject_id, professor, classroom, day,
      start_period, end_period, start_date, end_date,
      class_group, category,
      level, period // 🔥 누락되었던 항목 추가
    } = req.body;

    if (!subject_id || !professor || !classroom || !day || !start_period || !end_period || !start_date || !end_date) {
      return res.status(400).json({ error: "필수 입력값이 누락되었습니다." });
    }

    // 🔥 academic_year 제거한 INSERT 쿼리
    const insertQuery = `
      INSERT INTO timetable (
        subject_id, day, professor, classroom,
        start_period, end_period, start_date, end_date,
        class_group, category, level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.promise().query(insertQuery, [
      subject_id, day, professor, classroom,
      start_period, end_period, start_date, end_date,
      class_group?.trim() ? class_group : null,
      category || '정규',
      level || null
    ]);

    res.status(201).json({ message: "시간표 추가 완료" });

    // ✅ LINE 알림 전송 로직 시작
    try {
      // 1. 과목 정보 조회 (레벨/class_group 등 확인)
      const [subjectRow] = await db.promise().query(
        "SELECT name, level, class_group FROM subjects WHERE id = ?",
        [subject_id]
      );
      if (subjectRow.length === 0) return;

      const subjectName = subjectRow[0].name;
      const subjectLevel = level || subjectRow[0].level;
      const subjectClassGroup = class_group || subjectRow[0].class_group;

      // 2. LINE 대상자 조회
      let userQuery = 'SELECT line_user_id FROM users WHERE line_user_id IS NOT NULL AND special_lecture = ?';
      let userParams = [subjectLevel];

      if (subjectClassGroup && subjectClassGroup !== '전체') {
        userQuery += ' AND (class_group = ? OR class_group = "전체")';
        userParams.push(subjectClassGroup);
      }

      const [users] = await db.promise().query(userQuery, userParams);
      const userIds = users.map(u => u.line_user_id);
      console.log("🎯 LINE 전송 대상자:", userIds);

      // 3. 메시지 전송
      if (userIds.length > 0) {
        console.log("📦 LINE 전송 시작");

        await sendTimetableAlert(userIds, {
          type: 'special',
          subject: subjectName,
          professor,
          day,
          period: `${start_period}~${end_period}`,
          level: subjectLevel,
          class_group: subjectClassGroup,
          link: "http://localhost:5173/timetable"
        });
      }

      console.log("✅ LINE 메시지 전송 완료!");
    } catch (err) {
      console.error("❌ LINE 전송 오류:", err);
    }

  } catch (error) {
    console.error("❌ 시간표 추가 오류:", error);
    res.status(500).json({ error: "서버 내부 오류 발생" });
  }
});


// ✅ 시간표 수정
router.put("/timetable/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject_id, professor, classroom,
      start_period, end_period, start_date, end_date, day, class_group, category
    } = req.body;

    if (!subject_id || !professor || !classroom || !start_period || !end_period || !start_date || !end_date || !day) {
      return res.status(400).json({ error: "필수 입력값이 누락되었습니다." });
    }

    const updateQuery = `
      UPDATE timetable
      SET subject_id = ?, professor = ?, classroom = ?,
          start_period = ?, end_period = ?, start_date = ?, end_date = ?, day = ?, class_group = ?, category = ?
      WHERE id = ?
    `;
    await db.promise().query(updateQuery, [
      subject_id, professor, classroom,
      start_period, end_period, start_date, end_date, day,
      class_group?.trim() ? class_group : null, category || '정규',
      id
    ]);
    

    res.json({ message: "시간표 수정 완료" });
  } catch (error) {
    console.error("❌ 시간표 수정 오류:", error);
    res.status(500).json({ error: "시간표 수정 중 오류 발생" });
  }
});

// ✅ 시간표 삭제
router.delete("/timetable/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM timetable WHERE id = ?";
    const [result] = await db.promise().query(checkQuery, [id]);

    if (result.length === 0) {
      return res.status(404).json({ error: "해당 시간표가 존재하지 않습니다." });
    }

    const deleteQuery = "DELETE FROM timetable WHERE id = ?";
    await db.promise().query(deleteQuery, [id]);

    res.json({ message: "시간표 삭제 완료" });
  } catch (error) {
    console.error("❌ 시간표 삭제 오류:", error);
    res.status(500).json({ error: "시간표 삭제 중 오류 발생" });
  }
});

module.exports = router;