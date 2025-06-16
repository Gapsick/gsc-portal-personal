const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendLineMessage } = require('./lineService');

router.post('/', async (req, res) => {
  console.log("📡 [LINE] Webhook 호출됨");  // ✅ 이거 꼭!
  const events = req.body.events;

  for (const event of events) {
    const userId = event.source.userId;
    const message = event.message?.text?.trim();

    console.log('📨 받은 메시지:', message);

    // ✅ 친구 추가 이벤트
    if (event.type === 'follow') {
      await sendLineMessage(
        userId,
        `👋 안녕하세요! 알리미에 오신 걸 환영합니다.\n\n6자리 인증번호를 입력하시면 연동이 완료됩니다.\n\n예시: 492384`
      );
      continue;
    }

    // ✅ 텍스트 메시지가 아닌 경우 무시
    if (!message) continue;

    // ✅ 인증번호 형식 확인 (6자리 숫자)
    if (/^\d{6}$/.test(message)) {
      try {
        const [rows] = await db.promise().query(
          'SELECT * FROM users WHERE line_auth_code = ?',
          [message]
        );

        if (rows.length === 0) {
          await sendLineMessage(userId, '❌ 잘못된 인증번호입니다. 다시 입력해주세요.');
        } else {
          const user = rows[0];

          // 이미 연동된 경우
          if (user.line_user_id) {
            await sendLineMessage(userId, `🔒 이미 연동이 완료된 계정입니다.`);
          } else {
            // 연동 처리
            await db.promise().query(
              'UPDATE users SET line_user_id = ?, line_auth_code = NULL WHERE id = ?',
              [userId, user.id]
            );
            await sendLineMessage(userId, `🎉 ${user.name}님, LINE 연동이 완료되었습니다!`);
            console.log(`✅ ${user.name} (${user.email}) 연동 완료`);
          }
        }
      } catch (err) {
        console.error("❌ 인증번호 처리 오류:", err);
        await sendLineMessage(userId, '⚠️ 시스템 오류가 발생했습니다. 관리자에게 문의해주세요.');
      }

      continue;
    }

    // ✅ 그 외 메시지: 안내 메시지
    await sendLineMessage(
      userId,
      `❓ 인증번호가 확인되지 않았습니다.\n\n✅ 6자리 인증번호를 입력해주세요.\n예시: 492384`
    );
  }

  res.sendStatus(200);
});

module.exports = router;
