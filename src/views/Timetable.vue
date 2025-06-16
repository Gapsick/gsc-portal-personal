<template>
  <div class="container">
    <br>
  
    <!-- 제목 -->
    <h2 class="title">TIMETABLE</h2>
    <p class="title-kr">전체 시간표 (관리자용)</p>

    <!-- 상단 제어 영역 -->
    <div class="header-area">

      <!-- 🔹 1번째 줄: 학년 버튼 (오른쪽 정렬) -->
      <div class="grade-row" v-if="isAdminOrProfessor">
        <div class="spacer"></div>
        <div class="grade-toolbar">
          <button :class="{ highlighted: grade === 1 }" @click="changeGrade(1)">1학년</button>
          <button :class="{ highlighted: grade === 2 }" @click="changeGrade(2)">2학년</button>
          <button :class="{ highlighted: grade === 3 }" @click="changeGrade(3)">3학년</button>
        </div>
      </div>

      <!-- 🔹 2번째 줄: 날짜 + 주차이동 + 날짜선택기 (한 줄) -->
      <div class="week-toolbar">
        <span class="week-range">{{ weekRange }}</span>

        <div class="week-controls">
          <button @click="goToPreviousWeek">〈</button>
          <button @click="goToToday">이번주</button>
          <button @click="goToNextWeek">〉</button>

          <flat-pickr
            v-model="selectedDate"
            :config="{ dateFormat: 'Y-m-d', locale: Korean, clickOpens: false }"
            ref="calendarRef"
            @click="toggleCalendar"
            @on-change="onDateChange"
            class="calendar-picker"
          />
        </div>
      </div>
    </div>

    <!-- 요일별 시간표 테이블 -->
    <table class="timetable">
      <thead>
        <tr>
          <th>교시</th>
          <th v-for="day in days" :key="day">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="period in periods" :key="period">
          <td class="period-cell">
            {{ period }}교시
            <br />
            <small class="time-text">{{ periodTimes[period] }}</small>
          </td>
          <td
            v-for="day in days"
            :key="day + '-' + period"
            @mousedown="startDrag(day, period)"
            @mouseenter="dragOver(day, period)"
            @mouseup="endDrag"
            @click="onEmptyCellClick(day, period)"
            :class="{
              highlighted: selectedRange.some(r => r.day === day && r.period === period),
              hoverable: getClassesForMergedCell(day, period).length === 0
            }"
          >
          <div
              v-for="cls in getClassesForMergedCell(day, period)"
              :key="cls.id"
              class="merged-class"
              :style="{
                height: `calc(${cls.end_period - cls.start_period + 1} * 90px - ${(cls.end_period - cls.start_period) * 3 + 11}px)`
              }"
              @click="openModal(day, period, cls)"
            >
              <template v-if="cls.category === '정규'">
                <span v-if="cls.is_absent" class="badge badge-cancel">🛑 휴강</span>
                <span v-else class="badge badge-normal">정규</span>
                <strong>{{ cls.subject_name }}</strong><br />
                <small>{{ cls.professor }}</small>
              </template>

              <template v-else-if="cls.category === '보강'">
                <span class="badge badge-makeup">🔁 보강</span>
                <strong>{{ cls.subject_name }}</strong><br />
                <small>{{ cls.professor }}</small>
              </template>

              <!-- Timetable.vue 내부 특강 요약 badge 부분 -->
              <template v-else-if="cls.category === '특강' && cls._summary">
                <div
                  class="badge badge-overlap"
                  @click="openModal(day, period, cls)"
                >
                  특강 {{ cls._count }}개
                </div>
              </template>

              <template v-else-if="cls.category === '특강'">
                <span v-if="cls.is_absent" class="badge badge-cancel">🛑 휴강</span>
                <span v-else-if="cls.status === '보강'" class="badge badge-makeup">🔁 보강</span>
                <span v-else class="badge badge-normal">특강</span>
                <strong>{{ cls.subject_name }}</strong><br />
                <small>{{ cls.professor }}</small><br />
                <small>{{ cls.level }} / {{ cls.class_group }}반</small>
              </template>


              <template v-else-if="cls.category === '한국어'">
                <span v-if="cls.is_absent" class="badge badge-cancel">🛑 휴강</span>
                <span v-else-if="cls.status === '보강'" class="badge badge-makeup">🔁 보강</span>
                <span v-else class="badge badge-normal">한국어</span>
                <strong>{{ cls.subject_name }}</strong><br />
                <small>{{ cls.professor }}</small><br />
                <small>{{ cls.level }}</small>
              </template>

              <!-- ✅ 공휴일 -->
              <template v-else-if="cls.category === '공휴일'">
                <span class="badge badge-cancel">📅 공휴일</span>
                <strong>{{ cls.subject_name }}</strong>
              </template>

            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <TimetableModal
      v-if="showModal"
      :editData="selectedClass"
      :grade="grade"
      :date="selectedDate"
      @close="closeModal"
      @saved="onSaved"
    />

    <OverlappingModal
      v-if="showOverlapModal"
      :classes="overlappingClasses"
      @edit="onEditOverlappedClass"
      @close="showOverlapModal = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTimetable } from '@/composables/useTimetable'
import TimetableModal from '@/components/TimetableModal.vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.min.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import OverlappingModal from '@/components/OverlappingModal.vue'


const { timetable, selectedDate, grade, fetchWeekTimetable, goToPreviousWeek, goToNextWeek, publicHolidays } = useTimetable()

const user = JSON.parse(localStorage.getItem('user') || '{}')
user.is_foreign = Number(user.is_foreign || 0)

const isAdminOrProfessor = user.role === 'admin' || user.role === 'professor'

const today = new Date().toISOString().split("T")[0]
const selectedClass = ref(null)

const calendarRef = ref(null)

// 모달
const showOverlapModal = ref(false)
const overlappingClasses = ref([])

// 시간표 누군지 확인
const titleText = computed(() => {
  if (user.role === 'admin') return '전체 시간표 (관리자용)'
  if (user.role === 'professor') return '전체 시간표 (교수용)'
  return  `${user.name}님의 주간 시간표`
})

function toggleCalendar() {
  if (calendarRef.value && calendarRef.value.fp) {
    const isOpen = calendarRef.value.fp.isOpen
    if (isOpen) {
      calendarRef.value.fp.close()
    } else {
      calendarRef.value.fp.open()
    }
  }
}


function goToToday() {
  selectedDate.value = today
  onDateChange()
}

const weekRange = computed(() => {
  const date = new Date(selectedDate.value)
  const day = date.getDay() || 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const format = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  return `${format(monday)}~${format(sunday)}`
})

const showModal = ref(false)
const showTooltip = ref(null)

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periods = Array.from({ length: 12 }, (_, i) => i + 1)
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
  10: '18:00 ~ 18:50',
  11: '19:00 ~ 19:50',
  12: '20:00 ~ 20:50',
}

// 공휴일 함수
function isHoliday(day) {
  if (!selectedDate.value) return false

  const weekDates = getWeekDates(selectedDate.value)
  const dateStr = weekDates[days.indexOf(day)]

  return publicHolidays.value.some(holiday => holiday.date === dateStr)
}

function getWeekDates(baseDate) {
  if (!baseDate || isNaN(new Date(baseDate))) {
    // console.warn('[getWeekDates] 잘못된 날짜:', baseDate)
    return []
  }

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


function getClassesForMergedCell(day, period) {
  const weekDates = getWeekDates(selectedDate.value)
  const dateStr = weekDates[days.indexOf(day)]

  // ✅ 공휴일은 해당 요일의 1교시에만 표시
  if (period === 1) {
    const holiday = publicHolidays.value.find(h => h.date === dateStr)
    if (holiday) {
      return [{
        id: `holiday-${day}-1`,
        category: '공휴일',
        subject_name: holiday.name,
        professor: '',
        start_period: 1,
        end_period: 1
      }]
    }
  }

  // ✅ 다른 교시는 공휴일 표시 안 함
  if (publicHolidays.value.some(h => h.date === dateStr)) {
    return []
  }

  const isAdmin = user.role === 'admin' || user.role === 'professor'
  const classes = timetable.value[day] || []

  const active = classes.filter(cls =>
    cls.start_period <= period && cls.end_period >= period
  )
  const startOnly = active.filter(cls => cls.start_period === period)

  const regulars = startOnly.filter((c) => {
  // category가 '정규'가 아니면 제외
  if (c.category !== '정규') return false

  // academic_year가 없으면 제외 (== null)
  if (c.academic_year == null) return false

  // 관리자나 교수는 모든 학년 수업을 보이게
  if (user.role === 'admin' || user.role === 'professor') return true

  // 학생이면 본인 학년만
  return Number(c.academic_year) === Number(grade.value)
})

const makeups = startOnly.filter((c) => c.category === '보강')

  const specials = startOnly.filter(c => c.category === '특강')
  let specialsToPush = []
  if (specials.length > 1) {
    specialsToPush.push({
      id: 'special-summary-' + day + '-' + period,
      category: '특강',
      _summary: true,
      _count: specials.length,
      _originals: specials,
      start_period: period,
      end_period: period
    })
  } else {
    specialsToPush = specials
  }

  const getLevelNumber = (text) => {
  if (!text) return ''
  const match = text.match(/\d+/)
  return match ? match[0] : ''
}

const koreans = startOnly.filter(c => {
  const isKoreanClass = c.category === '한국어'
  const cLevel = getLevelNumber(c.level)
  const userLevel = getLevelNumber(user.specialLecture)

  const isVisible = user.role === 'admin' || user.role === 'professor' ||
    (user.is_foreign === 1 && cLevel === userLevel)

  const shouldShow = isKoreanClass && isVisible

  return shouldShow
  })

  return [...regulars, ...makeups, ...specialsToPush, ...koreans]
}

function onDateChange() {
  fetchWeekTimetable(selectedDate.value)
}

function changeGrade(newGrade) {
  grade.value = newGrade
  fetchWeekTimetable(selectedDate.value, newGrade)
}

// 수정용 함수
function onEditOverlappedClass(cls) {
  selectedClass.value = cls
  showModal.value = true
  showOverlapModal.value = false
}

// 드레그 함수
const dragStart = ref(null)
const dragEnd = ref(null)

function startDrag(day, period) {
  if (!isAdminOrProfessor) return
  dragStart.value = { day, period }
  dragEnd.value = null

  // 전역 mouseup 리스너 등록
  window.addEventListener('mouseup', handleGlobalMouseUp)
}

function handleGlobalMouseUp() {
  endDrag()
  window.removeEventListener('mouseup', handleGlobalMouseUp)
}

function dragOver(day, period) {
  if (!dragStart.value) return
  if (day === dragStart.value.day) {
    dragEnd.value = { day, period }
  }
}

function endDrag() {
  if (!dragStart.value || !dragEnd.value) {
    dragStart.value = null
    dragEnd.value = null
    return
  }

  const start = Math.min(dragStart.value.period, dragEnd.value.period)
  const end = Math.max(dragStart.value.period, dragEnd.value.period)
  const day = dragStart.value.day

  const existing = getClassesForMergedCell(day, start).length > 0
  if (existing) {
    dragStart.value = null
    dragEnd.value = null
    return
  }

  selectedClass.value = {
    day,
    start_period: start,
    end_period: end,
    subject_name: '',
    professor: '',
    classroom: '',
    status: '수업 있음',
    start_date: selectedDate.value,
    end_date: selectedDate.value,
    period: grade.value
  }

  showModal.value = true
  dragStart.value = null
  dragEnd.value = null
}

// 클릭 함수
function onEmptyCellClick(day, period) {
  if (!isAdminOrProfessor) return

  // 이미 수업 있는 셀은 무시
  const existing = getClassesForMergedCell(day, period).length > 0
  if (existing) return

  selectedClass.value = {
    day,
    start_period: period,
    end_period: period,
    subject_name: '',
    professor: '',
    classroom: '',
    status: '수업 있음',
    start_date: selectedDate.value,
    end_date: selectedDate.value,
    period: grade.value
  }

  showModal.value = true
}

const selectedRange = computed(() => {
  if (!dragStart.value || !dragEnd.value) return []

  const startPeriod = Math.min(dragStart.value.period, dragEnd.value.period)
  const endPeriod = Math.max(dragStart.value.period, dragEnd.value.period)

  // ✅ 같은 요일에서만 작동하게 제한
  if (dragStart.value.day !== dragEnd.value.day) return []

  return Array.from({ length: endPeriod - startPeriod + 1 }, (_, i) => ({
    day: dragStart.value.day,
    period: startPeriod + i
  }))
})

function openEmptyModal() {
  if (!isAdminOrProfessor) return
  selectedClass.value = {
    day: 'Monday',
    start_period: 1,
    end_period: 1,
    subject_name: '',
    professor: '',
    classroom: '',
    status: '수업 있음',
    start_date: selectedDate.value,
    end_date: selectedDate.value,
    period: grade.value
  }
  showModal.value = true
}

function openModal(day, period, cls) {
  if (!isAdminOrProfessor) return

  // ✅ 요약 카드(특강 여러개)일 경우 → 겹침 모달 열기
  if (cls._summary) {
    overlappingClasses.value = cls._originals
    showOverlapModal.value = true
    return
  }

  // ✅ 일반 수업 수정 모달 열기
  selectedClass.value = cls || {
    day,
    start_period: period,
    end_period: period,
    subject_name: '',
    professor: '',
    classroom: '',
    status: '수업 있음',
    start_date: selectedDate.value,
    end_date: selectedDate.value,
    period: grade.value
  }

  showModal.value = true
}


function closeModal() {
  showModal.value = false
}

function onSaved() {
  fetchWeekTimetable(selectedDate.value)
  showModal.value = false
}

onMounted(() => {
  selectedDate.value = today
  fetchWeekTimetable(today).then(() => {
  })
})
</script>

<style scoped>
/* 기존 스타일 유지하면서 특강 요약 추가 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin: 80px 0 16px;
  color: #1f2937;
  text-align: center;
  letter-spacing: 0.1em;
}

.title-kr {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 40px;
  letter-spacing: 0.1em;
}

.header-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.grade-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.spacer {
  flex: 1;
}

.grade-toolbar {
  display: flex;
  gap: 8px;
}

.grade-toolbar button {
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}
.grade-toolbar button:hover {
  background-color: #e5e7eb;
}
.highlighted {
  background-color: #dbeafe !important;
  border-color: #60a5fa;
  color: #1e40af;
}

.week-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.week-range {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.week-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-controls button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
}

.week-controls button:hover {
  background-color: #f3f4f6;
}

.calendar-picker {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  width: 140px;
}

.timetable {
  user-select: none; /* 드래그 시 텍스트 선택 방지 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
}
th {
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  padding: 10px;
  border: 1px solid #e5e7eb;
}
td {
  position: relative;
  height: 90px;
  padding: 0;
  text-align: center;
  border: 1px solid #e5e7eb;
  vertical-align: top;
}
.merged-class {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  padding: 26px 12px 16px 12px;
  font-size: 10px;
  line-height: 1.0;
  background-color: #3b82f6;
  color: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: left;
  z-index: 1;
  box-sizing: border-box;
}
.merged-class strong {
  font-size: 13.5px;
  font-weight: 700;
  margin-top: 8px;
  margin-bottom: 2px;
  display: block;
}
.merged-class small {
  font-size: 12px;
  color: #e0f2fe;
}
.badge {
  position: absolute;
  top: 6px;
  left: 10px;
  font-size: 11.5px;
  padding: 3px 7px;
  border-radius: 999px;
  font-weight: 600;
  z-index: 3;
}
.badge-cancel {
  background-color: #fee2e2;
  color: #b91c1c;
}
.badge-normal {
  background-color: #dbeafe;
  color: #1e40af;
}
.badge-special-summary {
  background-color: #f97316;
  color: white;
  font-weight: 700;
  text-align: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 13px;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  cursor: default;
}

.popover {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #111;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 10px 12px;
  z-index: 10;
  white-space: nowrap;
  width: max-content;
  min-width: 120px;
}

.popover-item {
  font-size: 13px;
  margin-bottom: 6px;
}

.popover-item small {
  font-size: 12px;
  color: #374151; /* or #6b7280 */
  font-weight: 400;
}

.popover-item:last-child {
  margin-bottom: 0;
}

.hoverable:hover {
  background-color: #eff6ff; /* 연한 하늘색 */
  cursor: pointer;
}

.controls button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  font-weight: 500;
  transition: all 0.2s;
}
.controls button:hover {
  background-color: #f3f4f6;
  color: #1d4ed8;
  border-color: #1d4ed8;
}

.week-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.week-range {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.week-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-buttons button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
}

.week-buttons button:hover {
  background-color: #f3f4f6;
}

.calendar-picker {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
}

.period-cell {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  vertical-align: middle; /* ✅ 가운데 정렬 */
  text-align: center;
  height: 90px; /* 혹시 없으면 넣기 */
}


.time-text {
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-top: 4px;
}

/* 특강 */
.badge-overlap {
  position: absolute;
  top: 8px;
  left: 10px;
  padding: 4px 8px;
  background-color: #fcd34d;  /* 노랑 or #f97316 오렌지도 ok */
  color: #1f2937;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: background 0.2s;
}
.badge-overlap:hover {
  background-color: #fde68a;
}

.badge-makeup {
  background-color: #c7d2fe;
  color: #3730a3;
}


</style>
