function generateLectureMessage({ type = 'special', subject, professor, day, period, level, class_group, link }) {
    if (type === 'special') {
      return `📚 특강 수업 안내
  
  과목명: ${subject}
  담당교수: ${professor}
  대상: ${level} - ${class_group}
  시간: ${day}요일 ${period}교시
  
  👉 자세히 보기: ${link}`;
    }
  
    if (type === 'cancel') {
      return `📌 휴강 안내
  
  과목명: ${subject}
  담당교수: ${e}
  휴강일: ${day}요일 ${period}교시
  
  ※ 수업이 없습니다. 착오 없으시길 바랍니다.`;
    }
  
    return '📅 시간표 관련 안내입니다.';
  }
  
  module.exports = { generateLectureMessage };
  