import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendOtp, verifyOtp, registerCitizen } from '../../api/authApi.js'
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

function FloatingLeaf({ size, color, duration, delay, startX, style }) {
    const path = leafPaths[Math.floor(Math.random() * leafPaths.length)]
    const keyframeName = `leafFloat_${Math.floor(Math.random() * 9999)}`
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 36 60"
            style={{
                position: 'fixed',
                left: startX,
                bottom: '-120px',
                opacity: 0,
                animation: `leafRise ${duration}s ease-in-out ${delay}s infinite`,
                willChange: 'transform, opacity',
                zIndex: 1,
                pointerEvents: 'none',
                ...style,
            }}
        >
            <path d={path} fill={color} />
        </svg>
    )
}

export default function CitizenAuthPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [step, setStep] = useState('mobile')
    const [mobile, setMobile] = useState('')
    const [otp, setOtp] = useState('')
    const [form, setForm] = useState({ name: '', addressLine1: '', addressLine2: '', pincode: '', preferredLanguage: 'en' })
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [focusedField, setFocusedField] = useState(null)
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
        const timer = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(timer); return 0; } return p - 1; }), 1000)
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

    const leafData = [
        { size: 90, color: 'rgba(116,198,157,0.52)', duration: 22, delay: 0, startX: '8%' },
        { size: 75, color: 'rgba(64,145,108,0.48)', duration: 18, delay: 3, startX: '20%' },
        { size: 100, color: 'rgba(116,198,157,0.46)', duration: 25, delay: 7, startX: '35%' },
        { size: 80, color: 'rgba(64,145,108,0.50)', duration: 20, delay: 1, startX: '55%' },
        { size: 50, color: 'rgba(116,198,157,0.44)', duration: 16, delay: 10, startX: '70%' },
        { size: 40, color: 'rgba(64,145,108,0.45)', duration: 14, delay: 5, startX: '82%' },
        { size: 60, color: 'rgba(116,198,157,0.52)', duration: 19, delay: 13, startX: '90%' },
        { size: 30, color: 'rgba(64,145,108,0.42)', duration: 15, delay: 8, startX: '12%' },
        { size: 25, color: 'rgba(116,198,157,0.40)', duration: 17, delay: 18, startX: '45%' },
        { size: 35, color: 'rgba(64,145,108,0.44)', duration: 14, delay: 2, startX: '64%' },
        { size: 22, color: 'rgba(116,198,157,0.42)', duration: 16, delay: 20, startX: '28%' },
        { size: 28, color: 'rgba(64,145,108,0.40)', duration: 18, delay: 14, startX: '76%' },
        { size: 20, color: 'rgba(116,198,157,0.38)', duration: 15, delay: 6, startX: '50%' },
        { size: 32, color: 'rgba(64,145,108,0.48)', duration: 21, delay: 11, startX: '95%' },
    ]

    const dustData = Array.from({ length: 22 }, (_, i) => ({
        left: `${Math.floor((i * 4.5 + 3) % 97)}%`,
        top: `${Math.floor((i * 7.3 + 5) % 95)}%`,
        size: 3 + (i % 5),
        duration: 6 + (i % 9),
        delay: (i * 0.6) % 12,
    }))

    const stepTitle = step === 'mobile' ? 'Enter your mobile' : step === 'otp' ? 'Enter the OTP' : 'Complete registration'

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
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .ap-root {
                    min-height: 100vh;
                    min-width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Inter', sans-serif;
                }

                /* Layer 0 — Dark translucent overlay over backgr.jpeg */
                .ap-bg-gradient {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 10, 5, 0.25);
                    z-index: 1;
                }

                /* Layer 1 — Morphing Blob Orbs */
                .ap-blob {
                    position: fixed;
                    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
                    background: radial-gradient(circle, rgba(64,145,108,0.50) 0%, rgba(27,67,50,0.0) 70%);
                    filter: blur(40px);
                    z-index: 1;
                    pointer-events: none;
                    will-change: transform, border-radius;
                }
                .ap-blob-1 {
                    width: 420px; height: 420px;
                    top: -80px; left: -80px;
                    opacity: 0.50;
                    animation: blobMorph1 11s ease-in-out infinite, blobPulse1 9s ease-in-out infinite;
                }
                .ap-blob-2 {
                    width: 480px; height: 480px;
                    bottom: -100px; right: -80px;
                    opacity: 0.48;
                    animation: blobMorph2 13s ease-in-out infinite, blobPulse2 12s ease-in-out infinite;
                }
                .ap-blob-3 {
                    width: 350px; height: 350px;
                    top: 30%; right: 5%;
                    opacity: 0.45;
                    animation: blobMorph3 9s ease-in-out infinite, blobPulse3 10s ease-in-out infinite;
                }
                @keyframes blobMorph1 {
                    0%, 100% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                    33% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                    66% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                }
                @keyframes blobMorph2 {
                    0%, 100% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                    33% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                    66% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                }
                @keyframes blobMorph3 {
                    0%, 100% { border-radius: 70% 30% 50% 50% / 40% 70% 30% 60%; }
                    33% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
                    66% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
                }
                @keyframes blobPulse1 {
                    0%, 100% { transform: scale(0.88) translateX(-20px) translateY(10px); }
                    50% { transform: scale(1.14) translateX(20px) translateY(-20px); }
                }
                @keyframes blobPulse2 {
                    0%, 100% { transform: scale(1.10) translateX(15px) translateY(-15px); }
                    50% { transform: scale(0.90) translateX(-25px) translateY(20px); }
                }
                @keyframes blobPulse3 {
                    0%, 100% { transform: scale(0.92) translateX(10px) translateY(20px); }
                    50% { transform: scale(1.10) translateX(-20px) translateY(-10px); }
                }

                /* Layer 2 — Static Canopy Silhouettes */
                .ap-canopy {
                    position: fixed;
                    z-index: 2;
                    pointer-events: none;
                    opacity: 0.32;
                    animation: canopySway 24s ease-in-out infinite alternate;
                    transform-origin: top center;
                }
                .ap-canopy-tl { top: -20px; left: -30px; }
                .ap-canopy-tr { top: -20px; right: -30px; transform: scaleX(-1); }
                .ap-canopy-bl { bottom: -30px; left: -20px; transform: scaleY(-1); }
                @keyframes canopySway {
                    from { transform: rotate(-2deg); }
                    to { transform: rotate(2deg); }
                }
                .ap-canopy-tr { animation: canopySway2 28s ease-in-out infinite alternate; }
                @keyframes canopySway2 {
                    from { transform: scaleX(-1) rotate(1.5deg); }
                    to { transform: scaleX(-1) rotate(-3deg); }
                }

                /* Layer 3 — Floating Leaves */
                @keyframes leafRise {
                    0% { transform: translateX(0px) translateY(0px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.5; }
                    25% { transform: translateX(60px) translateY(-25vh) rotate(20deg); opacity: 0.52; }
                    50% { transform: translateX(-40px) translateY(-55vh) rotate(-10deg); opacity: 0.48; }
                    75% { transform: translateX(80px) translateY(-80vh) rotate(25deg); opacity: 0.40; }
                    90% { opacity: 0.20; }
                    100% { transform: translateX(-20px) translateY(-110vh) rotate(15deg); opacity: 0; }
                }

                /* Layer 4 — Dust Spores */
                @keyframes dustDrift {
                    0% { transform: translateX(0) translateY(0); opacity: 0; }
                    20% { opacity: 0.40; }
                    50% { transform: translateX(12px) translateY(-40px); opacity: 0.45; }
                    80% { opacity: 0.20; }
                    100% { transform: translateX(-8px) translateY(-80px); opacity: 0; }
                }

                /* Header */
                .ap-header {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1.25rem;
                    background: rgba(27,67,50,0.82);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(116,198,157,0.15);
                    isolation: isolate;
                }
                .ap-logo-wrap {
                    position: relative;
                    width: 48px; height: 48px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .ap-logo-halo {
                    position: absolute;
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: rgba(116,198,157,0.30);
                    filter: blur(16px);
                    animation: haloPulse 3s ease-in-out infinite alternate;
                }
                @keyframes haloPulse {
                    from { transform: scale(0.9); opacity: 0.7; }
                    to { transform: scale(1.1); opacity: 1; }
                }
                .ap-logo-svg { animation: logoSpin 18s linear infinite; }
                @keyframes logoSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .ap-brand {
                    margin-left: 0.75rem;
                    font-family: 'DM Serif Display', serif;
                    font-size: 1.3rem;
                    color: var(--off-white);
                    letter-spacing: 0.01em;
                    flex: 1;
                }
                .ap-brand-sub {
                    font-family: 'Inter', sans-serif;
                    font-size: 0.65rem;
                    color: var(--sage);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    display: block;
                    margin-top: -2px;
                }

                /* Language dropdown */
                .ap-lang-wrap {
                    position: relative;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .ap-lang-btn {
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
                .ap-lang-btn:hover { background: rgba(64,145,108,0.40); }
                .ap-lang-chevron { transition: transform 0.2s; }
                .ap-lang-chevron.open { transform: rotate(180deg); }
                .ap-lang-dropdown {
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
                    animation: dropIn 0.18s ease-out;
                }
                @keyframes dropIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .ap-lang-opt {
                    padding: 0.6rem 1rem;
                    color: var(--cream);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .ap-lang-opt:hover { background: rgba(64,145,108,0.35); }
                .ap-lang-opt.active { color: var(--sage); font-weight: 600; }

                /* Main content wrapper */
                .ap-content {
                    position: relative;
                    z-index: 5;
                    width: 100%;
                    max-width: 460px;
                    padding: 1rem 1rem 2rem;
                    margin-top: 80px;
                }

                /* Frosted glass card */
                .ap-card {
                    background: rgba(27,67,50,0.72);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border: 1px solid rgba(116,198,157,0.18);
                    border-radius: 26px;
                    box-shadow: 0 8px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(116,198,157,0.08) inset;
                    overflow: clip;
                    padding: 1.75rem 1.5rem;
                }

                /* Role badge */
                .ap-role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(64,145,108,0.20);
                    border: 1px solid rgba(116,198,157,0.25);
                    border-radius: 40px;
                    padding: 0.35rem 1rem;
                    margin-bottom: 1.4rem;
                    color: var(--sage);
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .ap-role-dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: var(--sage);
                    animation: dotPulse 1.8s ease-in-out infinite;
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.7); }
                }

                /* Step header */
                .ap-step-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 1.5rem;
                    color: var(--off-white);
                    margin-bottom: 0.35rem;
                }
                .ap-step-sub {
                    font-size: 0.85rem;
                    color: rgba(248,249,240,0.55);
                    margin-bottom: 1.6rem;
                }

                /* Progress dots */
                .ap-steps-dots {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 1.5rem;
                }
                .ap-step-dot {
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(116,198,157,0.20);
                    transition: all 0.4s ease;
                    flex: 1;
                }
                .ap-step-dot.active {
                    background: linear-gradient(90deg, #40916C, #74C69D);
                }

                /* Back button */
                .ap-back-btn {
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
                .ap-back-btn:hover { background: rgba(64,145,108,0.28); color: var(--off-white); }

                /* Input group */
                .ap-input-group { margin-bottom: 1.1rem; }
                .ap-label {
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: rgba(248,249,240,0.65);
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    margin-bottom: 0.45rem;
                }
                .ap-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .ap-prefix {
                    position: absolute;
                    left: 14px;
                    font-size: 0.92rem;
                    color: var(--sage);
                    font-weight: 600;
                    user-select: none;
                    pointer-events: none;
                }
                .ap-input {
                    width: 100%;
                    background: rgba(27,67,50,0.55);
                    border: 1.5px solid rgba(116,198,157,0.18);
                    border-radius: 12px;
                    padding: 0.78rem 0.95rem;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.25s, box-shadow 0.25s;
                    -webkit-appearance: none;
                }
                .ap-input::placeholder { color: rgba(248,249,240,0.30); }
                .ap-input:focus {
                    border-color: var(--mid-green);
                    box-shadow: 0 0 0 3px rgba(64,145,108,0.22);
                }
                .ap-input-mobile { padding-left: 3.4rem; }
                .ap-input-error { border-color: var(--danger) !important; }
                .ap-error-text { color: var(--danger); font-size: 0.76rem; margin-top: 0.3rem; }

                /* Primary button */
                .ap-btn-primary {
                    width: 100%;
                    padding: 0.88rem;
                    background: linear-gradient(135deg, var(--forest), var(--mid-green));
                    border: none;
                    border-radius: 14px;
                    color: var(--off-white);
                    font-family: 'Inter', sans-serif;
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    margin-top: 0.5rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
                    box-shadow: 0 4px 20px rgba(64,145,108,0.35);
                }
                .ap-btn-primary::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
                    border-radius: inherit;
                    pointer-events: none;
                }
                .ap-btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(64,145,108,0.50);
                }
                .ap-btn-primary:active:not(:disabled) {
                    transform: scale(0.96);
                }
                .ap-btn-primary:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                /* OTP resend */
                .ap-resend-link {
                    color: var(--sage);
                    cursor: pointer;
                    font-weight: 600;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
                .ap-otp-info {
                    text-align: center;
                    color: rgba(248,249,240,0.55);
                    font-size: 0.84rem;
                    margin-top: 0.9rem;
                }

                /* Mobile masked badge */
                .ap-mobile-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: center;
                    margin-bottom: 1.4rem;
                }
                .ap-mobile-badge-text {
                    background: rgba(64,145,108,0.20);
                    border: 1px solid rgba(116,198,157,0.22);
                    border-radius: 40px;
                    padding: 0.35rem 1rem;
                    color: var(--sage);
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                /* OTP custom grid */
                .ap-otp-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.5rem;
                }
                .ap-otp-box {
                    aspect-ratio: 1;
                    background: rgba(27,67,50,0.55);
                    border: 1.5px solid rgba(116,198,157,0.18);
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
                .ap-otp-box:focus {
                    border-color: var(--mid-green);
                    box-shadow: 0 0 0 3px rgba(64,145,108,0.22);
                }

                /* Progress bar OTP */
                .ap-otp-progress {
                    height: 3px;
                    background: rgba(116,198,157,0.15);
                    border-radius: 2px;
                    margin-top: 1rem;
                    overflow: hidden;
                }
                .ap-otp-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #40916C, #74C69D);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                /* Select */
                .ap-select {
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2374C69D' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    padding-right: 38px;
                }

                /* Divider */
                .ap-divider {
                    height: 1px;
                    background: rgba(116,198,157,0.10);
                    margin: 1.2rem 0;
                }

                /* Bottom nav link */
                .ap-switch-link {
                    text-align: center;
                    margin-top: 1.2rem;
                    font-size: 0.83rem;
                    color: rgba(248,249,240,0.45);
                }
                .ap-switch-link a {
                    color: var(--sage);
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* Shared OtpInput component styles */
                .otp-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 0.5rem;
                }
                .otp-box {
                    aspect-ratio: 1;
                    background: rgba(27,67,50,0.55);
                    border: 1.5px solid rgba(116,198,157,0.18);
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
                    caret-color: var(--sage);
                }
                .otp-box:focus {
                    border-color: var(--mid-green);
                    box-shadow: 0 0 0 3px rgba(64,145,108,0.22);
                }

                @media (max-width: 480px) {
                    .ap-card { padding: 1.4rem 1.1rem; border-radius: 20px; }
                    .ap-step-title { font-size: 1.3rem; }
                    .ap-brand { font-size: 1.1rem; }
                }
            `}</style>

            <div className="ap-root" style={{
                backgroundImage: `url(${backgrImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'scroll',
            }}>
                {/* Semi-transparent overlay */}
                <div className="ap-bg-gradient" />

                {/* Ambient green blob glows */}
                <div className="ap-blob ap-blob-1" />
                <div className="ap-blob ap-blob-2" />
                <div className="ap-blob ap-blob-3" />

                {/* Sticky Header */}
                <div className="ap-header">
                    <div className="ap-logo-wrap">
                        <div className="ap-logo-halo" />
                        <svg className="ap-logo-svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
                            <path d="M22,6 L34,26 L10,26 Z" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2.2" strokeLinejoin="round" />
                            <path d="M22,6 L30,4 L36,12" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M34,26 L38,32 L28,34" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M10,26 L6,32 L16,36" fill="none" stroke="rgba(116,198,157,0.92)" strokeWidth="2" strokeLinecap="round" />
                            <text x="16" y="23" fill="rgba(116,198,157,0.95)" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="8">3R</text>
                        </svg>
                    </div>
                    <div className="ap-brand">
                        KabaadiSaathi
                        <span className="ap-brand-sub">Civic Waste Management</span>
                    </div>
                    {/* Language Selector */}
                    <div className="ap-lang-wrap">
                        <button className="ap-lang-btn" onClick={() => setLangOpen(o => !o)}>
                            {currentLangLabel}
                            <svg className={`ap-lang-chevron${langOpen ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M1 1l4 4 4-4" stroke="rgba(116,198,157,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {langOpen && (
                            <div className="ap-lang-dropdown">
                                {LANGS.map(l => (
                                    <div key={l.code} className={`ap-lang-opt${l.code === currentLang ? ' active' : ''}`} onClick={() => handleLangChange(l.code)}>
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Card */}
                <div className="ap-content">
                    <motion.div
                        className="ap-card"
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                        {/* Back button */}
                        <button className="ap-back-btn" onClick={() => navigate('/')}>
                            <FiArrowLeft size={14} /> Back to Home
                        </button>

                        {/* Role badge */}
                        <div className="ap-role-badge">
                            <div className="ap-role-dot" />
                            Citizen Portal
                        </div>

                        {/* Step progress dots */}
                        <div className="ap-steps-dots">
                            <div className={`ap-step-dot ${step === 'mobile' || step === 'otp' || step === 'register' ? 'active' : ''}`} />
                            <div className={`ap-step-dot ${step === 'otp' || step === 'register' ? 'active' : ''}`} />
                            <div className={`ap-step-dot ${step === 'register' ? 'active' : ''}`} />
                        </div>

                        <h2 className="ap-step-title">
                            {step === 'mobile' ? 'Welcome Back' : step === 'otp' ? 'Verify Identity' : 'Create Profile'}
                        </h2>
                        <p className="ap-step-sub">{stepTitle}</p>

                        <AnimatePresence mode="wait">
                            {step === 'mobile' && (
                                <motion.div key="mobile"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.mobile')}</label>
                                        <div className="ap-input-wrap">
                                            <span className="ap-prefix">+91</span>
                                            <input
                                                className="ap-input ap-input-mobile"
                                                value={mobile}
                                                onChange={e => setMobile(e.target.value)}
                                                placeholder="10-digit mobile number"
                                                maxLength={10}
                                                type="tel"
                                            />
                                        </div>
                                    </div>
                                    <button className="ap-btn-primary" onClick={handleSendOtp} disabled={loading}>
                                        {loading ? '⏳ Sending...' : t('auth.sendOtp')}
                                    </button>
                                </motion.div>
                            )}

                            {step === 'otp' && (
                                <motion.div key="otp"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <div className="ap-mobile-badge">
                                        <span className="ap-mobile-badge-text">📱 +91 {mobile}</span>
                                    </div>
                                    <OtpInput value={otp} onChange={setOtp} />
                                    <div className="ap-otp-progress">
                                        <div className="ap-otp-progress-fill" style={{ width: `${(otp.length / 6) * 100}%` }} />
                                    </div>
                                    <button className="ap-btn-primary" style={{ marginTop: '1.4rem' }} onClick={handleVerifyOtp} disabled={loading}>
                                        {loading ? '⏳ Verifying...' : t('auth.verifyOtp')}
                                    </button>
                                    <p className="ap-otp-info">
                                        {countdown > 0
                                            ? `Resend OTP in ${countdown}s`
                                            : <><span className="ap-resend-link" onClick={handleSendOtp}>{t('auth.resend')}</span></>
                                        }
                                    </p>
                                </motion.div>
                            )}

                            {step === 'register' && (
                                <motion.div key="register"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                >
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.name')} *</label>
                                        <input className="ap-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
                                    </div>
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.address1')} *</label>
                                        <input className="ap-input" value={form.addressLine1} onChange={e => setForm(p => ({ ...p, addressLine1: e.target.value }))} placeholder="House / Street / Colony" />
                                    </div>
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.address2')}</label>
                                        <input className="ap-input" value={form.addressLine2} onChange={e => setForm(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Landmark, Area (optional)" />
                                    </div>
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.pincode')} *</label>
                                        <input className="ap-input" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} maxLength={6} placeholder="6-digit pincode" />
                                    </div>
                                    <div className="ap-input-group">
                                        <label className="ap-label">{t('auth.language')}</label>
                                        <select className="ap-input ap-select" value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                                            <option value="en">English</option>
                                            <option value="hi">हिन्दी</option>
                                            <option value="bn">বাংলা</option>
                                            <option value="ta">தமிழ்</option>
                                            <option value="mr">मराठी</option>
                                        </select>
                                    </div>
                                    <button className="ap-btn-primary" onClick={handleRegister} disabled={loading}>
                                        {loading ? '⏳ Registering...' : t('auth.register')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="ap-divider" />
                        <div className="ap-switch-link">
                            Are you a Kabadi-wala?{' '}
                            <a onClick={() => navigate('/auth/kabadi')}>Login here →</a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    )
}
