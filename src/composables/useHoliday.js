import axios from 'axios'
import { ref } from 'vue'

export function useHoliday() {
  const holidays = ref([])

  async function fetchHolidays(year, month) {
    try {
      const response = await axios.get(`/api/holidays?year=${year}&month=${month}`)
      holidays.value = response.data
    } catch (e) {
      console.error('공휴일 정보를 불러오지 못했습니다:', e)
    }
  }

  function isHoliday(date) {
    return holidays.value.some(h => h.date === date)
  }

  return {
    holidays,
    fetchHolidays,
    isHoliday
  }
}
