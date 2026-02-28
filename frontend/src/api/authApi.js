import api from './axiosConfig.js'

export const sendOtp = (mobile, userType) => api.post('/auth/send-otp', { mobile, userType })
export const verifyOtp = (mobile, otp, userType) => api.post('/auth/verify-otp', { mobile, otp, userType })
export const registerCitizen = (data) => api.post('/auth/register/citizen', data)
export const registerKabadi = (data) => api.post('/auth/register/kabadi', data)
export const adminLogin = (data) => api.post('/auth/admin/login', data)
