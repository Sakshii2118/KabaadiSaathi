import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminLogin } from '../../api/authApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { motion } from 'framer-motion'

export default function AdminLogin() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        try {
            const res = await adminLogin(form)
            const data = res.data.data
            login(data.token, { userType: 'ADMIN', name: data.name })
            navigate('/admin/dashboard')
        } catch (e) { toast.error(e.response?.data?.message || 'Invalid credentials') }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', padding: '1.5rem' }}>
            <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: 380 }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>🔐</div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginTop: '0.5rem' }}>{t('admin.login')}</h2>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Kabadi Admin Portal</p>
                </div>
                <div className="input-group"><label>{t('admin.username')}</label><input className="input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></div>
                <div className="input-group"><label>{t('admin.password')}</label><input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleLogin()} /></div>
                <button className="btn btn-primary btn-full btn-lg" onClick={handleLogin} disabled={loading}>{loading ? '...' : t('admin.login')}</button>
            </motion.div>
        </div>
    )
}
