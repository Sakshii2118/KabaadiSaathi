import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendOtp, verifyOtp, registerKabadi } from '../../api/authApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import OtpInput from '../../components/OtpInput.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import i18n from '../../i18n/i18n.js'
import backgrImg from '../../components/backgr.jpeg'

const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'mr', label: 'मराठी' },
]

const leafPaths = [
    "M10,30 Q20,0 30,30 Q20,60 10,30Z",
    "M5,25 Q15,5 25,25 Q15,45 5,25Z",
    "M8,20 Q22,2 28,20 Q22,38 8,20Z",
    "M6,28 Q18,4 30,28 Q18,52 6,28Z",
    "M4,22 Q16,2 26,22 Q16,42 4,22Z",
]

export default function KabadiAuthPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [step, setStep] = useState('mobile')
    const [mobile, setMobile] = useState('')
    const [otp, setOtp] = useState('')
    const [form, setForm] = useState({ name: '', area: '', addressLine1: '', addressLine2: '', pincode: '', preferredLanguage: 'en' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [langOpen, setLangOpen] = useState(false)

    const currentLang = i18n.language?.slice(0, 2) || 'en'
    const currentLangLabel = LANGS.find(l => l.code === currentLang)?.label || 'English'

    const handleLangChange = (code) => {
        i18n.changeLanguage(code)
        localStorage.setItem('i18n_lang', code)
        setLangOpen(false)
    }

    const startCountdown = () => {
        setCountdown(30)
        const id = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000)
    }

    const handleSendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error('Enter valid 10-digit mobile')
        setLoading(true)
        try {
            await sendOtp(mobile, 'KABADI')
            toast.success(t('toast.otpSent'))
            setStep('otp'); startCountdown()
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6) return toast.error('Enter complete OTP')
        setLoading(true)
        try {
            const res = await verifyOtp(mobile, otp, 'KABADI')
            const data = res.data.data
            toast.success(t('toast.otpVerified'))
            if (data.isNewUser) setStep('register')
            else {
                login(data.token, { userType: 'KABADI', name: data.name, userId: data.userId })
                navigate('/kabadi/dashboard')
            }
        } catch (e) { toast.error(e.response?.data?.message || t('toast.invalidOtp')) }
        finally { setLoading(false) }
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required'
        if (!form.addressLine1.trim()) e.addressLine1 = 'Address Line 1 is required'
        if (!form.pincode.trim()) e.pincode = 'Pincode is required'
        else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Must be 6 digits'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleRegister = async () => {
        if (!validate()) return
        setLoading(true)
        try {
            const res = await registerKabadi({ ...form, mobile })
            const data = res.data.data
            toast.success(t('toast.registered'))
            login(data.token, { userType: 'KABADI', name: data.name, userId: data.userId })
            navigate('/kabadi/dashboard')
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const leafData = [
        { size: 85, color: 'rgba(116,198,157,0.50)', duration: 21, delay: 1, startX: '5%' },
        { size: 70, color: 'rgba(64,145,108,0.46)', duration: 17, delay: 4, startX: '18%' },
        { size: 95, color: 'rgba(116,198,157,0.48)', duration: 24, delay: 8, startX: '33%' },
        { size: 78, color: 'rgba(64,145,108,0.52)', duration: 19, delay: 2, startX: '52%' },
        { size: 52, color: 'rgba(116,198,157,0.45)', duration: 15, delay: 11, startX: '68%' },
        { size: 42, color: 'rgba(64,145,108,0.44)', duration: 13, delay: 6, startX: '80%' },
        { size: 65, color: 'rgba(116,198,157,0.50)', duration: 18, delay: 14, startX: '91%' },
        { size: 28, color: 'rgba(64,145,108,0.42)', duration: 14, delay: 9, startX: '15%' },
        { size: 22, color: 'rgba(116,198,157,0.40)', duration: 16, delay: 19, startX: '43%' },
        { size: 38, color: 'rgba(64,145,108,0.44)', duration: 13, delay: 3, startX: '62%' },
        { size: 20, color: 'rgba(116,198,157,0.42)', duration: 15, delay: 21, startX: '26%' },
        { size: 30, color: 'rgba(64,145,108,0.40)', duration: 17, delay: 15, startX: '74%' },
        { size: 18, color: 'rgba(116,198,157,0.38)', duration: 14, delay: 7, startX: '48%' },
        { size: 34, color: 'rgba(64,145,108,0.48)', duration: 20, delay: 12, startX: '93%' },
    ]

    const dustData = Array.from({ length: 22 }, (_, i) => ({
        left: `${Math.floor((i * 4.7 + 2) % 97)}%`,
        top: `${Math.floor((i * 7.1 + 4) % 95)}%`,
        size: 3 + (i % 5),
        duration: 6 + (i % 9),
        delay: (i * 0.55) % 12,
    }))

    const stepTitle = step === 'mobile' ? 'Enter your mobile' : step === 'otp' ? 'Enter OTP' : 'Complete registration'

    const Field = ({ label, field, mandatory, ...rest }) => (
        <div className="akp-input-group">
            <label className="akp-label">{label}{mandatory && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
            <input
                className={`akp-input${errors[field] ? ' akp-input-error' : ''}`}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                {...rest}
            />
            {errors[field] && <p className="akp-error-text">{errors[field]}</p>}
        </div>
    )

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap');

                :root {
                    --forest: #1B4332;
                    --emerald: #2D6A4F;
                    --mid-green: #40916C;
                    --sage: #74C69D;
                    --off-white: #F8F9F0;
                    --cream: #EEF2E6;
                    --charcoal: #1B2E22;
                    --danger: #e55b5b;
                    --accent: #FFC107;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .akp-root {
                    min-height: 100vh;
                    min-width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Inter', sans-serif;
                }

                /* Layer 0 — Dark overlay so backgr.jpeg shows through */
                .akp-bg-gradient {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 8, 3, 0.30);
                    z-index: 1;
                }

                /* Layer 1 — Blob orbs */
                .akp-blob {
                    position: fixed;
                    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
                    background: radial-gradient(circle, rgba(64,145,108,0.50) 0%, rgba(27,67,50,0.0) 70%);
                    filter: blur(40px);
                    z-index: 1;
                    pointer-events: none;
                    will-change: transform, border-radius;
                }
                .akp-blob-1 {
                    width: 400px; height: 400px;
                    top: -60px; left: -60px;
                    opacity: 0.48;
                    animation: akpBlobM1 11s ease-in-out infinite, akpBlobP1 10s ease-in-out infinite;
                }
                .akp-blob-2 {
                    width: 460px; height: 460px;
                    bottom: -90px; right: -70px;
                    opacity: 0.50;
                    animation: akpBlobM2 13s ease-in-out infinite, akpBlobP2 11s ease-in-out infinite;
                }
                .akp-blob-3 {
                    width: 340px; height: 340px;
                    top: 35%; right: 8%;
                    opacity: 0.45;
                    animation: akpBlobM3 9s ease-in-out infinite, akpBlobP3 9s ease-in-out infinite;
                }
                @keyframes akpBlobM1 {
                    0%, 100% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                    33% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                    66% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                }
                @keyframes akpBlobM2 {
                    0%, 100% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                    33% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                    66% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                }
                @keyframes akpBlobM3 {
                    0%, 100% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                    33% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                    66% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                }
                @keyframes akpBlobP1 {
                    0%, 100% { transform: scale(0.88) translateX(-18px) translateY(12px); }
                    50% { transform: scale(1.14) translateX(22px) translateY(-18px); }
                }
                @keyframes akpBlobP2 {
                    0%, 100% { transform: scale(1.08) translateX(14px) translateY(-14px); }
                    50% { transform: scale(0.90) translateX(-22px) translateY(18px); }
                }
                @keyframes akpBlobP3 {
                    0%, 100% { transform: scale(0.94) translateX(8px) translateY(18px); }
                    50% { transform: scale(1.08) translateX(-18px) translateY(-8px); }
                }

                /* Layer 2 — Canopy silhouettes */
                .akp-canopy {
                    position: fixed;
                    z-index: 2;
                    pointer-events: none;
                    opacity: 0.32;
                    animation: akpCanopySway 24s ease-in-out infinite alternate;
                    transform-origin: top center;
                }
                .akp-canopy-tl { top: -20px; left: -30px; }
                .akp-canopy-tr {
                    top: -20px; right: -30px;
                    animation: akpCanopySway2 28s ease-in-out infinite alternate;
                }
                .akp-canopy-bl { bottom: -30px; left: -20px; }
                @keyframes akpCanopySway {
                    from { transform: rotate(-2deg); }
                    to { transform: rotate(2deg); }
                }
                @keyframes akpCanopySway2 {
                    from { transform: scaleX(-1) rotate(1.5deg); }
                    to { transform: scaleX(-1) rotate(-3deg); }
                }

                /* Layer 3 — Floating leaves */
                @keyframes akpLeafRise {
                    0% { transform: translateX(0px) translateY(0px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.50; }
                    25% { transform: translateX(55px) translateY(-25vh) rotate(20deg); opacity: 0.52; }
                    50% { transform: translateX(-45px) translateY(-55vh) rotate(-10deg); opacity: 0.48; }
                    75% { transform: translateX(75px) translateY(-80vh) rotate(25deg); opacity: 0.38; }
                    90% { opacity: 0.18; }
                    100% { transform: translateX(-18px) translateY(-110vh) rotate(15deg); opacity: 0; }
                }

                /* Layer 4 — Dust */
                @keyframes akpDustDrift {
                    0% { transform: translateX(0) translateY(0); opacity: 0; }
                    20% { opacity: 0.40; }
                    50% { transform: translateX(12px) translateY(-40px); opacity: 0.45; }
                    80% { opacity: 0.18; }
                    100% { transform: translateX(-8px) translateY(-80px); opacity: 0; }
                }

                /* Header */
                .akp-header {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.25rem;
                    background: rgba(27,67,50,0.82);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,193,7,0.15);
                    isolation: isolate;
                }
                .akp-logo-wrap {
                    position: relative;
                    width: 48px; height: 48px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .akp-logo-halo {
                    position: absolute;
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: rgba(116,198,157,0.30);
                    filter: blur(16px);
                    animation: akpHaloPulse 3s ease-in-out infinite alternate;
                }
                @keyframes akpHaloPulse {
                    from { transform: scale(0.9); opacity: 0.7; }
                    to { transform: scale(1.1); opacity: 1; }
                }
                .akp-logo-svg { animation: akpLogoSpin 18s linear infinite; }
                @keyframes akpLogoSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .akp-brand {
                    margin-left: 0.75rem;
                    font-family: 'DM Serif Display', serif;
                    font-size: 1.3rem;
                    color: var(--off-white);
                    letter-spacing: 0.01em;
                    flex: 1;
                }
                .akp-brand-sub {
                    font-family: 'Inter', sans-serif;
                    font-size: 0.65rem;
                    color: var(--accent);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    display: block;
                    margin-top: -2px;
                }

                /* Language dropdown */
                .akp-lang-wrap {
                    position: relative;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .akp-lang-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.85rem;
                    background: rgba(64,145,108,0.25);
                    border: 1px solid rgba(116,198,157,0.30);
                    border-radius: 40px;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                    white-space: nowrap;
                }
                .akp-lang-btn:hover { background: rgba(64,145,108,0.40); }
                .akp-lang-chevron { transition: transform 0.2s; }
                .akp-lang-chevron.open { transform: rotate(180deg); }
                .akp-lang-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 130px;
                    background: rgba(27,67,50,0.96);
                    border: 1px solid rgba(116,198,157,0.25);
                    border-radius: 14px;
                    overflow: hidden;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    animation: akpDropIn 0.18s ease-out;
                }
                @keyframes akpDropIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .akp-lang-opt {
                    padding: 0.6rem 1rem;
                    color: var(--cream);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .akp-lang-opt:hover { background: rgba(64,145,108,0.35); }
                .akp-lang-opt.active { color: var(--sage); font-weight: 600; }

                /* Main content wrapper */
                .akp-content {
                    position: relative;
                    z-index: 5;
                    width: 100%;
                    max-width: 460px;
                    padding: 1rem 1rem 2rem;
                    margin-top: 80px;
                }

                /* Frosted glass card */
                .akp-card {
                    background: rgba(22,61,42,0.74);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border: 1px solid rgba(255,193,7,0.15);
                    border-top: 2.5px solid rgba(255,193,7,0.55);
                    border-radius: 26px;
                    box-shadow: 0 8px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(116,198,157,0.06) inset;
                    overflow: clip;
                    padding: 1.75rem 1.5rem;
                }

                /* Role badge */
                .akp-role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255,193,7,0.12);
                    border: 1px solid rgba(255,193,7,0.30);
                    border-radius: 40px;
                    padding: 0.35rem 1rem;
                    margin-bottom: 1.4rem;
                    color: var(--accent);
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .akp-role-dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: var(--accent);
                    animation: akpDotPulse 1.8s ease-in-out infinite;
                }
                @keyframes akpDotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.7); }
                }

                /* Step header */
                .akp-step-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 1.5rem;
                    color: var(--off-white);
                    margin-bottom: 0.35rem;
                }
                .akp-step-sub {
                    font-size: 0.85rem;
                    color: rgba(248,249,240,0.55);
                    margin-bottom: 1.6rem;
                }

                /* Progress dots */
                .akp-steps-dots {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 1.5rem;
                }
                .akp-step-dot {
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255,193,7,0.15);
                    transition: all 0.4s ease;
                    flex: 1;
                }
                .akp-step-dot.active {
                    background: linear-gradient(90deg, #FFC107, #FFD54F);
                }

                /* Back button */
                .akp-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.45rem 0.9rem;
                    background: rgba(64,145,108,0.15);
                    border: 1px solid rgba(116,198,157,0.20);
                    border-radius: 40px;
                    color: rgba(248,249,240,0.75);
                    font-family: 'Inter', sans-serif;
                    font-size: 0.82rem;
                    cursor: pointer;
                    margin-bottom: 1.4rem;
                    transition: background 0.2s, color 0.2s;
                }
                .akp-back-btn:hover { background: rgba(64,145,108,0.28); color: var(--off-white); }

                /* Input group */
                .akp-input-group { margin-bottom: 1.05rem; }
                .akp-label {
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: rgba(248,249,240,0.65);
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    margin-bottom: 0.45rem;
                }
                .akp-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .akp-prefix {
                    position: absolute;
                    left: 14px;
                    font-size: 0.92rem;
                    color: var(--sage);
                    font-weight: 600;
                    user-select: none;
                    pointer-events: none;
                }
                .akp-input {
                    width: 100%;
                    background: rgba(22,61,42,0.60);
                    border: 1.5px solid rgba(116,198,157,0.16);
                    border-radius: 12px;
                    padding: 0.75rem 0.95rem;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 0.93rem;
                    outline: none;
                    transition: border-color 0.25s, box-shadow 0.25s;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .akp-input::placeholder { color: rgba(248,249,240,0.28); }
                .akp-input:focus {
                    border-color: var(--mid-green);
                    box-shadow: 0 0 0 3px rgba(64,145,108,0.20);
                }
                .akp-input-mobile { padding-left: 3.4rem; }
                .akp-input-error { border-color: var(--danger) !important; }
                .akp-error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.28rem; }

                /* Select */
                .akp-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2374C69D' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    padding-right: 38px;
                }

                /* Accent button (Kabadi uses amber/gold accent) */
                .akp-btn-accent {
                    width: 100%;
                    padding: 0.88rem;
                    background: linear-gradient(135deg, #b8860b, #FFC107, #e6a200);
                    border: none;
                    border-radius: 14px;
                    color: #1B2E22;
                    font-family: 'Inter', sans-serif;
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    margin-top: 0.5rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
                    box-shadow: 0 4px 20px rgba(255,193,7,0.40);
                }
                .akp-btn-accent::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0));
                    border-radius: inherit;
                    pointer-events: none;
                }
                .akp-btn-accent:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(255,193,7,0.55);
                }
                .akp-btn-accent:active:not(:disabled) {
                    transform: scale(0.96);
                }
                .akp-btn-accent:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                /* OTP resend */
                .akp-resend-link {
                    color: var(--accent);
                    cursor: pointer;
                    font-weight: 600;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
                .akp-otp-info {
                    text-align: center;
                    color: rgba(248,249,240,0.55);
                    font-size: 0.84rem;
                    margin-top: 0.9rem;
                }

                /* Mobile badge */
                .akp-mobile-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: center;
                    margin-bottom: 1.4rem;
                }
                .akp-mobile-badge-text {
                    background: rgba(255,193,7,0.12);
                    border: 1px solid rgba(255,193,7,0.25);
                    border-radius: 40px;
                    padding: 0.35rem 1rem;
                    color: var(--accent);
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                /* OTP grid & box */
                .akp-otp-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.5rem;
                }
                .akp-otp-box {
                    aspect-ratio: 1;
                    background: rgba(22,61,42,0.60);
                    border: 1.5px solid rgba(116,198,157,0.16);
                    border-radius: 12px;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 700;
                    text-align: center;
                    outline: none;
                    width: 100%;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    -webkit-appearance: none;
                }
                .akp-otp-box:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(255,193,7,0.20);
                }

                /* OTP progress */
                .akp-otp-progress {
                    height: 3px;
                    background: rgba(255,193,7,0.12);
                    border-radius: 2px;
                    margin-top: 1rem;
                    overflow: hidden;
                }
                .akp-otp-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #FFC107, #FFD54F);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                /* Divider */
                .akp-divider {
                    height: 1px;
                    background: rgba(116,198,157,0.10);
                    margin: 1.2rem 0;
                }

                /* Switch link */
                .akp-switch-link {
                    text-align: center;
                    margin-top: 1.2rem;
                    font-size: 0.83rem;
                    color: rgba(248,249,240,0.45);
                }
                .akp-switch-link a {
                    color: var(--sage);
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* Shared OtpInput component styles (kabadi amber theme) */
                .otp-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.5rem;
                }
                .otp-box {
                    aspect-ratio: 1;
                    background: rgba(22,61,42,0.60);
                    border: 1.5px solid rgba(255,193,7,0.22);
                    border-radius: 12px;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 1.35rem;
                    font-weight: 700;
                    text-align: center;
                    outline: none;
                    width: 100%;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    -webkit-appearance: none;
                    caret-color: var(--accent);
                }
                .otp-box:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(255,193,7,0.22);
                }

                @media (max-width: 480px) {
                    .akp-card { padding: 1.4rem 1.1rem; border-radius: 20px; }
                    .akp-step-title { font-size: 1.3rem; }
                    .akp-brand { font-size: 1.1rem; }
                }
            `}</style>

            <div className="akp-root" style={{
                backgroundImage: `url(${backgrImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'scroll',
            }}>
                {/* Semi-transparent overlay */}
                <div className="akp-bg-gradient" />

                {/* Ambient green blob glows */}
                <div className="akp-blob akp-blob-1" />
                <div className="akp-blob akp-blob-2" />
                <div className="akp-blob akp-blob-3" />

                {/* Sticky Header */}
                <div className="akp-header">
                    <div className="akp-logo-wrap">
                        <div className="akp-logo-halo" />
                        <svg className="akp-logo-svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
                            <path d="M22,6 L34,26 L10,26 Z" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2.2" strokeLinejoin="round" />
                            <path d="M22,6 L30,4 L36,12" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M34,26 L38,32 L28,34" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M10,26 L6,32 L16,36" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <text x="16" y="23" fill="rgba(116,198,157,0.95)" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="8">3R</text>
                        </svg>
                    </div>
                    <div className="akp-brand">
                        KabaadiSaathi
                        <span className="akp-brand-sub">Kabadi-wala Portal</span>
                    </div>
                    {/* Language Selector */}
                    <div className="akp-lang-wrap">
                        <button className="akp-lang-btn" onClick={() => setLangOpen(o => !o)}>
                            {currentLangLabel}
                            <svg className={`akp-lang-chevron${langOpen ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M1 1l4 4 4-4" stroke="rgba(116,198,157,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {langOpen && (
                            <div className="akp-lang-dropdown">
                                {LANGS.map(l => (
                                    <div key={l.code} className={`akp-lang-opt${l.code === currentLang ? ' active' : ''}`} onClick={() => handleLangChange(l.code)}>
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Card */}
                <div className="akp-content">
                    <motion.div
                        className="akp-card"
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                        <button className="akp-back-btn" onClick={() => navigate('/')}>
                            <FiArrowLeft size={14} /> Back to Home
                        </button>

                        <div className="akp-role-badge">
                            <div className="akp-role-dot" />
                            Kabadi-wala Portal
                        </div>

                        <div className="akp-steps-dots">
                            <div className={`akp-step-dot ${step === 'mobile' || step === 'otp' || step === 'register' ? 'active' : ''}`} />
                            <div className={`akp-step-dot ${step === 'otp' || step === 'register' ? 'active' : ''}`} />
                            <div className={`akp-step-dot ${step === 'register' ? 'active' : ''}`} />
                        </div>

                        <h2 className="akp-step-title">
                            {step === 'mobile' ? 'Kabadi Login' : step === 'otp' ? 'Verify Identity' : 'Complete Profile'}
                        </h2>
                        <p className="akp-step-sub">{stepTitle}</p>

                        <AnimatePresence mode="wait">
                            {step === 'mobile' && (
                                <motion.div key="m"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <div className="akp-input-group">
                                        <label className="akp-label">{t('auth.mobile')}</label>
                                        <div className="akp-input-wrap">
                                            <span className="akp-prefix">+91</span>
                                            <input
                                                className="akp-input akp-input-mobile"
                                                value={mobile}
                                                onChange={e => setMobile(e.target.value)}
                                                placeholder="10-digit mobile number"
                                                maxLength={10}
                                                type="tel"
                                            />
                                        </div>
                                    </div>
                                    <button className="akp-btn-accent" onClick={handleSendOtp} disabled={loading}>
                                        {loading ? '⏳ Sending...' : t('auth.sendOtp')}
                                    </button>
                                </motion.div>
                            )}

                            {step === 'otp' && (
                                <motion.div key="o"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <div className="akp-mobile-badge">
                                        <span className="akp-mobile-badge-text">📱 +91 {mobile}</span>
                                    </div>
                                    <OtpInput value={otp} onChange={setOtp} />
                                    <div className="akp-otp-progress">
                                        <div className="akp-otp-progress-fill" style={{ width: `${(otp.length / 6) * 100}%` }} />
                                    </div>
                                    <button className="akp-btn-accent" style={{ marginTop: '1.4rem' }} onClick={handleVerifyOtp} disabled={loading}>
                                        {loading ? '⏳ Verifying...' : t('auth.verifyOtp')}
                                    </button>
                                    <p className="akp-otp-info">
                                        {countdown > 0
                                            ? `Resend OTP in ${countdown}s`
                                            : <span className="akp-resend-link" onClick={handleSendOtp}>{t('auth.resend')}</span>
                                        }
                                    </p>
                                </motion.div>
                            )}

                            {step === 'register' && (
                                <motion.div key="r"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <Field label="Full Name" field="name" mandatory placeholder="Your full name" />
                                    <Field label="Address Line 1" field="addressLine1" mandatory placeholder="House / Street / Colony" />
                                    <Field label="Address Line 2" field="addressLine2" placeholder="Landmark, Area (optional)" />
                                    <Field label="Pincode" field="pincode" mandatory maxLength={6} placeholder="6-digit pincode" />
                                    <div className="akp-input-group">
                                        <label className="akp-label">Working Area / Town</label>
                                        <input className="akp-input" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder="e.g. Lajpat Nagar, Delhi" />
                                    </div>
                                    <div className="akp-input-group">
                                        <label className="akp-label">{t('auth.language')}</label>
                                        <select className="akp-input akp-select" value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                                            <option value="en">English</option>
                                            <option value="hi">हिन्दी</option>
                                            <option value="bn">বাংলা</option>
                                            <option value="ta">தமிழ்</option>
                                            <option value="mr">मराठी</option>
                                        </select>
                                    </div>
                                    <button className="akp-btn-accent" onClick={handleRegister} disabled={loading}>
                                        {loading ? '⏳ Registering...' : t('auth.register')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="akp-divider" />
                        <div className="akp-switch-link">
                            Are you a citizen?{' '}
                            <a onClick={() => navigate('/auth/citizen')}>Login here →</a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    )
}
