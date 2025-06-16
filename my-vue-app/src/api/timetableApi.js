import axios from 'axios'

const BASE = 'http://localhost:5000/api'

// ✅ 학년 + 날짜 기반 시간표 조회
export const getTimetableByGradeAndDate = async (grade, date) => {
  const res = await axios.get(`${BASE}/timetable/${grade}/date/${date}`)
  return res.data
}

// ✅ 사용자 ID 기반 시간표 조회 (학생용)
// 날짜도 같이 넘기도록 수정 (백엔드 경로와 맞춤)
export const getTimetableByUserId = async (userId, date) => {
  const res = await axios.get(`${BASE}/timetable/user/${userId}/date/${date}`)
  return res.data
}

export const addTimetable = (data) =>
  axios.post(BASE, data)

export const updateTimetable = (id, data) =>
  axios.put(`${BASE}/${id}`, data)

export const deleteTimetable = (id) =>
  axios.delete(`${BASE}/${id}`)
