import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { logTransaction } from '../../api/kabadiApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Confetti from '../../components/Confetti.jsx'

const MATERIALS = [
    { type: 'PLASTIC', icon: '🧴', label: 'Plastic' },
    { type: 'PAPER', icon: '📄', label: 'Paper' },
    { type: 'METAL', icon: '🔩', label: 'Metal' },
    { type: 'GLASS', icon: '🪟', label: 'Glass' },
    { type: 'E_WASTE', icon: '💻', label: 'E-Waste' },
]

const DEFAULT_PRICES = { PLASTIC: 12, PAPER: 8, METAL: 45, GLASS: 5, E_WASTE: 60 }

export default function LogTransaction() {
    const { t } = useTranslation()
    const { auth } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [form, setForm] = useState({ materialType: '', weightKg: 1, pricePerKg: 12, citizenId: '' })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const handleMaterialSelect = (m) => {
        setForm(p => ({ ...p, materialType: m.type, pricePerKg: DEFAULT_PRICES[m.type] }))
        setStep(2)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload = {
                kabadiWalaId: auth?.userId,
                materialType: form.materialType,
                weightKg: parseFloat(form.weightKg),
                pricePerKg: parseFloat(form.pricePerKg),
            }
            const res = await logTransaction(payload)
            const data = res.data.data
            setResult(data)
            setStep(3)
            setShowConfetti(true)
            toast.success(t('toast.transactionLogged'))
            if (data.kCoinsEarned > 0) {
                setTimeout(() => toast.success(t('toast.kcoinsEarned', { count: data.kCoinsEarned })), 800)
            }
            setTimeout(() => setShowConfetti(false), 3000)
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const totalAmount = (parseFloat(form.weightKg || 0) * parseFloat(form.pricePerKg || 0)).toFixed(2)

    return (
        <div className="page">
            <Navbar userType="KABADI" />
            {showConfetti && <Confetti />}
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="section-title">+ {t('nav.logTx')}</h1>

                    {/* Step indicator */}
                    <div className="steps" style={{ marginBottom: '2rem', gap: '1rem' }}>
                        {[t('tx.step1'), t('tx.step2'), t('tx.step3')].map((label, i) => (
                            <div key={i} className={`step${step > i ? ' done' : step === i + 1 ? ' active' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="step-dot">{step > i + 1 ? '✓' : i + 1}</div>
                                <div className="step-label">{label}</div>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>{t('tx.step1')}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    {MATERIALS.map(m => (
                                        <motion.button key={m.type} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => handleMaterialSelect(m)}
                                            style={{ padding: '1.25rem', borderRadius: 12, border: '2px solid var(--border)', background: 'var(--bg-card-2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '2rem' }}>{m.icon}</span>
                                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{m.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>{t('tx.step2')}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card-2)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{MATERIALS.find(m => m.type === form.materialType)?.icon}</span>
                                    <span style={{ fontWeight: 600 }}>{form.materialType}</span>
                                    <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setStep(1)}>Change</button>
                                </div>
                                <div className="input-group"><label>{t('tx.weight')}</label>
                                    <input className="input" type="number" min="0.1" step="0.1" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))} />
                                </div>
                                <div className="input-group"><label>{t('tx.pricePerKg')}</label>
                                    <input className="input" type="number" min="0.1" step="0.5" value={form.pricePerKg} onChange={e => setForm(p => ({ ...p, pricePerKg: e.target.value }))} />
                                </div>
                                <div style={{ background: 'var(--bg-card-2)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="text-muted">{t('tx.totalAmount')}</span>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>₹{totalAmount}</span>
                                </div>
                                <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)}>{t('tx.step3')} →</button>
                            </motion.div>
                        )}

                        {step === 3 && !result && (
                            <motion.div key="s3" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Confirm Transaction</h3>
                                {[['Material', form.materialType], ['Weight', `${form.weightKg} kg`], ['Price/kg', `₹${form.pricePerKg}`], ['Total', `₹${totalAmount}`]].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span className="text-muted">{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                                    <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>{loading ? '...' : t('tx.submit')}</button>
                                </div>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div key="done" className="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '2.5rem' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✅</div>
                                <h2 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-light)' }}>Transaction Logged!</h2>
                                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                                    <div className="card stat-card"><div className="stat-value">₹{result.amountPaid?.toFixed(2)}</div><div className="stat-label">Amount Paid</div></div>
                                    <div className="card stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
                                        <div className="stat-value" style={{ color: 'var(--accent)' }}>🪙 {result.kCoinsEarned}</div>
                                        <div className="stat-label">K-Coins Earned</div>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-full" onClick={() => { setStep(1); setResult(null); setForm({ materialType: '', weightKg: 1, pricePerKg: 12, citizenId: '' }) }}>+ Log Another</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}
