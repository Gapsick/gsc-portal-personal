<template>
    <div class="student-container">
      <h2>📋 학생 정보 관리</h2>
  
      <!-- 학년/유학생 필터 -->
      <div class="grade-filter">
        <button
          v-for="filter in gradeFilters"
          :key="filter.value"
          :class="{ active: selectedGrade === filter.value }"
          @click="selectedGrade = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
  
      <!-- 학생 테이블 -->
      <table v-if="filteredStudents.length > 0">
        <thead>
          <tr>
            <th>이름</th>
            <th>학번</th>
            <th>학년</th>
            <th>전화번호</th>
            <th>특강 레벨</th>
            <th>반</th>
            <th>저장</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.id">
            <td>{{ student.name }}</td>
            <td>{{ student.student_id }}</td>
  
            <!-- 학년 -->
            <td>
              <select v-model="student._grade">
                <option v-for="g in [1, 2, 3]" :key="g" :value="g">{{ g }}학년</option>
              </select>
            </td>
  
            <!-- 전화번호 -->
            <td>
              <input type="text" v-model="student._phone" />
            </td>
  
            <!-- 특강 레벨 -->
            <td>
              <select v-model="student._special_lecture">
                <option disabled value=""> 선택 </option>
                <template v-if="student.is_foreign === 1">
                  <option value="TOPIK4">TOPIK4</option>
                  <option value="TOPIK6">TOPIK6</option>
                </template>
                <template v-else>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                </template>
              </select>
            </td>
  
            <!-- 반 -->
            <td v-if="student.is_foreign === 0">
              <select v-model="student._class_group">
                <option disabled value=""> 선택 </option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="전체">전체</option>
              </select>
            </td>
            <td v-else>-</td>
  
            <!-- 저장 버튼 -->
            <td>
              <button
                :disabled="!student._special_lecture || (student.is_foreign === 0 && !student._class_group)"
                @click="saveStudent(student)"
              >
                저장
              </button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <p v-else class="empty-message">📍 등록된 학생이 없습니다.</p>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  
  const students = ref([])
  const selectedGrade = ref(1)
  
  const gradeFilters = [
    { label: '1학년', value: 1 },
    { label: '2학년', value: 2 },
    { label: '3학년', value: 3 },
    { label: '유학생', value: 'foreign' }
  ]
  
  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/students")
      students.value = res.data.map(s => ({
        ...s,
        _grade: s.grade,
        _phone: s.phone,
        _special_lecture: s.special_lecture,
        _class_group: s.class_group
      }))
    } catch (err) {
      console.error("❌ 학생 목록 로드 실패:", err)
    }
  }
  
  const saveStudent = async (student) => {
    try {
      await axios.put(`/api/admin/students/${student.id}`, {
        grade: student._grade,
        phone: student._phone,
        special_lecture: student._special_lecture || null,
        class_group: student.is_foreign ? null : student._class_group || null
      })
      alert("✅ 저장되었습니다.")
      await fetchStudents()
    } catch (err) {
      alert("❌ 저장 실패")
    }
  }
  
  const filteredStudents = computed(() => {
    if (selectedGrade.value === 'foreign') {
      return students.value.filter(s => s.is_foreign === 1)
    }
    return students.value.filter(s => s.grade === selectedGrade.value && s.is_foreign === 0)
  })
  
  onMounted(fetchStudents)
  </script>
  
  <style scoped>
  .student-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
    max-width: 960px;
    margin: 30px auto;
  }
  
  h2 {
    font-size: 20px;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .grade-filter {
    margin-bottom: 20px;
    text-align: center;
  }
  .grade-filter button {
    margin-right: 8px;
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    background: #e5e7eb;
    font-weight: bold;
    cursor: pointer;
  }
  .grade-filter button.active {
    background: #3b82f6;
    color: white;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    font-size: 14px;
  }
  
  thead th {
    background: #f3f4f6;
    padding: 12px;
    text-align: center;
    font-weight: bold;
  }
  
  tbody td {
    padding: 10px;
    text-align: center;
  }
  
  input,
  select {
    padding: 5px;
    font-size: 13px;
    width: 100px;
  }
  
  button {
    padding: 6px 12px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  button:hover {
    background-color: #2563eb;
  }
  
  .empty-message {
    color: #888;
    text-align: center;
    margin-top: 20px;
  }
  </style>