import { ref, computed } from "vue";
import { useAuth } from "@/composables/useAuth";

export function useNoticeFilters(notices) {
  const { userRole } = useAuth();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userGrade = parseInt(user.grade);
  const userSpecialLecture = user.specialLecture || "";

  const searchQuery = ref("");
  const selectedYear = ref("전체");
  const selectedSubject = ref("전체");

  const filterNotices = computed(() => {
    if (!notices.value) return [];

    let filtered = notices.value;

    if (userRole.value === "student") {
      if (selectedYear.value === "전체") {
        filtered = filtered.filter((n) => {
          const subject = n.subject || null;
          const academicYear = String(n.academic_year);
          const isSpecial = subject?.category === "특강";
          const isKorean = subject?.category === "한국어";
    
          const isCommon = !n.academic_year || academicYear === "전체";
    
          const isMyGrade = academicYear === String(userGrade);
          const isMySpecial = isSpecial && subject?.level === userSpecialLecture;
          const isMyKorean = isKorean && user.is_foreign === 1 && subject?.level === userSpecialLecture;
    
          return isCommon || isMyGrade || isMySpecial || isMyKorean;
        });
      }
      else if (selectedYear.value === "특강") {
        // 🔥 학생 + 특강 선택 시: 내 level, 내 반 or 전체 반 포함된 특강만
        filtered = filtered.filter((n) => {
          const subject = n.subject || {};
          const isSpecial = subject.category === "특강";
          const isMyLevel = subject.level === userSpecialLecture;
          const isMyClass = !subject.class_group || subject.class_group === user.class_group || subject.class_group === '전체';
          return isSpecial && isMyLevel && isMyClass;
        });
      }
      else {
        // 🔥 학생 + 특정 학년 선택 시: 해당 학년 정규 공지 + 내 특강 포함
        filtered = filtered.filter((n) => {
          const subject = n.subject || {};
          const academicYear = parseInt(n.academic_year);
          const isSpecial = subject.category === "특강";
          const isMySpecial = isSpecial && subject.level === userSpecialLecture &&
            (!subject.class_group || subject.class_group === user.class_group || subject.class_group === '전체');
          return academicYear === parseInt(selectedYear.value) || isMySpecial;
        });
      }      
    }
    else {
      // 교수/관리자 필터링
      if (selectedYear.value === "전체") {
        // 전체 학년이면 필터 없이 모두 출력
        filtered = filtered;
      }
      else if (selectedYear.value === "특강") {
        filtered = filtered.filter((n) => n.subject?.category === "특강");
      }
      else if (selectedYear.value === "한국어") {
        filtered = filtered.filter((n) => n.subject?.category === "한국어");
      }
      else {
        // 정규 과목 학년 선택
        const selected = parseInt(selectedYear.value);
        filtered = filtered.filter((n) => {
          const academicYear = parseInt(n.academic_year);
          return academicYear === selected;
        });
      }
    }

    // 과목 필터
    if (String(selectedSubject.value) !== "전체") {
      if (String(selectedSubject.value).includes("전체")) {
        const yearFromFilter = selectedYear.value;
        filtered = filtered.filter((n) => {
          const year = String(n.academic_year);
          const subject = n.subject || null;
          const isGeneral = !n.subject_id || n.subject_id === "" || n.subject_id === null;
          const isCommon = subject?.name === "공통";
      
          return (
            year === yearFromFilter &&
            (isGeneral || isCommon)
          );
        });
      }
      else {
        // 일반 과목 ID
        filtered = filtered.filter((n) => n.subject_id == selectedSubject.value);
      }
    }
    // 만약 selectedSubject.value === "전체" 이면 필터 적용 안 함

    
    // 검색 필터
    if (searchQuery.value.trim() !== "") {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    // 고정 공지 정렬
    filtered.sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

    return filtered;
  });

  return {
    searchQuery,
    selectedYear,
    selectedSubject,
    filterNotices,
  };
}
