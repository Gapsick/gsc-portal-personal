<template>
    <div class="modal-overlay">
      <div class="modal">
        <h3>📚 겹치는 특강 목록</h3>
  
        <div v-if="classes.length === 0">
          겹치는 수업이 없습니다.
        </div>
  
        <div
          v-for="cls in classes"
          :key="cls.id"
          class="class-item"
          @click="editClass(cls)"
        >
          <strong>{{ cls.subject_name }}</strong>
          <div class="details">
            <span>{{ cls.professor }}</span> /
            <span>{{ cls.level }} / {{ cls.class_group }}반</span>
          </div>
          <div class="time">
            {{ cls.start_period }}교시 ~ {{ cls.end_period }}교시
          </div>
        </div>
  
        <div class="actions">
          <button @click="$emit('close')">닫기</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    classes: Array
  })
  
  const emit = defineEmits(['edit', 'close'])
  
  function editClass(cls) {
    emit('edit', cls)
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .modal {
    background: white;
    padding: 20px;
    border-radius: 12px;
    width: 360px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  h3 {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: bold;
    color: #1f2937;
    text-align: center;
  }
  
  .class-item {
    padding: 12px;
    margin-bottom: 10px;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .class-item:hover {
    background-color: #e5f3ff;
  }
  
  .details {
    font-size: 13px;
    color: #374151;
    margin-top: 4px;
  }
  .time {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
  
  .actions {
    text-align: center;
    margin-top: 16px;
  }
  .actions button {
    padding: 8px 20px;
    border-radius: 8px;
    background-color: #2563eb;
    color: white;
    font-weight: 500;
    border: none;
    font-size: 14px;
  }
  .actions button:hover {
    background-color: #1d4ed8;
  }
  </style>
  