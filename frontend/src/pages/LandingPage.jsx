import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { sendOtp, verifyOtp, registerCitizen, registerKabadi, adminLogin } from '../api/authApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect } from 'react'
import OtpInput from '../components/OtpInput.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'

const ROLES = [
    { id: 'CITIZEN', icon: '🧑‍🦱', label: 'Citizen', color: '#2E7D32' },
    { id: 'KABADI', icon: '🛒', label: 'Kabadi-wala', color: '#F57F17' },
    { id: 'ADMIN', icon: '🛡️', label: 'Admin', color: '#1565C0' },
]

export default function LandingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { auth, login } = useAuth()
    const [role, setRole] = useState(null)       // CITIZEN | KABADI | ADMIN
    const [step, setStep] = useState('role')     // role | mobile | otp | register
    const [mobile, setMobile] = useState('')
    const [otp, setOtp] = useState('')
    const [adminForm, setAdminForm] = useState({ username: '', password: '' })
    const [regForm, setRegForm] = useState({ name: '', addressLine1: '', addressLine2: '', pincode: '', area: '', preferredLanguage: 'en' })
    const [regErrors, setRegErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (auth?.userType === 'CITIZEN') navigate('/citizen/dashboard')
        else if (auth?.userType === 'KABADI') navigate('/kabadi/dashboard')
        else if (auth?.userType === 'ADMIN') navigate('/admin/dashboard')
    }, [auth, navigate])

    const startCountdown = () => {
        setCountdown(30)
        const id = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000)
    }

    const selectRole = (r) => {
        setRole(r)
        setStep(r === 'ADMIN' ? 'admin' : 'mobile')
        setMobile('')
        setOtp('')
        setAdminForm({ username: '', password: '' })
        setRegForm({ name: '', addressLine1: '', addressLine2: '', pincode: '', area: '', preferredLanguage: 'en' })
        setRegErrors({})
    }

    // ── Admin Login ───────────────────────────────────────────────
    const handleAdminLogin = async () => {
        if (!adminForm.username.trim() || !adminForm.password.trim())
            return toast.error('Username and password required')
        setLoading(true)
        try {
            const res = await adminLogin(adminForm)
            const data = res.data.data
            login(data.token, { userType: 'ADMIN', name: data.name })
            navigate('/admin/dashboard')
        } catch { toast.error('Invalid credentials') }
        finally { setLoading(false) }
    }

    // ── OTP flow ──────────────────────────────────────────────────
    const handleSendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error('Enter valid 10-digit mobile')
        setLoading(true)
        try {
            await sendOtp(mobile, role)
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
            const res = await verifyOtp(mobile, otp, role)
            const data = res.data.data
            toast.success(t('toast.otpVerified'))
            if (data.isNewUser) {
                setStep('register')
            } else {
                login(data.token, { userType: role, name: data.name, userId: data.userId })
                navigate(role === 'CITIZEN' ? '/citizen/dashboard' : '/kabadi/dashboard')
            }
        } catch (e) { toast.error(e.response?.data?.message || t('toast.invalidOtp')) }
        finally { setLoading(false) }
    }

    // ── Registration ──────────────────────────────────────────────
    const validateReg = () => {
        const e = {}
        if (!regForm.name.trim()) e.name = 'Name is required'
        // Both CITIZEN and KABADI require addressLine1 and pincode
        if (!regForm.addressLine1.trim()) e.addressLine1 = 'Address Line 1 is required'
        if (!regForm.pincode.trim()) e.pincode = 'Pincode is required'
        else if (!/^\d{6}$/.test(regForm.pincode)) e.pincode = 'Must be 6 digits'
        setRegErrors(e)
        return Object.keys(e).length === 0
    }

    const handleRegister = async () => {
        if (!validateReg()) return
        setLoading(true)
        try {
            let res
            if (role === 'CITIZEN') {
                res = await registerCitizen({ ...regForm, mobile })
                const d = res.data.data
                login(d.token, { userType: 'CITIZEN', name: d.name, userId: d.userId, wasteRecyclerId: d.wasteRecyclerId })
                navigate('/citizen/dashboard')
            } else {
                res = await registerKabadi({
                    name: regForm.name,
                    area: regForm.area,
                    addressLine1: regForm.addressLine1,
                    addressLine2: regForm.addressLine2,
                    pincode: regForm.pincode,
                    preferredLanguage: regForm.preferredLanguage,
                    mobile
                })
                const d = res.data.data
                login(d.token, { userType: 'KABADI', name: d.name, userId: d.userId })
                navigate('/kabadi/dashboard')
            }
            toast.success(t('toast.registered'))
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const roleColor = ROLES.find(r => r.id === role)?.color || '#2E7D32'

    const stepTitle = {
        role: 'Welcome to KabadiSaathi',
        admin: 'Admin Login',
        mobile: `${ROLES.find(r => r.id === role)?.label || ''} — Enter Mobile`,
        otp: 'Enter OTP',
        register: 'Complete Registration',
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d1117 0%, #1a2a1a 100%)', padding: '1.5rem',
            flexDirection: 'column', gap: '1.5rem'
        }}>
            <div style={{ position: 'fixed', top: '1rem', right: '1rem' }}><LanguageSwitcher /></div>

            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem' }}>♻️</div>
                <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.8rem', margin: '0.25rem 0 0' }}>KabadiSaathi</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>Smart Waste Recycling Platform</p>
            </motion.div>

            {/* Card */}
            <motion.div className="card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: 460, borderTop: `3px solid ${roleColor}` }}>

                {/* Back button */}
                {step !== 'role' && (
                    <button className="btn btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}
                        onClick={() => { setStep(role === 'ADMIN' ? 'role' : step === 'otp' ? 'mobile' : step === 'register' ? 'otp' : 'role'); if (step === 'admin' || step === 'mobile') setRole(null) }}>
                        ← Back
                    </button>
                )}

                <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>{stepTitle[step]}</h2>

                <AnimatePresence mode="wait">

                    {/* ── Step: Choose Role ── */}
                    {step === 'role' && (
                        <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                                Select who you are to continue:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ROLES.map(r => (
                                    <label key={r.id} onClick={() => selectRole(r.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '1rem 1.25rem', borderRadius: 12, cursor: 'pointer',
                                            border: `2px solid ${role === r.id ? r.color : 'var(--border)'}`,
                                            background: role === r.id ? `${r.color}18` : 'var(--bg-card-2)',
                                            transition: 'all 0.18s'
                                        }}>
                                        {/* Custom checkbox */}
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                            border: `2px solid ${role === r.id ? r.color : 'var(--border)'}`,
                                            background: role === r.id ? r.color : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.15s'
                                        }}>
                                            {role === r.id && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800 }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '1.6rem' }}>{r.icon}</span>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{r.label}</p>
                                            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                {r.id === 'ADMIN' ? 'Enter username & password' : 'Login with mobile OTP'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step: Admin credentials ── */}
                    {step === 'admin' && (
                        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>Username</label>
                                <input className="input" placeholder="admin" value={adminForm.username}
                                    onChange={e => setAdminForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Password</label>
                                <input className="input" type="password" placeholder="••••••••" value={adminForm.password}
                                    onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" onClick={handleAdminLogin} disabled={loading}>
                                {loading ? '...' : '🛡️ Login as Admin'}
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step: Enter mobile ── */}
                    {step === 'mobile' && (
                        <motion.div key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>{t('auth.mobile')}</label>
                                <input className="input" value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    placeholder="10-digit mobile number" maxLength={10}
                                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" onClick={handleSendOtp} disabled={loading}>
                                {loading ? '...' : t('auth.sendOtp')}
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step: OTP ── */}
                    {step === 'otp' && (
                        <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                                OTP sent to <strong>{mobile}</strong>
                            </p>
                            <OtpInput value={otp} onChange={setOtp} />
                            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.5rem' }}
                                onClick={handleVerifyOtp} disabled={loading}>
                                {loading ? '...' : t('auth.verifyOtp')}
                            </button>
                            <p className="text-muted" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                                {countdown > 0
                                    ? `Resend in ${countdown}s`
                                    : <span style={{ color: 'var(--primary-light)', cursor: 'pointer' }} onClick={handleSendOtp}>{t('auth.resend')}</span>}
                            </p>
                        </motion.div>
                    )}

                    {/* ── Step: Register ── */}
                    {step === 'register' && (
                        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* Name */}
                            <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                <label>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input className="input" value={regForm.name}
                                    onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                                    style={regErrors.name ? { borderColor: 'var(--danger)' } : {}} />
                                {regErrors.name && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{regErrors.name}</p>}
                            </div>

                            {/* Citizen-specific fields */}
                            {role === 'CITIZEN' && <>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Address Line 1 <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input className="input" value={regForm.addressLine1}
                                        onChange={e => setRegForm(p => ({ ...p, addressLine1: e.target.value }))}
                                        style={regErrors.addressLine1 ? { borderColor: 'var(--danger)' } : {}} />
                                    {regErrors.addressLine1 && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{regErrors.addressLine1}</p>}
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Address Line 2 <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                                    <input className="input" value={regForm.addressLine2}
                                        onChange={e => setRegForm(p => ({ ...p, addressLine2: e.target.value }))} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Pincode <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input className="input" value={regForm.pincode} maxLength={6} placeholder="6-digit pincode"
                                        onChange={e => setRegForm(p => ({ ...p, pincode: e.target.value }))}
                                        style={regErrors.pincode ? { borderColor: 'var(--danger)' } : {}} />
                                    {regErrors.pincode && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{regErrors.pincode}</p>}
                                </div>
                            </>}

                            {/* Kabadi-specific fields — address is also required for kabadi */}
                            {role === 'KABADI' && <>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Address Line 1 <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input className="input" value={regForm.addressLine1} placeholder="House/Street/Colony"
                                        onChange={e => setRegForm(p => ({ ...p, addressLine1: e.target.value }))}
                                        style={regErrors.addressLine1 ? { borderColor: 'var(--danger)' } : {}} />
                                    {regErrors.addressLine1 && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{regErrors.addressLine1}</p>}
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Address Line 2 <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                                    <input className="input" value={regForm.addressLine2} placeholder="Landmark, Area"
                                        onChange={e => setRegForm(p => ({ ...p, addressLine2: e.target.value }))} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Pincode <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input className="input" value={regForm.pincode} maxLength={6} placeholder="6-digit pincode"
                                        onChange={e => setRegForm(p => ({ ...p, pincode: e.target.value }))}
                                        style={regErrors.pincode ? { borderColor: 'var(--danger)' } : {}} />
                                    {regErrors.pincode && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{regErrors.pincode}</p>}
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                                    <label>Working Area / Town <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                                    <input className="input" value={regForm.area} placeholder="e.g. Lajpat Nagar"
                                        onChange={e => setRegForm(p => ({ ...p, area: e.target.value }))} />
                                </div>
                            </>}

                            {/* Language */}
                            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                <label>{t('auth.language')}</label>
                                <select className="input" value={regForm.preferredLanguage}
                                    onChange={e => setRegForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="bn">বাংলা</option>
                                    <option value="ta">தமிழ்</option>
                                    <option value="mr">मराठी</option>
                                </select>
                            </div>

                            <button className="btn btn-primary btn-full btn-lg" onClick={handleRegister} disabled={loading}>
                                {loading ? '...' : t('auth.register')}
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </motion.div>
        </div>
    )
}
