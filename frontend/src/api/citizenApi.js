import api from './axiosConfig.js'

export const getCitizenProfile = () => api.get('/citizen/profile')
export const updateCitizenProfile = (data) => api.put('/citizen/profile', data)
export const getCitizenDashboard = (filter) => api.get('/citizen/dashboard', { params: { filter } })
export const getCitizenTransactions = (filter) => api.get('/citizen/transactions', { params: { filter } })
export const updateCitizenLanguage = (language) => api.put('/citizen/language', { language })
