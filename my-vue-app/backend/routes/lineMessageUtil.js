const { sendLineMessage } = require('../config/lineService'); // 기존 send 함수 가져오기

// ✅ 공통 메시지 전송 함수
async function sendLineAlert(userIds, title, content, author, link = null) {
  const message =
`📢 [알림]
제목: ${title}
작성자: ${author}

${content}
${link ? `👉 ${link}` : ''}`;

  for (const userId of userIds) {
    await sendLineMessage(userId, message);
  }
}

module.exports = { sendLineAlert };
