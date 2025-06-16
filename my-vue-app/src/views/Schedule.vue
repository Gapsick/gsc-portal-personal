<template>
  <br>
  <div class="schedule-container">
    <div class="schedule-title">
      <h1>SCHEDULE</h1>
      <div class="schedule-subtitle">스케줄</div>
    </div>

    <div class="content-container">
      <!-- 좌측: 일정 리스트 -->
      <div class="schedule-list">
        <div class="month-selector">
          <button @click="prevMonth" class="month-nav">
            <span class="nav-circle">＜</span>
          </button>
          <h2 class="current-month">{{ currentYear }}년 {{ currentMonth }}월</h2>
          <button @click="nextMonth" class="month-nav">
            <span class="nav-circle">＞</span>
          </button>
        </div>

        <div v-for="date in sortedDates" :key="date" class="schedule-item" :id="'event-' + date">
          <div class="date-column">
            <div class="date-number">{{ getDayFromDate(date) }}</div>
            <div class="date-day">{{ getDayOfWeekFromDate(date) }}</div>
          </div>
          <div class="events-column">
            <div v-for="event in eventsByDate[date]" :key="event.id" class="event-item" @click="openModal(event)">
              <div class="event-time" v-if="event.start">{{ formatTime(event.start) }}</div>
              <div class="event-title">{{ event.title }}</div>
              <div class="event-type-badge" v-if="getEventType(event) !== '기타'">{{ getEventType(event) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 달력 -->
      <div class="calendar-container">
        <div class="calendar-header">
          {{ currentYear }}년 {{ currentMonth }}월
        </div>
        <div class="calendar">
          <div class="calendar-weekdays">
            <div v-for="day in ['일','월','화','수','목','금','토']" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>
          <div class="calendar-days">
            <div
              v-for="day in days"
              :key="day"
              class="calendar-day"
              :class="{ 'has-event': hasEvent(day) }"
              @click="scrollToEvent(day)"
            >
              <span class="day-number">{{ day }}</span>
              <div class="event-indicators" v-if="hasEvent(day)">
                <div
                  v-for="(event, index) in getEventsForDay(day)"
                  :key="index"
                  class="event-indicator"
                  :style="{ backgroundColor: getEventColor(event) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <h2>{{ selectedEvent?.title }}</h2>
        <p><strong>날짜:</strong> {{ formatDate(selectedEvent?.start) }}</p>
        <p v-if="selectedEvent?.start.includes('T')"><strong>시간:</strong> {{ formatTime(selectedEvent?.start) }}</p>
        <p><strong>설명:</strong> {{ selectedEvent?.description || "설명 없음" }}</p>
        <button @click="showModal = false" class="close-button">닫기</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Schedule",
  data() {
    return {
      calendarId: "c_30f3f7b040f8956812ff3902e0725752aa5b4ab176a7fd02f4d8327f0ee4179d@group.calendar.google.com",
      events: [],
      showModal: false,
      selectedEvent: null,
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
    };
  },
  computed: {
    eventsByDate() {
      return this.events.reduce((acc, event) => {
        const date = event.start.split("T")[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
      }, {});
    },
    days() {
      const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    },
    sortedDates() {
      return Object.keys(this.eventsByDate).sort();
    }
  },
  methods: {
    async fetchGoogleCalendarEvents() {
      const accessToken = localStorage.getItem("googleAccessToken");
      if (!accessToken) {
        console.warn("⚠️ Google Access Token이 없음");
        return;
      }

      const timeMin = `${this.currentYear}-${String(this.currentMonth).padStart(2, "0")}-01T00:00:00Z`;
      const timeMax = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, "0")}-01T00:00:00Z`;

      try {
        const response = await axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        this.events = response.data.items.map(event => ({
          id: event.id,
          title: event.summary,
          start: event.start.date || event.start.dateTime,
          end: event.end.date || event.end.dateTime,
          description: event.description || "설명 없음",
        }));
      } catch (error) {
        console.error("❌ 일정 불러오기 실패:", error.response?.data || error.message);
      }
    },

    scrollToEvent(day) {
      const date = this.getFormattedDate(day);
      const element = document.getElementById(`event-${date}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },

    openModal(event) {
      this.selectedEvent = event;
      this.showModal = true;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date)) return dateString;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
      return `${month}월 ${day}일 (${dayOfWeek})`;
    },

    formatTime(dateTimeString) {
      if (!dateTimeString || !dateTimeString.includes('T')) return '';
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    },

    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentYear--;
        this.currentMonth = 12;
      } else {
        this.currentMonth--;
      }
      this.fetchGoogleCalendarEvents();
    },

    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentYear++;
        this.currentMonth = 1;
      } else {
        this.currentMonth++;
      }
      this.fetchGoogleCalendarEvents();
    },

    getFormattedDate(day) {
      return `${this.currentYear}-${String(this.currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },

    getDayFromDate(dateString) {
      const date = new Date(dateString);
      return date.getDate();
    },

    getDayOfWeekFromDate(dateString) {
      const date = new Date(dateString);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[date.getDay()];
    },

    getEventType(event) {
      if (event.title.includes('라디오')) return '라디오';
      if (event.title.includes('PARTY')) return '이벤트';
      return '기타';
    },

    // 새로 추가된 메서드들
    hasEvent(day) {
      const date = this.getFormattedDate(day);
      return !!this.eventsByDate[date];
    },

    getEventsForDay(day) {
      const date = this.getFormattedDate(day);
      return this.eventsByDate[date] || [];
    },

    getEventColor(event) {
      // 이벤트 타입에 따른 색상 지정
      if (event.title.includes('라디오')) return '#4299e1';
      if (event.title.includes('PARTY')) return '#48bb78';
      return '#3b82f6';
    }
  },
  mounted() {
    this.fetchGoogleCalendarEvents();
  },
};
</script>

<style scoped>
.schedule-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #fff;
}

.schedule-title {
  text-align: center;
  margin: 40px 0 60px;
}

.schedule-title h1 {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 8px;
  color: #333;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  margin: 0;
}

.schedule-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;
  align-items: start;
}

/* 월 선택 */
.month-selector {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin: 0 0 24px 20px;
}

.current-month {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 달력 헤더 */
.calendar-header {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

/* 일정 리스트 */
.schedule-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  scroll-margin-top: 20px;
}

.date-column {
  width: 80px;
  text-align: center;
  padding-right: 20px;
}

.date-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.date-day {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.events-column {
  flex: 1;
}

.event-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-item:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.event-time {
  font-size: 14px;
  color: #3b82f6;
  margin-bottom: 4px;
}

.event-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.event-type-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e0f2fe;
  color: #0284c7;
  border-radius: 12px;
  font-size: 12px;
}

/* 달력 */
.calendar-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 20px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.weekday {
  font-size: 13px;
  color: #666;
  padding: 8px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.calendar-day:hover {
  background: #f1f5f9;
}

.calendar-day.has-event {
  background: #e0f2fe;
  border-color: #3b82f6;
}

.day-number {
  font-size: 14px;
  color: #333;
}

.event-indicators {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
}

.event-indicator {
  height: 3px;
  flex: 1;
  background: #3b82f6;
  border-radius: 1.5px;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: #2563eb;
}

/* 네비게이션 버튼 */
.month-nav {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.nav-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 16px;
  transition: all 0.2s ease;
}

.nav-circle:hover {
  background: #2563eb;
  transform: scale(1.1);
}
</style>
  
  