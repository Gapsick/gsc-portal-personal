import { ref } from 'vue'
import { getTimetableByGradeAndDate, getTimetableByUserId } from '../api/timetableApi'

export function useTimetable() {
  const timetable = ref({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  })

  const selectedDate = ref('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdminOrProfessor = user.role === 'admin' || user.role === 'professor'
  const grade = ref(Number(user.grade || 1)) // ✅ localStorage에서 가져온 사용자 학년 반영
  
  // 공휴일 데이터 추가
  const publicHolidays = ref([])

  function getWeekDates(baseDate) {
    const date = new Date(baseDate)
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((day + 6) % 7))
    const week = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      week.push(d.toISOString().split('T')[0])
    }
    return week
  }

  // 공휴일 데이터 가져오기
  const fetchPublicHolidays = async () => {
    const year = new Date(selectedDate.value).getFullYear()
    const month = String(new Date(selectedDate.value).getMonth() + 1).padStart(2, '0')

    try {
      const response = await fetch(`/api/public-holidays?year=${year}&month=${month}`)
      const data = await response.json()
      publicHolidays.value = data // 공휴일 데이터를 저장
    } catch (err) {
      console.error('공휴일 데이터를 불러오는 데 실패했습니다.', err)
    }
  }

  // 날짜가 공휴일인지 확인
  const isHoliday = (date) => {
    return publicHolidays.value.some(holiday => holiday.date === date)
  }

  function getWeekDates(baseDate) {
    const date = new Date(baseDate)
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((day + 6) % 7))
    const week = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      week.push(d.toISOString().split('T')[0])
    }
    return week
  }

  const fetchWeekTimetable = async (date, useGrade, targetRef) => {
    selectedDate.value = date
    await fetchPublicHolidays()  // 공휴일 정보 가져오기
    const dates = getWeekDates(date)

    const schedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    }

    await Promise.all(
      dates.map(async (d) => {
        const dayName = new Date(d).toLocaleString('en-US', { weekday: 'long' })
        
        if (isHoliday(d)) {
          const holidayName = publicHolidays.value.find(h => h.date === d)?.name || '공휴일'
          schedule[dayName] = [{
            id: `holiday-${dayName}`,
            category: '공휴일',
            subject_name: holidayName, // ✅ 이름 표시
            professor: '',
            start_period: 1,
            end_period: 1  // ✅ 1교시에만 표시
          }]
          return
        }
        

        let classes = []

        if (isAdminOrProfessor) {
          const actualGrade = useGrade ?? grade.value
    
          // ✅ 정규+특강 + 한국어 병렬 조회
          const [regularAndSpecial, korean] = await Promise.all([
            getTimetableByGradeAndDate(actualGrade, d),
            getTimetableByGradeAndDate("KOR", d),
          ])
          classes = [...regularAndSpecial, ...korean]
        } else {
          // ✅ 학생은 본인 기준으로 조회
          classes = await getTimetableByUserId(user.id, d)
          classes = classes.filter(c =>
            new Date(d) >= new Date(c.start_date) &&
            new Date(d) <= new Date(c.end_date) &&
            c.day === dayName
          )
        }

        schedule[dayName] = classes.map(c => ({
          ...c,
          is_absent: c.is_absent === 1, // ✅ 명확하게 boolean으로 변환
        }))
      })
    )

    if (targetRef) {
      targetRef.value = schedule
    } else {
      Object.assign(timetable.value, schedule)
    }
  }

  async function createClass(formData) {
    await addTimetable(formData)
    await fetchWeekTimetable(selectedDate.value)
  }

  async function updateClass(id, formData) {
    await updateTimetable(id, formData)
    await fetchWeekTimetable(selectedDate.value)
  }

  async function removeClass(id) {
    await deleteTimetable(id)
    await fetchWeekTimetable(selectedDate.value)
  }
  
  // 날짜 이동 함수
  function goToPreviousWeek() {
    const date = new Date(selectedDate.value)
    date.setDate(date.getDate() - 7)
    const newDate = date.toISOString().split('T')[0]
    fetchWeekTimetable(newDate)
  }
  
  function goToNextWeek() {
    const date = new Date(selectedDate.value)
    date.setDate(date.getDate() + 7)
    const newDate = date.toISOString().split('T')[0]
    fetchWeekTimetable(newDate)
  }
  
  return {
    timetable,
    selectedDate,
    grade,
    fetchWeekTimetable,
    createClass,
    updateClass,
    removeClass,
    goToPreviousWeek,
    goToNextWeek,
    publicHolidays, // ✅ 추가
    isHoliday        // ✅ 추가
  }
}
