const express = require("express")
const router = express.Router()
const { google } = require("googleapis")
require("dotenv").config()

const {
  GSC_CLIENT_ID,
  GSC_CLIENT_SECRET,
  GSC_REFRESH_TOKEN,
  GSC_CALENDAR_ID
} = process.env

router.post("/add", async (req, res) => {
  const { summary, description, start, end } = req.body

  const oauth2Client = new google.auth.OAuth2(
    GSC_CLIENT_ID,
    GSC_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: GSC_REFRESH_TOKEN })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  // 🟨 start, end가 dateTime인지 date인지 구분
  const event = {
    summary,
    description,
    start: {},
    end: {}
  }

  if (start.dateTime && end.dateTime) {
    event.start.dateTime = start.dateTime
    event.start.timeZone = "Asia/Seoul"
    event.end.dateTime = end.dateTime
    event.end.timeZone = "Asia/Seoul"
  } else if (start.date && end.date) {
    event.start.date = start.date
    event.end.date = end.date
  } else {
    return res.status(400).json({ message: "Invalid start/end format" })
  }

  try {
    const response = await calendar.events.insert({
      calendarId: GSC_CALENDAR_ID,
      requestBody: event
    })

    res.json({ success: true, eventId: response.data.id })
  } catch (error) {
    console.error("❌ Google Calendar 등록 실패:", error.response?.data || error.message)
    res.status(500).json({ success: false, message: "일정 등록 실패", error })
  }
})


module.exports = router
