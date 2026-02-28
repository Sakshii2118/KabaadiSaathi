import api from './axiosConfig.js'

export const getKabadiProfile = () => api.get('/kabadi/profile')
export const updateKabadiProfile = (data) => api.put('/kabadi/profile', data)
export const getKabadiDashboard = (filter) => api.get('/kabadi/dashboard', { params: { filter } })
export const getKabadiTransactions = (filter) => api.get('/kabadi/transactions', { params: { filter } })
export const getKCoins = () => api.get('/kabadi/kcoins')
export const redeemKCoins = (data) => api.post('/kabadi/kcoins/redeem', data)
export const getPriorityKabadi = (lat, lng) => api.get('/kabadi/priority', { params: { lat, lng } })
export const getNearbyKabadi = (lat, lng, radius) => api.get('/kabadi/nearby', { params: { lat, lng, radius } })
export const logTransaction = (data) => api.post('/transactions', data)
export const updateKabadiLanguage = (language) => api.put('/kabadi/language', { language })
