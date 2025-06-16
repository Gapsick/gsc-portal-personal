<template>
  <div id="main-page" class="main-wrapper">
    <!-- 공지사항 -->
    <div class="section-box notice-container">
      <div class="schedule-list">
        <h2>공지사항</h2>
        <ul>
          <li
            v-for="notice in notices"
            :key="notice.id"
            :class="{ active: selectedNotice && selectedNotice.id === notice.id }"
            @click="selectNotice(notice)"
          >
            <div class="notice-title">
              {{ notice.title }}
              <div class="badge-container">
                <span v-if="notice.category" class="notice-badge category-badge">
                  {{ notice.category }}
                </span>
                <span v-if="notice.academic_year && !notice.academic_year.toString().includes('학년')" class="notice-badge">
                  {{ notice.academic_year === '전체' ? '전체' : `${notice.academic_year}학년` }}
                </span>
              </div>
            </div>
            <div class="notice-meta">
              <span class="notice-date">{{ formatNoticeDate(notice.date) }}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="schedule-detail notice-detail" v-if="selectedNotice" :key="selectedNotice.id">
        <div class="notice-header">
          <h3>{{ selectedNotice.title }}</h3>
          <div class="notice-meta">
            <span class="notice-date">{{ formatNoticeDate(selectedNotice.date) }}</span>
          </div>
        </div>
        <div class="notice-content">{{ selectedNotice.content }}</div>
      </div>
      <div class="schedule-detail" v-else>
        <div class="no-classes">
          공지사항을 선택해주세요.
        </div>
      </div>
    </div>

    <!-- 일정 -->
    <div class="section-box schedule-container">
      <div class="schedule-list">
        <h2>오늘의 일정</h2>
        <ul>
          <li v-if="todayEvents.length === 0">오늘은 일정이 없습니다.</li>
          <li
            v-for="(event, index) in todayEvents"
            :key="event.id"
            :class="{ active: selectedEventIndex === index }"
            @click="selectEvent(index)"
          >
            {{ event.title }}
          </li>
        </ul>
      </div>
      <transition name="slide-fade" mode="out-in">
        <div class="schedule-detail" v-if="todayEvents[selectedEventIndex]" :key="todayEvents[selectedEventIndex]?.id">
          <h3>{{ todayEvents[selectedEventIndex].title }}</h3>
          <p><strong>시간:</strong> {{ todayEvents[selectedEventIndex].time }}</p>
          <p><strong>설명:</strong> {{ todayEvents[selectedEventIndex].description }}</p>
        </div>
      </transition>
    </div>

    <!-- 시간표 -->
    <div class="section-box timetable-container">
      <!-- 왼쪽: 달력 -->
      <div class="schedule-list">
        <h2>날짜 선택</h2>
        <Calendar
          v-model="selectedDate"
          :attributes="calendarAttributes"
          :masks="masks"
          color="blue"
          :min-date="new Date(2024, 0, 1)"
          :max-date="new Date(2025, 11, 31)"
          class="custom-calendar"
          locale="ko-KR"
          @dayclick="onDateSelect"
        />
      </div>

      <!-- 오른쪽: 시간표 -->
      <div class="timetable-display">
        <h3>{{ formattedDate }} 수업</h3>
        <template v-if="isAdminOrProfessor">
          <!-- 학년별 수업 -->
          <template v-for="grade in [1, 2, 3]" :key="grade">
            <div v-if="getGradeClasses(grade).length > 0" class="grade-section">
              <h4 class="grade-title">{{ grade }}학년</h4>
              <ul class="class-list">
                <li
                  v-for="(item, index) in getGradeClasses(grade)"
                  :key="index"
                  class="class-card"
                >
                  <div class="class-info">
                    <div class="class-period">{{ item.period }}</div>
                    <div class="class-subject">
                      {{ item.subject }}
                      <span v-if="item.classroom" class="classroom-badge">{{ item.classroom }}</span>
                      <span v-if="item.is_absent" class="absent-badge">휴강</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </template>

          <!-- 특강 및 한국어 수업 -->
          <div v-if="getSpecialClasses().length > 0" class="special-section">
            <h4 class="grade-title">특강/한국어</h4>
            <ul class="class-list">
              <li
                v-for="(item, index) in getSpecialClasses()"
                :key="index"
                class="class-card"
              >
                <div class="class-info">
                  <div class="class-period">{{ item.period }}</div>
                  <div class="class-subject">
                    {{ item.subject }}
                    <span v-if="item.classroom" class="classroom-badge">{{ item.classroom }}</span>
                    <span v-if="item.is_absent" class="absent-badge">휴강</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div v-if="!hasAnyClasses" class="no-classes">
            해당 날짜에 수업이 없습니다.
          </div>
        </template>
        <template v-else>
          <!-- 기존 학생용 뷰 -->
          <ul v-if="todayTimetable.length > 0" class="class-list">
            <li
              v-for="(item, index) in todayTimetable"
              :key="index"
              class="class-card"
            >
              <div class="class-info">
                <div class="class-period">{{ item.period }}</div>
                <div class="class-subject">
                  {{ item.subject }}
                  <span v-if="item.classroom" class="classroom-badge">{{ item.classroom }}</span>
                  <span v-if="item.is_absent" class="absent-badge">휴강</span>
                </div>
              </div>
            </li>
          </ul>
          <div v-else class="no-classes">
            해당 날짜에 수업이 없습니다.
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNoticeStore } from '@/stores/useNoticeStore'
import { getTimetableByGradeAndDate, getTimetableByUserId } from '@/api/timetableApi'
import axios from 'axios'
import { Calendar } from 'v-calendar'
import 'v-calendar/style.css'

// 사용자 정보
const user = JSON.parse(localStorage.getItem('user') || '{}')
const userRole = user.role
const userGrade = parseInt(user.grade)
const isAdminOrProfessor = userRole === 'admin' || userRole === 'professor'

// 공지사항
const noticeStore = useNoticeStore()
const notices = ref([])
const selectedNotice = ref(null)

function selectNotice(notice) {
  selectedNotice.value = notice
}

// 일정 (Google Calendar)
const calendarId = 'c_30f3f7b040f8956812ff3902e0725752aa5b4ab176a7fd02f4d8327f0ee4179d@group.calendar.google.com'
const accessToken = localStorage.getItem('googleAccessToken')
const events = ref([])
const selectedEventIndex = ref(0)
const todayEvents = computed(() => events.value)

function selectEvent(index) {
  selectedEventIndex.value = index
}

async function fetchGoogleCalendarEvents(today) {
  if (!accessToken) return
  const timeMin = `${today}T00:00:00Z`
  const timeMax = `${today}T23:59:59Z`

  try {
    const res = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    events.value = res.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      time: event.start.dateTime || event.start.date,
      description: event.description || '설명 없음'
    }))
  } catch (err) {
    console.error('📅 일정 로딩 실패:', err)
  }
}

// 시간표 관련 상태
const selectedDate = ref('')
const todayTimetable = ref([])

// Calendar setup
const masks = {
  weekdays: 'WWW',
  title: 'YYYY년 MM월',
  input: 'YYYY-MM-DD'
}

const calendarAttributes = computed(() => [
  {
    key: 'today',
    dates: new Date(),
    highlight: {
      color: 'blue',
      fillMode: 'light',
    },
  },
])

// 시간표 관련 상수
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periods = Array.from({ length: 10 }, (_, i) => i + 1)
const periodTimes = {
  1: '09:00 ~ 09:50',
  2: '10:00 ~ 10:50',
  3: '11:00 ~ 11:50',
  4: '12:00 ~ 12:50',
  5: '13:00 ~ 13:50',
  6: '14:00 ~ 14:50',
  7: '15:00 ~ 15:50',
  8: '16:00 ~ 16:50',
  9: '17:00 ~ 17:50',
  10: '18:00 ~ 18:50'
}

// 날짜 표시용 computed
const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}.${date.getDate()} (${date.toLocaleDateString('ko-KR', { weekday: 'short' })})`
})

// 날짜 형식 변환 함수
function formatDate(date) {
  if (!date) return ''
  
  let d
  if (date instanceof Date) {
    d = date
  } else if (typeof date === 'string') {
    d = new Date(date)
  } else {
    console.error('Invalid date format:', date)
    return ''
  }

  if (isNaN(d.getTime())) {
    console.error('Invalid date:', date)
    return ''
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 시간표 데이터 업데이트 함수
async function updateTimetableData(date) {
  try {
    const formattedDate = formatDate(date)
    console.log('Updating timetable for date:', formattedDate)

    if (!formattedDate) {
      throw new Error('날짜 형식이 올바르지 않습니다.')
    }

    // 선택된 날짜의 요일 구하기
    const selectedDay = new Date(formattedDate).toLocaleString('en-US', { weekday: 'long' })
    console.log('Selected day:', selectedDay)

    let classes = []
    
    // 사용자 역할에 따라 시간표 로딩
    if (userRole === 'student') {
      // 학생은 본인의 시간표만 조회
      const response = await getTimetableByUserId(user.id, formattedDate)
      console.log('Student timetable raw response:', response)
      
      // 유효한 수업 데이터만 필터링
      classes = Array.isArray(response) ? response.filter(cls => 
        cls && 
        cls.subject_name && 
        cls.day && 
        cls.start_period && 
        cls.end_period &&
        new Date(cls.start_date) <= new Date(formattedDate) &&
        new Date(cls.end_date) >= new Date(formattedDate)
      ) : []
      
    } else {
      // 관리자/교수는 모든 학년 데이터 조회
      const responses = await Promise.all([
        getTimetableByGradeAndDate(1, formattedDate),
        getTimetableByGradeAndDate(2, formattedDate),
        getTimetableByGradeAndDate(3, formattedDate),
        getTimetableByGradeAndDate('KOR', formattedDate)
      ])

      console.log('API Raw Responses:', responses)
      
      // 각 응답에서 유효한 수업 데이터만 필터링하여 병합
      classes = responses.reduce((acc, response, index) => {
        if (!Array.isArray(response)) return acc
        
        const validClasses = response.filter(cls => 
          cls && 
          cls.subject_name && 
          cls.day && 
          cls.start_period && 
          cls.end_period &&
          new Date(cls.start_date) <= new Date(formattedDate) &&
          new Date(cls.end_date) >= new Date(formattedDate)
        )
        
        // 학년 정보 추가 (KOR은 제외)
        if (index < 3) {
          return [...acc, ...validClasses.map(c => ({ ...c, grade: index + 1 }))]
        }
        return [...acc, ...validClasses]
      }, [])
    }

    console.log('Filtered valid classes:', classes)

    // 해당 요일의 수업만 필터링
    const dayClasses = classes.filter(cls => {
      // 요일이 일치하는지 확인
      const isDayMatch = cls.day === selectedDay
      
      // 시작 시간과 종료 시간이 유효한지 확인
      const hasValidTime = 
        Number.isInteger(parseInt(cls.start_period)) && 
        Number.isInteger(parseInt(cls.end_period)) &&
        parseInt(cls.start_period) > 0 &&
        parseInt(cls.end_period) <= 12 // 최대 12교시까지
      
      return isDayMatch && hasValidTime
    })
    
    console.log('Classes for', selectedDay + ':', dayClasses)

    // 시간표 데이터 매핑 및 정렬
    todayTimetable.value = dayClasses
      .sort((a, b) => Number(a.start_period) - Number(b.start_period))
      .map(cls => ({
        period: cls.start_period === cls.end_period
          ? `${cls.start_period}교시 (${periodTimes[cls.start_period]})`
          : `${cls.start_period}~${cls.end_period}교시 (${periodTimes[cls.start_period]} ~ ${periodTimes[cls.end_period]})`,
        start_period: cls.start_period,
        end_period: cls.end_period,
        subject: `${cls.subject_name}${
          (cls.category === '특강' || cls.category === '한국어') 
            ? ` [${cls.level || ''}${cls.class_group ? `/${cls.class_group}반` : ''}]` 
            : ''
        }${cls.professor ? ` (${cls.professor})` : ''}${
          userRole !== 'student' && cls.grade && cls.category !== '특강' && cls.category !== '한국어'
            ? ` (${cls.grade}학년)` 
            : ''
        }`,
        is_absent: Boolean(cls.is_absent),
        classroom: cls.classroom,
        grade: cls.grade || (cls.academic_year > 0 ? cls.academic_year : null),
        category: cls.category || '일반',
        level: cls.level,
        class_group: cls.class_group
      }))

    console.log('Final timetable data:', todayTimetable.value)

  } catch (error) {
    console.error('시간표 데이터 업데이트 실패:', error)
    console.error('Error details:', error.message)
    todayTimetable.value = []
  }
}

// 캘린더 날짜 선택 핸들러
async function onDateSelect(newDate) {
  try {
    const dateObj = newDate.date || newDate
    console.log('Selected date object:', dateObj)
    
    const formattedDate = formatDate(dateObj)
    console.log('Formatted date for API:', formattedDate)
    
    if (!formattedDate) {
      console.error('Invalid date format')
      return
    }

    selectedDate.value = formattedDate
    await updateTimetableData(formattedDate)
  } catch (error) {
    console.error('날짜 선택 처리 실패:', error)
    todayTimetable.value = []
  }
}

// 학년별 수업 필터링
const getGradeClasses = (targetGrade) => {
  return todayTimetable.value.filter(cls => 
    (cls.grade === targetGrade || cls.academic_year === targetGrade) && 
    cls.category !== '특강' && 
    cls.category !== '한국어'
  )
}

// 특강 및 한국어 수업 필터링
const getSpecialClasses = () => {
  // 특강과 한국어 수업을 필터링
  const specialClasses = todayTimetable.value.filter(cls => 
    cls.category === '특강' || 
    cls.category === '한국어'
  )

  // 중복 제거를 위한 Map 사용 (교시와 과목명으로 구분)
  const uniqueMap = new Map()
  
  specialClasses.forEach(cls => {
    const key = `${cls.start_period}-${cls.end_period}-${cls.subject_name}-${cls.level || ''}-${cls.class_group || ''}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, cls)
    }
  })

  // Map의 값들을 배열로 변환하고 교시 순으로 정렬
  return Array.from(uniqueMap.values())
    .sort((a, b) => Number(a.start_period) - Number(b.start_period))
}

// 수업 존재 여부 확인
const hasAnyClasses = computed(() => {
  return todayTimetable.value.length > 0
})


// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  try {
    // (1) 공지사항 로딩
    await noticeStore.getNotices()
    const fullList = noticeStore.notices || []
    if (userRole === 'student') {
      notices.value = fullList
        .filter(n => !n.academic_year || n.academic_year === '전체' || parseInt(n.academic_year) === userGrade)
        .slice(0, 3)
    } else {
      notices.value = fullList.slice(0, 3)
    }
    selectedNotice.value = notices.value[0]

    // (2) 일정 로딩
    const today = new Date()
    const formattedToday = formatDate(today)
    await fetchGoogleCalendarEvents(formattedToday)
    
    // (3) 시간표 로딩
    selectedDate.value = formattedToday
    await updateTimetableData(today)

  } catch (error) {
    console.error('초기 데이터 로딩 실패:', error)
    console.error('Error details:', error.message)
  }
})

const formatNoticeDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap');

/* (1) 상위 래퍼에 폰트 적용 */
#main-page {
  font-family: 'Noto Sans KR', sans-serif;
}

/* 기본 레이아웃 */
.main-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 16px 40px;
  font-family: 'Noto Sans KR', sans-serif;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 공통 섹션 박스 */
.section-box {
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
}

/* 좌측 리스트 공통 */
.schedule-list {
  width: 300px;
  min-width: 300px;
  border-right: 1px solid #e0e0e0;
  padding: 24px;
  background-color: #f8fafc;
}

.schedule-list h2 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #1e3a8a;
  font-weight: 600;
}

.schedule-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.schedule-list li {
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.schedule-list li:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.schedule-list li.active {
  background-color: #eef4ff;
  border-color: #93c5fd;
}

/* 우측 상세 공통 */
.schedule-detail {
  flex: 1;
  padding: 24px 32px;
  background-color: #fff;
  min-height: 400px;
}

/* 공지사항 스타일 */
.notice-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.notice-date {
  color: #6b7280;
}

.badge-container {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.notice-badge {
  background-color: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.category-badge {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.all-badge {
  background-color: #dbeafe;
  color: #1e40af;
}

/* 공지사항 상세 */
.notice-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notice-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notice-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.notice-content {
  color: #4b5563;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
}

/* 시간표 스타일 */
.timetable-display {
  flex: 1;
  padding: 24px 32px;
}

.timetable-display h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 24px;
}

/* 학년별 섹션 */
.grade-section {
  margin-bottom: 32px;
}

.grade-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
}

/* 수업 카드 스타일 */
.class-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.class-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-period {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.class-subject {
  font-size: 14px;
  color: #1f2937;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.classroom-badge {
  background-color: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.absent-badge {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 달력 커스텀 스타일 */
:deep(.custom-calendar) {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

/* 빈 상태 메시지 */
.no-classes {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 특강/한국어 섹션 */
.special-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid #e5e7eb;
}

.special-section .grade-title {
  color: #047857;
}

.special-section .class-card {
  background-color: #f0fdfa;
}

</style>
