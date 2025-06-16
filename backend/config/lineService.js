const axios = require('axios');

const CHANNEL_ACCESS_TOKEN = 'lIV2BPL8n7nB/3LJw3AAISIffj72ZUPdb/F1rVDvIbfavVHw1ngOx6uXGzCPt6PqhsD8NYKKpMXrPKJUfSzkrLVp8w04Y/oyy/LZ34dv0XMn8Rz9Xnjzs0dMalk4pETv7e21wIRfv3CTo55JukuiGQdB04t89/1O/w1cDnyilFU=';

async function sendLineMessage(userId, message) {
  const messages = Array.isArray(message) ? message : [message];

  try {
    const res = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );
    console.log('✅ 메시지 전송 성공:', res.status);
  } catch (err) {
    console.error('❌ 메시지 전송 실패:', err.response?.data || err.message);
  }
}

module.exports = { sendLineMessage };
