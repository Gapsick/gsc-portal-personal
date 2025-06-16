import { ref, watchEffect } from "vue"
import { fetchSubjectsByYear } from "@/api/subjectApi" // ✅ 수정 포인트

export function useSubjects(selectedYear) {
  const subjects = ref([])

  const loadSubjects = async () => {
    try {
      console.log(`📢 useSubjects - ${selectedYear.value} 과목 로딩 중...`)

      const data = await fetchSubjectsByYear(selectedYear.value) // ✅ 여기서 학년 전달
      subjects.value = Array.isArray(data) ? data : []
    } catch (error) {
      console.error("🚨 과목 불러오기 실패:", error)
      subjects.value = []
    }
  }

  watchEffect(() => {
    loadSubjects()
  })

  return { subjects, loadSubjects }
}
