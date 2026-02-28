import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiRefreshCw } from 'react-icons/fi'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect } from 'react'

export default function LandingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { auth } = useAuth()

    useEffect(() => {
        if (auth?.userType === 'CITIZEN') navigate('/citizen/dashboard')
        else if (auth?.userType === 'KABADI') navigate('/kabadi/dashboard')
        else if (auth?.userType === 'ADMIN') navigate('/admin/dashboard')
    }, [auth, navigate])

    return (
        <div className="page" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2a1a 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem' }}>
                <LanguageSwitcher />
            </div>

            {/* Hero */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>♻️</div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                        {t('landing.title')}
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: 480 }}>
                        {t('landing.tagline')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                    style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    <CTA
                        icon="🧑‍🦱"
                        label={t('landing.citizen')}
                        onClick={() => navigate('/auth/citizen')}
                        gradient="linear-gradient(135deg, #2E7D32, #1B5E20)"
                    />
                    <CTA
                        icon="🛒"
                        label={t('landing.kabadi')}
                        onClick={() => navigate('/auth/kabadi')}
                        gradient="linear-gradient(135deg, #FFC107, #F57F17)"
                        dark
                    />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
                >
                    Admin? <span style={{ color: 'var(--primary-light)', cursor: 'pointer' }} onClick={() => navigate('/admin')}>Login here →</span>
                </motion.p>
            </div>

            {/* Wave SVG */}
            <svg viewBox="0 0 1440 80" style={{ display: 'block', marginTop: 'auto' }}>
                <path fill="rgba(46,125,50,0.12)" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
            </svg>
        </div>
    )
}

function CTA({ icon, label, onClick, gradient, dark }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                background: gradient, border: 'none', borderRadius: 16, padding: '2rem 3rem',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'box-shadow 0.2s',
            }}
        >
            <span style={{ fontSize: '2.5rem' }}>{icon}</span>
            <span style={{ color: dark ? '#222' : '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{label}</span>
        </motion.button>
    )
}
