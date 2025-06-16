function getTargetLabel({ academic_year, category, level, class_group }) {
    if (category === '한국어') return `한국어 수업 (${level}레벨)`;
    if (academic_year === 0) {
      return class_group && class_group !== '전체'
        ? `특강 (${level}레벨 ${class_group}반)`
        : `특강 (${level}레벨 전체)`;
    }
    return `${academic_year}학년`;
  }
  
  function generateNoticeMessage({
    type = 'create',
    title,
    content,
    author,
    academic_year,
    category,
    level,
    class_group,
    link
  }) {
    const header = type === 'update'
      ? '📝 [공지사항 수정]'
      : '📢 [공지사항]';
  
    const target = `🎓 대상: ${getTargetLabel({ academic_year, category, level, class_group })}`;
    const writer = `📝 작성자: ${author}`;
  
    const detailLink = link
      ? `\n\n🔗 공지 상세 보기:\n${link}`  // ✅ 본문과 링크 사이 한 줄 띄움
      : '';
  
    return `${header} ${title}
  
  ${target}
  ${writer}
  
  ${content}${detailLink}`;
  }
  
  module.exports = {
    generateNoticeMessage,
    getTargetLabel,
  };
  