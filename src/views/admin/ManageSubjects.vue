<template>
  <div style="padding: 16px;">
    <h2>과목 관리</h2>

    <!-- 학년 필터 버튼 -->
    <div style="margin-bottom: 16px;">
      <button
        v-for="option in yearOptions"
        :key="option.value"
        @click="selectedYear = option.value"
        :class="['filter-btn', { active: selectedYear === option.value }]"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- 과목 목록 테이블 -->
    <table v-if="filteredSubjects.length > 0">
      <thead>
        <tr>
          <th>과목명</th>
          <th>학년</th>
          <th v-if="selectedYear === 0 || selectedYear === null">레벨</th>
          <th v-if="selectedYear === 0">반</th>
          <th>수정 / 삭제</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="subject in filteredSubjects" :key="subject.id">
          <td>{{ subject.name }}</td>
          <td>
            {{
              subject.academic_year === 0
                ? '특강'
                : subject.academic_year === null
                ? '한국어'
                : subject.academic_year + '학년'
            }}
          </td>
          <td v-if="selectedYear === 0 || selectedYear === null">
            {{ subject.level || '-' }}
          </td>
          <td v-if="selectedYear === 0">
            {{ subject.class_group || '-' }}
          </td>
          <td>
            <button class="btn btn-blue" @click="editSubject(subject)">수정</button>
            <button class="btn btn-red" @click="deleteSubject(subject.id)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>등록된 과목이 없습니다.</p>

    <hr />

    <!-- 과목 추가 -->
    <h3>과목 추가</h3>
    <div>
      <label>과목명:
        <input v-model="newName" placeholder="예) 컴퓨터 개론" />
      </label>

      <label>학년:
        <select v-model="newAcademicYear">
          <option :value="1">1학년</option>
          <option :value="2">2학년</option>
          <option :value="3">3학년</option>
          <option :value="0">특강</option>
          <option :value="null">한국어</option>
        </select>
      </label>

      <!-- 학년이 특강(0) 또는 한국어(null)일 때 레벨 옵션 분기 -->
      <label v-if="newAcademicYear === 0 || newAcademicYear === null">
        레벨:
        <select v-model="newLevel">
          <template v-if="newAcademicYear === 0">
            <option value="N1">N1</option>
            <option value="N2">N2</option>
            <option value="N3">N3</option>
          </template>
          <template v-else-if="newAcademicYear === null">
            <option value="4급">4급</option>
            <option value="6급">6급</option>
          </template>
        </select>
      </label>

      <!-- 특강일 때만 반 옵션 표시 -->
      <label v-if="newAcademicYear === 0">
        반:
        <select v-model="newClassGroup">
          <option value="전체">전체</option>
          <option value="A">A반</option>
          <option value="B">B반</option>
        </select>
      </label>

      <button @click="addSubject">등록</button>
    </div>

    <hr />

    <!-- 과목 수정 -->
    <div v-if="editMode" class="subject-edit-form">
      <h3>과목 수정</h3>
      <label>
        과목명
        <input v-model="editForm.name" />
      </label>

      <label>
        학년
        <select v-model="editForm.academic_year">
          <option :value="1">1학년</option>
          <option :value="2">2학년</option>
          <option :value="3">3학년</option>
          <option :value="0">특강</option>
          <option :value="null">한국어</option>
        </select>
      </label>

      <!-- 학년이 특강(0) 또는 한국어(null)일 때 레벨 옵션 분기 -->
      <label v-if="editForm.academic_year === 0 || editForm.academic_year === null">
        레벨:
        <select v-model="editForm.level">
          <template v-if="editForm.academic_year === 0">
            <option value="N1">N1</option>
            <option value="N2">N2</option>
            <option value="N3">N3</option>
          </template>
          <template v-else-if="editForm.academic_year === null">
            <option value="4급">4급</option>
            <option value="6급">6급</option>
          </template>
        </select>
      </label>

      <!-- 특강일 때만 반 옵션 표시 -->
      <label v-if="editForm.academic_year === 0">
        반:
        <select v-model="editForm.class_group">
          <option value="전체">전체</option>
          <option value="A">A반</option>
          <option value="B">B반</option>
        </select>
      </label>

      <div class="action-buttons">
        <button class="btn btn-blue" @click="updateSubject">수정 저장</button>
        <button class="btn btn-red" @click="cancelEdit">취소</button>
      </div>
    </div>

    <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const subjects = ref([])
const selectedYear = ref(1)
const errorMessage = ref('')

const yearOptions = [
  { label: '1학년', value: 1 },
  { label: '2학년', value: 2 },
  { label: '3학년', value: 3 },
  { label: '특강', value: 0 },
  { label: '한국어', value: null }
]

const filteredSubjects = computed(() =>
  subjects.value.filter(subject => subject.academic_year === selectedYear.value)
)

const newName = ref('')
const newAcademicYear = ref(1)
const newLevel = ref('')
const newClassGroup = ref('')

const editMode = ref(false)
const editForm = ref({
  id: null,
  name: '',
  academic_year: 1,
  level: '',
  class_group: ''
})

async function fetchSubjects() {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/subjects')
    subjects.value = res.data || []
  } catch (err) {
    console.error(err)
    errorMessage.value = '과목 목록을 불러오지 못했습니다.'
  }
}

async function addSubject() {
  if (!newName.value) return alert('과목명을 입력하세요.')
  try {
    await axios.post('http://localhost:5000/api/admin/subjects', {
    name: newName.value,
    academic_year: newAcademicYear.value,
    level: newLevel.value || null,
    class_group: newClassGroup.value || null,
    category:
    editForm.value.academic_year === 0
      ? "특강"
      : editForm.value.academic_year === null
      ? "한국어"
      : "정규"
  })
    alert('과목이 등록되었습니다.')
    newName.value = ''
    newAcademicYear.value = 1
    newLevel.value = ''
    newClassGroup.value = ''
    fetchSubjects()
  } catch (err) {
    console.error(err)
    errorMessage.value = '과목 등록에 실패했습니다.'
  }
}

async function deleteSubject(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await axios.delete(`http://localhost:5000/api/admin/subjects/${id}`)
    alert('삭제 완료')
    fetchSubjects()
  } catch (err) {
    console.error(err)
    errorMessage.value = '삭제에 실패했습니다.'
  }
}

function editSubject(subject) {
  editMode.value = true
  editForm.value = { ...subject }
}

function cancelEdit() {
  editMode.value = false
  editForm.value = {
    id: null,
    name: '',
    academic_year: 1,
    level: '',
    class_group: '',
    category: '정규'
  }
}

async function updateSubject() {
  if (!editForm.value.name) return alert('과목명을 입력하세요.')
  try {
    await axios.put(`http://localhost:5000/api/admin/subjects/${editForm.value.id}`, {
    name: editForm.value.name,
    academic_year: editForm.value.academic_year,
    level: editForm.value.level || null,
    class_group: editForm.value.class_group || null,
    category: editForm.value.category || '정규'  // ✅ 직접 유지된 값 사용
  })
    alert('수정 완료')
    editMode.value = false
    fetchSubjects()
  } catch (err) {
    console.error(err)
    errorMessage.value = '수정에 실패했습니다.'
  }
}

onMounted(fetchSubjects)
</script>

<style scoped>
div {
  font-family: 'Noto Sans KR', sans-serif;
}

h2, h3 {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
  margin: 20px 0 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 10px 12px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
}

thead {
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

input, select {
  padding: 6px 10px;
  font-size: 13px;
  margin: 6px 10px 6px 0;
  border-radius: 6px;
  border: 1px solid #ccc;
  min-width: 160px;
}

/* 버튼 공통 스타일 */
button, .btn {
  padding: 6px 10px;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 6px;
  color: white;
  transition: background-color 0.2s;
}

/* 파란색 버튼 (기본/수정) */
.btn-blue {
  background-color: #3b82f6;
}
.btn-blue:hover {
  background-color: #2563eb;
}

/* 빨간색 버튼 (삭제/취소) */
.btn-red {
  background-color: #ef4444;
}
.btn-red:hover {
  background-color: #dc2626;
}

/* 테이블 내부 버튼 여백 */
td button {
  margin: 0 4px;
  min-width: 48px;
  padding: 5px 8px;
}

.subject-edit-form {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
}

.subject-edit-form label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

hr {
  margin: 30px 0;
  border: none;
  border-top: 1px solid #ddd;
}

p {
  font-size: 14px;
  color: #ef4444;
}

.filter-btn {
  padding: 8px 16px;
  margin-right: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.filter-btn.active {
  background-color: #2563eb;
}
</style>
