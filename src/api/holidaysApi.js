import axios from 'axios';

const BASE = 'http://localhost:5000/api/holidays';

export const addHoliday = (data) =>
  axios.post(BASE, data);

export const deleteHoliday = (data) =>
  axios.delete(BASE, { data });

export const getHolidays = () =>
  axios.get(BASE);
