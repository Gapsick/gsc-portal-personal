<template>
  <div class="admin-dashboard">
    <h2>관리자 대시보드</h2>

    <!-- ✅ 섹션: 회원 -->
    <div class="section">
      <div class="section-header" @click="toggle('users')">
        <h3>👤 회원 승인 관리</h3>
        <span>{{ open.users ? '▲' : '▼' }}</span>
      </div>
      <transition name="slide">
        <div v-if="open.users" class="section-box">
          <ManageUsers />
        </div>
      </transition>
    </div>

    <!-- ✅ 학생 정보 관리 섹션 -->
    <div class="section">
      <div class="section-header" @click="toggle('students')">
        <h3>📋 학생 정보 관리</h3>
        <span>{{ open.students ? '▲' : '▼' }}</span>
      </div>
      <transition name="slide">
        <div v-if="open.students" class="section-box">
          <ManageStudents />
        </div>
      </transition>
    </div>

    <!-- ✅ 섹션: 과목 -->
    <div class="section">
      <div class="section-header" @click="toggle('subjects')">
        <h3>📚 과목 관리</h3>
        <span>{{ open.subjects ? '▲' : '▼' }}</span>
      </div>
      <transition name="slide">
        <div v-if="open.subjects" class="section-box">
          <ManageSubjects />
        </div>
      </transition>
    </div>

    <!-- ✅ 섹션: 시간표 -->
    <div class="section">
      <div class="section-header" @click="toggle('timetable')">
        <h3>📅 시간표 관리</h3>
        <span>{{ open.timetable ? '▲' : '▼' }}</span>
      </div>
      <transition name="slide">
        <div v-if="open.timetable" class="section-box">
          <ManageTimetable />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

// 각 섹션의 열림 상태
const open = reactive({
  users: false,
  subjects: false,
  timetable: false,
  students: false,
})

function toggle(section) {
  open[section] = !open[section]
}

// 🧩 하위 컴포넌트 import
import ManageUsers from './ManageUsers.vue'
import ManageSubjects from './ManageSubjects.vue'
import ManageTimetable from './ManageTimetable.vue'
import ManageStudents from './ManageStudents.vue'
</script>

<style scoped>
.admin-dashboard {
  max-width: 1000px;
  margin: 100px auto;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
  color: #1f2937;
}

.section {
  margin-bottom: 16px;
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3f4f6;
  padding: 14px 18px;
  cursor: pointer;
  font-weight: bold;
  color: #374151;
  transition: background 0.2s;
}

.section-header:hover {
  background-color: #e5e7eb;
}

.section-box {
  padding: 20px;
  background-color: #fafafa;
  animation: fadeIn 0.3s ease;
  border-top: 1px solid #eee;
}

/* 트랜지션 */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
}
</style>
