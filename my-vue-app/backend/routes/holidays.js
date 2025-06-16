const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 휴강 조회
router.get('/', (req, res) => {
  const query = 'SELECT * FROM holidays';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


// ✅ 휴강 추가
const { sendTimetableAlert } = require('../utils/lineMessageUtil');
router.post('/', async (req, res) => {
  const { holiday_date, subject_id, day, lecture_period, period } = req.body;

  console.log("📥 받은 holiday_date:", holiday_date);

  if (!holiday_date || !subject_id || !day || !lecture_period || period === undefined || period === null) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }

  try {
    // 1. DB에 휴강 정보 저장
    const insertQuery = `
      INSERT INTO holidays (holiday_date, subject_id, day, lecture_period, period)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [holiday_date, subject_id, day, lecture_period, period]);

    // 2. 과목 정보 조회
    const [[subjectInfo]] = await db.promise().query(
      `SELECT name, level, class_group, academic_year FROM subjects WHERE id = ?`,
      [subject_id]
    );
    
    if (!subjectInfo) return res.status(404).json({ error: '과목 정보를 찾을 수 없습니다.' });

    const subjectName = subjectInfo.name;
    const level = subjectInfo.level;
    const class_group = subjectInfo.class_group;
    const academic_year = subjectInfo.academic_year;

    // ✅ 담당 교수 조회 (timetable 기준)
    const [[profRow]] = await db.promise().query(
      `SELECT professor FROM timetable 
       WHERE subject_id = ? AND day = ? AND start_period = ? 
       LIMIT 1`,
      [subject_id, day, lecture_period]
    );
    const professor = profRow?.professor || '미지정';

    // 3. 대상자 필터링
    let userQuery = 'SELECT line_user_id FROM users WHERE line_user_id IS NOT NULL';
    let userParams = [];
    
    if (academic_year === 0) {
      // 특강
      userQuery += ' AND special_lecture = ?';
      userParams.push(level);
      if (class_group && class_group !== '전체') {
        userQuery += ' AND (class_group = ? OR class_group = "전체")';
        userParams.push(class_group);
      }
    } else if (academic_year !== null) {
      // 정규 과목 (1~3학년)
      userQuery += ' AND grade = ?';
      userParams.push(academic_year);
    }

    const [users] = await db.promise().query(userQuery, userParams);
    const userIds = users.map(u => u.line_user_id);
    console.log("🎯 휴강 LINE 대상자:", userIds);

    // 4. LINE 메시지 전송
    if (userIds.length > 0) {
      await sendTimetableAlert(userIds, {
        type: 'cancel',
        subject: subjectName,
        professor, // 필요하면 timetable 테이블에서 가져올 수도 있음
        day,
        period: `${lecture_period}`,
        level,
        class_group,
        link: "http://localhost:5173/timetable"
      });
    }

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ 휴강 등록 오류:", err);
    res.status(500).json({ error: '휴강 등록 중 오류 발생' });
  }
});

  
// ✅ 바디로 삭제하는 DELETE 추가
router.delete('/', (req, res) => {
  const { holiday_date, subject_id, day, lecture_period, period } = req.body;

  if (!holiday_date || !subject_id || !day || !lecture_period) {
    return res.status(400).json({ error: '필수 필드를 입력해주세요.' });
  }

  let query = `
    DELETE FROM holidays
    WHERE holiday_date = ? AND subject_id = ? AND day = ? AND lecture_period = ?
  `;
  const params = [holiday_date, subject_id, day, lecture_period];

  // 🟡 period가 null이라고 넘어오더라도 실제 저장된 값과 매칭되도록 수정!
  if (period === null || period === undefined) {
    query += ` AND (period IS NULL OR period = '')`; // 혹시 몰라 빈 문자열도 포함
  } else {
    query += ` AND period = ?`;
    params.push(period);
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, deleted: result.affectedRows });
  });
});


// ✅ 휴강 삭제
router.delete('/:id', (req, res) => {
  const query = `DELETE FROM holidays WHERE id = ?`;
  db.query(query, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

module.exports = router;
