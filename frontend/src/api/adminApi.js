import api from './axiosConfig.js'

export const getAdminOverview = () => api.get('/admin/overview')
export const getAdminUsers = () => api.get('/admin/users')
export const getAdminKabadis = () => api.get('/admin/kabadis')
export const getAdminTransactions = () => api.get('/admin/transactions')
export const getAdminConfig = () => api.get('/admin/config')
export const updateAdminConfig = (key, value) => api.put('/admin/config', { key, value })
