<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>시간표 추가</h3>
      <form @submit.prevent="save">
        <!-- 카테고리 선택 -->
        <label>카테고리
          <select v-model="form.category">
            <option value="정규">정규</option>
            <option value="특강">특강</option>
            <option value="한국어">한국어</option>
            <option value="보강">보강</option>
          </select>
        </label>

        <!-- 요일 선택 -->
        <label>요일:
          <select v-model="selectedDay" required>
            <option disabled value="">요일 선택</option>
            <option v-for="(eng, kor) in dayMap" :key="kor" :value="kor">
              {{ kor }}
            </option>
          </select>
        </label>

        <!-- 과목 선택 -->
        <label>과목명
          <select v-model="form.subject_name" required>
            <option disabled value="">과목 선택</option>
            <option v-for="s in filteredSubjects" :key="s.id" :value="s.name">
              {{ s.name }}
            </option>
          </select>
        </label>

        <!-- 특강 또는 한국어인 경우 반 선택 -->
        <div v-if="form.category === '특강'">
          <label>반 (A/B/전체)
            <select v-model="form.class_group" required>
              <option value="A">A반</option>
              <option value="B">B반</option>
              <option value="전체">전체</option>
            </select>
          </label>
        </div>

        <label>교수명 <input v-model="form.professor" required /></label>
        <label>강의실 <input v-model="form.classroom" /></label>

        <label>시작 교시 <input type="number" min="1" max="10" v-model.number="form.start_period" required /></label>
        <label>종료 교시 <input type="number" min="1" max="10" v-model.number="form.end_period" required /></label>

        <label>시작일 <input type="date" v-model="form.start_date" required /></label>
        <label>종료일 <input type="date" v-model="form.end_date" required /></label>

        <!-- 휴강 설정 -->
        <div v-if="form.id">
          <label>휴강 설정</label>
          <div class="switch-row">
            <input type="checkbox" id="toggleSwitch" class="switch-input" v-model="isAbsent" />
            <label for="toggleSwitch" class="switch"></label>
            <span class="label-text">{{ isAbsent ? '❌ 휴강' : '✅ 수업 있음' }}</span>
          </div>
        </div>

        <!-- 저장/취소 -->
        <div class="actions">
          <button type="submit">저장</button>
          <button type="button" class="cancel" @click="emit('close')">취소</button>
        </div>

        <div class="delete-wrapper" v-if="form.id">
          <button type="button" class="delete" @click="remove">🗑 삭제</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch, watchEffect } from 'vue'
import axios from 'axios'
import { useSubjects } from '@/composables/useSubjects'
import { addHoliday, deleteHoliday } from '@/api/holidaysApi'
import { nextTick } from 'vue'


const props = defineProps({
  editData: Object,
  grade: Number,
  date: String
})
const emit = defineEmits(['close', 'saved'])

const dayMap = {
  '월요일': 'Monday',
  '화요일': 'Tuesday',
  '수요일': 'Wednesday',
  '목요일': 'Thursday',
  '금요일': 'Friday'
}
const reverseDayMap = Object.fromEntries(Object.entries(dayMap).map(([k, v]) => [v, k]))

const selectedDay = ref('')
const user = JSON.parse(localStorage.getItem('user') || '{}')

const form = reactive({})

// 🔽 1. 기본값 먼저 설정
Object.assign(form, {
  category: '정규',
  subject_name: '',
  professor: '',
  classroom: '',
  start_period: 1,
  end_period: 1,
  start_date: '',
  end_date: '',
  day: '',
  status: '',  // 기본값으로만 세팅. 덮지 않음!
  class_group: null
})

// 🔽 2. editData가 있으면 그대로 덮어씀
if (props.editData) {
  Object.assign(form, props.editData)
}


const selectedYear = computed(() => {
  if (form.category === '정규') return props.grade
  if (form.category === '한국어') return 'KOR'  // <- 한국어는 academic_year = NULL 처리
  return null  // 특강 등은 전체 받아오기
})

const { subjects } = useSubjects(selectedYear)


// 👉 수정된 필터
const filteredSubjects = computed(() => {
  if (form.category === '정규') {
    return subjects.value.filter(s => s.category === '정규' && s.academic_year === props.grade)
  } else if (form.category === '특강') {
    return subjects.value.filter(s => s.category === '특강')
  } else if (form.category === '한국어') {
    return subjects.value.filter(s => s.academic_year === null && s.category === '한국어') // ✅ 이 줄 중요!
  } else if (form.category === '보강') {
    // ✅ 1. 현재 학년의 정규 + 모든 한국어 (외국인 수업)만
    const 정규 = subjects.value.filter(
      s => s.category === '정규' && s.academic_year === props.grade
    )
    const 한국어 = subjects.value.filter(
      s => s.category === '한국어' && s.academic_year === null
    )

    // ✅ 2. 정규 먼저, 한국어 나중에 정렬
    return [...정규, ...한국어]
  } else {
    return []
  }
})


const isAbsent = ref(false)
watch(isAbsent, val => {
  form.status = val ? '휴강' : '수업 있음'
})

// 날짜 초기화
watch(
  () => props.editData,
  async (val) => {
    if (!val) return;

    // 🔄 form 정보 먼저 복사
    Object.assign(form, val);

    // ✅ 요일 세팅 → 그걸 기반으로 날짜 계산
    selectedDay.value = reverseDayMap[val.day] || '';

    // ✅ 요일 기반 날짜 계산 (올바른 순서)
    const correctedDate = getActualHolidayDateFromWeek(props.date, val.day);
    form.start_date = correctedDate;
    form.end_date = correctedDate;

    await nextTick();
    isAbsent.value = !!val.is_absent;
  },
  { immediate: true }
)


function formatDateLocal(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

function getActualHolidayDate(baseDate, targetDayEng) {
  const base = new Date(baseDate)
  const baseDay = base.getDay()

  const dayToNumber = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  }

  const targetDay = dayToNumber[targetDayEng]
  const diff = targetDay - baseDay
  const actualDate = new Date(base)
  actualDate.setDate(base.getDate() + diff)

  return actualDate.toISOString().split('T')[0]
}

function getActualHolidayDateFromWeek(selectedWeekDate, targetDayEng) {
  const base = new Date(selectedWeekDate);
  const baseDay = base.getDay();

  // 주의 시작을 "월요일"로 보정
  const monday = new Date(base);
  const offsetToMonday = baseDay === 0 ? -6 : 1 - baseDay;  // 일요일이면 -6, 그 외는 1 - baseDay
  monday.setDate(base.getDate() + offsetToMonday);

  // 목표 요일 더하기
  const dayToNumber = {
    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2,
    'Thursday': 3, 'Friday': 4
  };

  const dayOffset = dayToNumber[targetDayEng];
  if (dayOffset === undefined) return ''; // 잘못된 요일이면 빈 문자열

  const result = new Date(monday);
  result.setDate(monday.getDate() + dayOffset);

  return result.toISOString().split('T')[0];
}


async function remove() {
  if (!form.id) return;

  const confirmed = confirm("정말 이 수업을 삭제하시겠습니까?");
  if (!confirmed) return;

  try {
    await axios.delete(`http://localhost:5000/api/timetable/${form.id}`);

    // 🔄 form.start_date를 기준으로 보정
    const actualHolidayDate = getActualHolidayDate(form.start_date, form.day);

    const holidayPayload = {
      holiday_date: actualHolidayDate,
      subject_id: form.subject_id,
      day: form.day,
      lecture_period: form.start_period,
      period: form.academic_year ?? props.grade
    };

    await deleteHoliday(holidayPayload);

    alert("🗑 삭제 완료");
    emit("saved");
    emit("close");
  } catch (err) {
    console.error("❌ 삭제 실패:", err);
    alert("❌ 삭제 실패");
  }
}


async function save() {
  const subject = subjects.value.find(s => s.name === form.subject_name)
  if (!subject) return alert('유효한 과목을 선택해주세요.')

  const payload = {
    subject_id: subject.id,
    professor: form.professor,
    classroom: form.classroom,
    day: dayMap[selectedDay.value],
    start_period: form.start_period,
    end_period: form.end_period,
    start_date: form.start_date,
    end_date: form.end_date,
    status: isAbsent.value ? '휴강' : '수업 있음',
    period: subject.academic_year ?? props.grade,
    level: subject.level || null,
    class_group: form.class_group || null,
    category: form.category
  }

  try {
    if (form.id) {
      await axios.put(`http://localhost:5000/api/timetable/${form.id}`, payload)
    } else {
      await axios.post(`http://localhost:5000/api/timetable`, payload)
    }

    // ✅ 휴강일 계산용 기준 날짜 분리
    const baseDateForHoliday = form.id ? form.start_date : props.date
    const actualHolidayDate = getActualHolidayDate(baseDateForHoliday, payload.day)

    const holidayPayload = {
      holiday_date: actualHolidayDate,
      subject_id: payload.subject_id,
      day: payload.day,
      lecture_period: payload.start_period,
      period: subject.academic_year ?? props.grade
    }

    if (isAbsent.value) {
      await addHoliday(holidayPayload)
    } else {
      await deleteHoliday(holidayPayload)
    }

    alert('✅ 시간표 저장 완료')
    emit('saved')
    emit('close')
  } catch (err) {
    console.error("❌ 저장 실패:", err)
    alert('❌ 저장 실패')
  }
}



</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 360px;
}
label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
}
input, select {
  width: 100%;
  margin-top: 4px;
  padding: 6px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
}

.absence-toggle {
  margin-top: 12px;
  margin-bottom: 8px;
  text-align: left;
}
.absence-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 14px;
}

/* Switch 스타일 */
.switch-input {
  display: none;
}
.switch {
  position: relative;
  width: 40px;
  height: 22px;
  background-color: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.switch-row {
  display: flex;
  align-items: center; /* 이미 있을 것 */
  gap: 12px;
  margin-bottom: 14px;
}

.label-text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  line-height: 1;
  position: relative;
  top: -5px;  /* ❗살짝 위로 올려줌 */
}

.switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}
.switch-input:checked + .switch {
  background-color: #2563eb;
}
.switch-input:checked + .switch::before {
  transform: translateX(18px);
}

.label-text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.actions button {
  flex: 1;
  padding: 8px 12px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
}
button.cancel {
  background-color: #e5e7eb;
  color: #374151;
}
button.cancel:hover {
  background-color: #d1d5db;
}
button {
  background-color: #2563eb;
  color: white;
}
button:hover {
  background-color: #1d4ed8;
}

.delete-wrapper {
  margin-top: 14px;
  text-align: center;
}
.delete-wrapper .delete {
  background-color: #ef4444;
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  width: 100%;
  font-weight: 500;
}
.delete-wrapper .delete:hover {
  background-color: #dc2626;
}
</style>
