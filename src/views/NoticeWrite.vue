<template>
  <div class="notice-write-container">
    <h2>공지사항 작성</h2>
    <form @submit.prevent="submitForm">
      <!-- 제목 -->
      <div class="form-group">
        <label for="title">제목</label>
        <input id="title" type="text" v-model="noticeData.title" required />
      </div>

      <!-- 내용 -->
      <div class="form-group">
        <label for="content">내용</label>
        <textarea id="content" v-model="noticeData.content" required></textarea>
      </div>

      <!-- 분류 -->
      <div class="form-group">
        <label for="category">분류</label>
        <select id="category" v-model="noticeData.category">
          <option value="학과">정규 과목</option>
          <option value="과목별">특강</option>
          <option value="한국어">한국어</option>
        </select>
      </div>

      <!-- 학년 -->
      <div class="form-group" v-if="noticeData.category === '학과'">
        <label for="year">학년</label>
        <select id="year" v-model="selectedYear">
          <option value="전체">전체</option>
          <option v-for="year in [1, 2, 3]" :key="year" :value="year">{{ year }}학년</option>
        </select>
      </div>

      <!-- 과목 -->
      <div class="form-group" v-if="filteredSubjects.length > 0">
        <label for="subject">과목</label>
        <select id="subject" v-model="noticeData.subject_id">
          <option value="">과목 선택</option>
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>

      <!-- 여러 파일 첨부 -->
      <div class="form-group">
        <label>파일 첨부</label>
        <div class="file-upload-box" v-for="(name, index) in fileNames" :key="index">
          <span class="file-name">📄 {{ name }}</span>
          <button type="button" class="file-remove-btn" @click="removeFile(index)">❌</button>
        </div>
        <label for="file-upload" class="file-label">📁 파일 선택</label>
        <input id="file-upload" type="file" multiple @change="handleFileUpload" hidden />
      </div>

      <!-- 고정 공지 -->
      <div class="form-group switch-container">
        <label for="pin">공지 고정</label>
        <input id="pin" type="checkbox" v-model="noticeData.is_pinned" />
      </div>

      <!-- Google Calendar 등록 -->
      <div class="form-group switch-container">
        <label for="sendGoogleCalendar">Google Calendar에 일정 등록</label>
        <input id="sendGoogleCalendar" type="checkbox" v-model="noticeData.sendGoogleCalendar" />
      </div>

      <!-- 일정 필드 -->
      <div v-if="noticeData.sendGoogleCalendar" class="calendar-fields">
        <div class="calendar-field">
          <label>시작 날짜</label>
          <Flatpickr v-model="calendarStartDate" :config="startDateConfig" class="flat-input" @click="toggleStartDate" />
        </div>
        <div class="calendar-field">
          <label>시작 시간</label>
          <Flatpickr v-model="calendarStartTime" :config="startTimeConfig" class="flat-input" @click="toggleStartTime" />
        </div>
        <div class="calendar-field">
          <label>종료 날짜</label>
          <Flatpickr v-model="calendarEndDate" :config="endDateConfig" class="flat-input" @click="toggleEndDate" />
        </div>
        <div class="calendar-field">
          <label>종료 시간</label>
          <Flatpickr v-model="calendarEndTime" :config="endTimeConfig" class="flat-input" @click="toggleEndTime" />
        </div>
      </div>

      <!-- LINE 발송 -->
      <div class="form-group switch-container">
        <label for="sendLine">LINE으로 발송</label>
        <input id="sendLine" type="checkbox" v-model="noticeData.sendLine" />
      </div>

      <!-- 버튼 -->
      <div class="button-group">
        <button type="submit" class="submit-btn">작성</button>
        <button type="button" class="cancel-btn" @click="cancelWrite">취소</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useNoticeForm } from "@/composables/useNoticeForm";
import { useSubjects } from "@/composables/useSubjects";
import { useRouter } from "vue-router";
import Flatpickr from "vue-flatpickr-component"
import "flatpickr/dist/flatpickr.css"

// 📌 상태 변수 정의
const isStartDateOpen = ref(false)
const isEndDateOpen = ref(false)
const isStartTimeOpen = ref(false)
const isEndTimeOpen = ref(false)

const startDatePickerInstance = ref(null)
const endDatePickerInstance = ref(null)
const startTimePickerInstance = ref(null)
const endTimePickerInstance = ref(null)

const calendarStartDate = ref("")
const calendarStartTime = ref("")
const calendarEndDate = ref("")
const calendarEndTime = ref("")

// 📌 캘린더 토글 함수
const toggleStartDate = async () => {
  if (!startDatePickerInstance.value) return
  isStartDateOpen.value = !isStartDateOpen.value
  isEndDateOpen.value = false
  isStartDateOpen.value
    ? startDatePickerInstance.value.open()
    : startDatePickerInstance.value.close()
  await nextTick()
  document.querySelector(".start-date-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" })
}

const toggleEndDate = async () => {
  if (!endDatePickerInstance.value) return
  isEndDateOpen.value = !isEndDateOpen.value
  isStartDateOpen.value = false
  isEndDateOpen.value
    ? endDatePickerInstance.value.open()
    : endDatePickerInstance.value.close()
  await nextTick()
  document.querySelector(".end-date-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" })
}

const toggleStartTime = async () => {
  if (!startTimePickerInstance.value) return
  isStartTimeOpen.value = !isStartTimeOpen.value
  isEndTimeOpen.value = false
  isStartTimeOpen.value
    ? startTimePickerInstance.value.open()
    : startTimePickerInstance.value.close()
}

const toggleEndTime = async () => {
  if (!endTimePickerInstance.value) return
  isEndTimeOpen.value = !isEndTimeOpen.value
  isStartTimeOpen.value = false
  isEndTimeOpen.value
    ? endTimePickerInstance.value.open()
    : endTimePickerInstance.value.close()
  await nextTick()
  document.querySelector(".end-date-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" })
}

// 📌 Flatpickr 설정
const startDateConfig = {
  dateFormat: "Y-m-d",
  clickOpens: false,
  appendTo: document.body,
  position: "below",
  onReady: (_, __, instance) => (startDatePickerInstance.value = instance),
  onClose: () => (isStartDateOpen.value = false),
}

const endDateConfig = {
  dateFormat: "Y-m-d",
  clickOpens: false,
  appendTo: document.body,
  position: "below",
  onReady: (_, __, instance) => (endDatePickerInstance.value = instance),
  onClose: () => (isEndDateOpen.value = false),
}

const startTimeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  clickOpens: false,
  appendTo: document.body,
  position: "below",
  onReady: (_, __, instance) => (startTimePickerInstance.value = instance),
  onClose: () => (isStartTimeOpen.value = false),
}

const endTimeConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  clickOpens: false,
  appendTo: document.body,
  position: "below",
  onReady: (_, __, instance) => (endTimePickerInstance.value = instance),
  onClose: () => (isEndTimeOpen.value = false),
}

// 📌 폼 관련 데이터
const { noticeData, createNotice } = useNoticeForm()
const router = useRouter()

const selectedYear = ref("전체")
const { subjects, loadSubjects } = useSubjects(selectedYear)
const fileNames = ref([])
noticeData.value.files = ref([])

const filteredSubjects = computed(() => {
  const category = noticeData.value.category
  if (category === "과목별") return subjects.value.filter(s => s.category === "특강")
  if (category === "한국어") return subjects.value.filter(s => s.category === "한국어")
  return subjects.value.filter(s => s.category === "정규" && s.academic_year == selectedYear.value)
})

// 📌 파일 업로드
const handleFileUpload = e => {
  const files = Array.from(e.target.files)
  fileNames.value.push(...files.map(f => f.name))
  noticeData.value.files.push(...files)
}

const removeFile = index => {
  fileNames.value.splice(index, 1)
  noticeData.value.files.splice(index, 1)
}

// 📌 초기 로드
onMounted(async () => {
  noticeData.value.category = "학과"
  await loadSubjects()
})

watch(selectedYear, async () => {
  await loadSubjects()
  noticeData.value.academic_year = selectedYear.value === "전체" ? null : Number(selectedYear.value)
})

// 📌 작성 취소
const cancelWrite = () => {
  if (confirm("작성을 취소하시겠습니까?")) router.push("/notices")
}

// 📌 제출
const submitForm = async () => {
  const category = noticeData.value.category
  noticeData.value.academic_year =
    category === "과목별"
      ? 0
      : category === "한국어"
      ? null
      : selectedYear.value === "전체"
      ? null
      : Number(selectedYear.value)

  const success = await createNotice()
  if (!success) return alert("공지 등록 실패")

  if (noticeData.value.sendGoogleCalendar) {
    try {
      const isDateValid = calendarStartDate.value && calendarEndDate.value
      const hasStartTime = !!calendarStartTime.value
      const hasEndTime = !!calendarEndTime.value
      const isTimeValid = hasStartTime && hasEndTime

      if (!isDateValid) return alert("시작일과 종료일은 반드시 선택해야 합니다.")

      const event = {
        summary: noticeData.value.title,
        description: noticeData.value.content,
      }

      if (isTimeValid) {
        const start = new Date(`${calendarStartDate.value}T${calendarStartTime.value}`)
        const end = new Date(`${calendarEndDate.value}T${calendarEndTime.value}`)
        event.start = { dateTime: start.toISOString(), timeZone: "Asia/Seoul" }
        event.end = { dateTime: end.toISOString(), timeZone: "Asia/Seoul" }
      } else {
        const startDate = calendarStartDate.value
        const endDate = new Date(calendarEndDate.value)
        endDate.setDate(endDate.getDate() + 1)
        event.start = { date: startDate }
        event.end = { date: endDate.toISOString().split("T")[0] }
      }

      await fetch("/api/google-calendar/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      })

      alert("📅 Google Calendar에 일정이 등록되었습니다!")
    } catch (err) {
      console.error("Google Calendar 등록 실패:", err)
      alert("Google Calendar 등록에 실패했습니다.")
    }
  }

  alert("공지사항이 작성되었습니다.")
  router.push("/notices")
}
</script>


<style scoped>
/* 🔹 공통 컨테이너 */
.notice-write-container {
  max-width: 800px;
  margin: 100px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Noto Sans KR', sans-serif;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}

input[type="text"],
textarea,
select {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ddd;
  box-sizing: border-box;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #1d4ed8;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

/* 🔹 버튼 */
.button-group {
  display: flex;
  gap: 12px;
}

.submit-btn,
.cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
}

.submit-btn {
  background-color: #1d4ed8;
  color: white;
}
.submit-btn:hover {
  background-color: #2563eb;
}

.cancel-btn {
  background-color: #9ca3af;
  color: white;
}
.cancel-btn:hover {
  background-color: #6b7280;
}

/* 🔹 파일 업로드 */
.file-upload-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
  max-width: 100%;
  overflow: hidden;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #333;
}

.file-remove-btn {
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 16px;
  cursor: pointer;
}

.file-label {
  display: inline-block;
  background-color: #1d4ed8;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

/* 🔹 스위치 */
.switch-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-container input[type="checkbox"] {
  width: 40px;
  height: 20px;
  border-radius: 50px;
  appearance: none;
  background-color: #ccc;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.switch-container input[type="checkbox"]::before {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.3s ease;
}

.switch-container input[type="checkbox"]:checked {
  background-color: #4caf50;
}

.switch-container input[type="checkbox"]:checked::before {
  transform: translateX(20px);
}

/* 🔹 Google Calendar 필드 */
.calendar-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 30px;
  transition: margin-bottom 0.3s ease;
}

.start-date-anchor.expanded,
.end-date-anchor.expanded {
  margin-bottom: 300px;
}

.calendar-field label {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: #333;
}

.calendar-field input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

/* 🔹 기타 */
.preview-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
}
</style>
