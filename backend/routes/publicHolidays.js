const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/public-holidays', async (req, res) => {
  const { year, month } = req.query;

  try {
    const response = await axios.get('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo', {
      params: {
        ServiceKey: 'nnOXTc6SqauUVgi6BbVLSsf8+vdzbnYa2BoEy4G8q5RWEqmeow4SxfsFjThNQDn118DDIfceOqT53ATayKiqyg==',
        solYear: year,
        solMonth: month,
        _type: 'json'
      }
    });

    const items = response.data?.response?.body?.items?.item;
    let holidays = [];

    if (Array.isArray(items)) {
      holidays = items.map(item => ({
        name: item.dateName,
        date: String(item.locdate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
      }));
    } else if (typeof items === 'object' && items !== null) {
      // 공휴일이 1개인 경우
      holidays.push({
        name: items.dateName,
        date: String(items.locdate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
      });
    } else {
      console.warn('[공휴일 없음]');
    }

    res.json(holidays);
  } catch (err) {
    console.error('[공휴일 API 오류]', err.message);
    if (err.response?.data) {
      console.error('[공휴일 API 응답 본문]', err.response.data);
    }
    res.status(500).json({ error: '공휴일 정보를 불러오지 못했습니다.' });
  }
});

module.exports = router;
