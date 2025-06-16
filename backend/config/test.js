// testSend.js
const { sendLineMessage } = require('./lineService'); // 경로 맞게 수정

const testUserId = 'U2db080965623b1fa609cd86a6d18cc37'; // 🔥 방금 받은 userId
const testMessage = 
`📢 [공지사항 알림]
제목: 오늘 수업 휴강
작성자: ㅁㅁㅁ 교수님

📅 휴강 일시: 2025년 4월 22일(화), 3~4교시
📍 과목명: 프로그래밍

사유: 학회 참석으로 인해 부득이하게 휴강합니다.

📌 자세한 내용은 아래 링크를 확인해주세요:
👉 http://localhost:5173/main
`;



sendLineMessage(testUserId, testMessage);
