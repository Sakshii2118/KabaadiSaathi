import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendOtp, verifyOtp, registerCitizen } from '../../api/authApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import OtpInput from '../../components/OtpInput.jsx'
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'

export default function CitizenAuthPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [step, setStep] = useState('mobile') // mobile | otp | register
    const [mobile, setMobile] = useState('')
    const [otp, setOtp] = useState('')
    const [form, setForm] = useState({ name: '', addressLine1: '', addressLine2: '', pincode: '', preferredLanguage: 'en' })
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const startCountdown = () => {
        setCountdown(30)
        const t = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000)
    }

    const handleSendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error('Enter valid 10-digit mobile')
        setLoading(true)
        try {
            await sendOtp(mobile, 'CITIZEN')
            toast.success(t('toast.otpSent'))
            setStep('otp')
            startCountdown()
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6) return toast.error('Enter complete OTP')
        setLoading(true)
        try {
            const res = await verifyOtp(mobile, otp, 'CITIZEN')
            const data = res.data.data
            toast.success(t('toast.otpVerified'))
            if (data.isNewUser) { setStep('register') }
            else {
                login(data.token, { userType: 'CITIZEN', name: data.name, userId: data.userId })
                navigate('/citizen/dashboard')
            }
        } catch (e) { toast.error(e.response?.data?.message || t('toast.invalidOtp')) }
        finally { setLoading(false) }
    }

    const handleRegister = async () => {
        if (!form.name.trim()) return toast.error('Name is required')
        if (!form.addressLine1.trim()) return toast.error('Address Line 1 is required')
        if (!/^\d{6}$/.test(form.pincode)) return toast.error('Pincode must be 6 digits')
        setLoading(true)
        try {
            const res = await registerCitizen({ ...form, mobile })
            const data = res.data.data
            toast.success(t('toast.registered'))
            login(data.token, { userType: 'CITIZEN', name: data.name, userId: data.userId, wasteRecyclerId: data.wasteRecyclerId })
            navigate('/citizen/dashboard')
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0d1117, #1a2a1a)', padding: '1.5rem' }}>
            <div style={{ position: 'fixed', top: '1rem', right: '1rem' }}><LanguageSwitcher /></div>
            <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: 440 }}>
                <button className="btn btn-ghost" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
                    <FiArrowLeft /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>🧑‍🦱</span>
                    <div>
                        <h2 style={{ fontWeight: 700, fontSize: '1.3rem' }}>{t('landing.citizen')}</h2>
                        <p className="text-muted">{step === 'mobile' ? 'Enter your mobile' : step === 'otp' ? 'Enter the OTP' : 'Complete registration'}</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'mobile' && (
                        <motion.div key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="input-group">
                                <label>{t('auth.mobile')}</label>
                                <input className="input" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit number" maxLength={10} />
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" onClick={handleSendOtp} disabled={loading}>{loading ? '...' : t('auth.sendOtp')}</button>
                        </motion.div>
                    )}
                    {step === 'otp' && (
                        <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className="text-muted" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>OTP sent to {mobile}</p>
                            <OtpInput value={otp} onChange={setOtp} />
                            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.5rem' }} onClick={handleVerifyOtp} disabled={loading}>{loading ? '...' : t('auth.verifyOtp')}</button>
                            <p className="text-muted" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                                {countdown > 0 ? `Resend in ${countdown}s` : <span style={{ color: 'var(--primary-light)', cursor: 'pointer' }} onClick={handleSendOtp}>{t('auth.resend')}</span>}
                            </p>
                        </motion.div>
                    )}
                    {step === 'register' && (
                        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="input-group"><label>{t('auth.name')}</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                            <div className="input-group"><label>{t('auth.address1')}</label><input className="input" value={form.addressLine1} onChange={e => setForm(p => ({ ...p, addressLine1: e.target.value }))} /></div>
                            <div className="input-group"><label>{t('auth.address2')}</label><input className="input" value={form.addressLine2} onChange={e => setForm(p => ({ ...p, addressLine2: e.target.value }))} /></div>
                            <div className="input-group"><label>{t('auth.pincode')} *</label><input className="input" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} maxLength={6} placeholder="6-digit pincode" /></div>
                            <div className="input-group">
                                <label>{t('auth.language')}</label>
                                <select className="input" value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                                    <option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option><option value="ta">தமிழ்</option><option value="mr">मराठी</option>
                                </select>
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" onClick={handleRegister} disabled={loading}>{loading ? '...' : t('auth.register')}</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
