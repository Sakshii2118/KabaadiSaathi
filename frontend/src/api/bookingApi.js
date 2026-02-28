import api from './axiosConfig.js'

export const createBooking = (data) => api.post('/bookings', data)
export const getCitizenBookings = () => api.get('/bookings/citizen')
export const getKabadiBookings = () => api.get('/bookings/kabadi')
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status })
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data)
export const cancelBooking = (id) => api.delete(`/bookings/${id}`)

