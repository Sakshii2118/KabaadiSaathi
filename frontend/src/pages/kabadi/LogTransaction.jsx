import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { logTransaction } from '../../api/kabadiApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from '../../components/Confetti.jsx'
import { FiPlus, FiTrash2, FiCheck, FiEdit2 } from 'react-icons/fi'

const MATERIALS = [
    { type: 'PLASTIC', icon: '🧴', label: 'Plastic', defaultPrice: 12 },
    { type: 'PAPER', icon: '📄', label: 'Paper', defaultPrice: 8 },
    { type: 'METAL', icon: '🔩', label: 'Metal', defaultPrice: 45 },
    { type: 'GLASS', icon: '🪟', label: 'Glass', defaultPrice: 5 },
    { type: 'E_WASTE', icon: '💻', label: 'E-Waste', defaultPrice: 60 },
]
const M = Object.fromEntries(MATERIALS.map(m => [m.type, m]))

// phase: 'compose' | 'confirm' | 'done'
export default function LogTransaction() {
    const { t } = useTranslation()
    const { auth } = useAuth()

    // Compose state — one entry being built at a time
    const [selectedType, setSelectedType] = useState(null)
    const [weight, setWeight] = useState('')
    const [pricePerKg, setPricePerKg] = useState('')
    const [weightError, setWeightError] = useState('')

    // Pending list — materials added but not yet submitted
    const [items, setItems] = useState([])   // [{id, type, weight, pricePerKg}]
    const [editId, setEditId] = useState(null)

    const [phase, setPhase] = useState('compose')  // compose | confirm | done
    const [results, setResults] = useState([])      // responses from backend
    const [loading, setLoading] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    // ── Computed total ────────────────────────────────────────────
    const grandTotal = items.reduce((s, i) => s + parseFloat(i.weight) * parseFloat(i.pricePerKg), 0)

    // ── Select a material chip ────────────────────────────────────
    const handlePickMaterial = (m) => {
        setSelectedType(m.type)
        setPricePerKg(String(m.defaultPrice))
        setWeight('')
        setWeightError('')
    }

    // ── Add / update item in the pending list ─────────────────────
    const handleAddItem = () => {
        if (!selectedType) return toast.error('Select a material type first')
        const w = parseFloat(weight)
        if (!weight || isNaN(w) || w <= 0) { setWeightError('Enter a valid weight greater than 0'); return }
        setWeightError('')

        if (editId !== null) {
            setItems(prev => prev.map(i => i.id === editId ? { ...i, type: selectedType, weight, pricePerKg } : i))
            setEditId(null)
            toast.success('Item updated')
        } else {
            setItems(prev => [...prev, { id: Date.now(), type: selectedType, weight, pricePerKg }])
            toast.success('Material added to list')
        }
        setSelectedType(null)
        setWeight('')
        setPricePerKg('')
    }

    const handleEditItem = (item) => {
        setSelectedType(item.type)
        setWeight(item.weight)
        setPricePerKg(item.pricePerKg)
        setEditId(item.id)
        setWeightError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleRemoveItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id))
        if (editId === id) { setEditId(null); setSelectedType(null); setWeight(''); setPricePerKg('') }
    }

    const handleCancelEdit = () => { setEditId(null); setSelectedType(null); setWeight(''); setPricePerKg(''); setWeightError('') }

    // ── Submit all items ──────────────────────────────────────────
    const handleSubmitAll = async () => {
        setLoading(true)
        try {
            const all = await Promise.all(items.map(item =>
                logTransaction({
                    kabadiWalaId: auth?.userId,
                    materialType: item.type,
                    weightKg: parseFloat(item.weight),
                    pricePerKg: parseFloat(item.pricePerKg),
                })
            ))
            setResults(all.map(r => r.data.data))
            setPhase('done')
            setShowConfetti(true)
            toast.success('All transactions logged!')
            setTimeout(() => setShowConfetti(false), 3000)
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setLoading(false) }
    }

    const resetAll = () => { setItems([]); setResults([]); setPhase('compose'); setSelectedType(null); setWeight(''); setPricePerKg(''); setEditId(null) }

    return (
        <div className="page">
            <Navbar userType="KABADI" />
            {showConfetti && <Confetti />}
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 680 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>+ {t('nav.logTx')}</h1>

                    <AnimatePresence mode="wait">

                        {/* ════════════════════════════════════════
                            PHASE 1 — COMPOSE: select materials
                            ════════════════════════════════════════ */}
                        {phase === 'compose' && (
                            <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                                {/* ── Material picker + weight form ── */}
                                <div className="card" style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                                        {editId !== null ? '✏️ Edit Material Entry' : '📦 Add a Material'}
                                    </h3>

                                    {/* Material chips */}
                                    <p style={{ fontWeight: 600, marginBottom: '0.65rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                        STEP 1 — Select Material <span style={{ color: 'var(--danger)' }}>*</span>
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                        {MATERIALS.map(m => {
                                            const sel = selectedType === m.type
                                            return (
                                                <button key={m.type} onClick={() => handlePickMaterial(m)}
                                                    style={{
                                                        padding: '0.6rem 1rem', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
                                                        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                                                        background: sel ? 'rgba(255,193,7,0.12)' : 'var(--bg-card-2)',
                                                        color: 'var(--text)', transition: 'all 0.15s',
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        boxShadow: sel ? '0 0 0 3px rgba(255,193,7,0.18)' : 'none'
                                                    }}>
                                                    {sel && <FiCheck size={13} style={{ color: 'var(--accent)' }} />}
                                                    {m.icon} {m.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Weight + price — only show once material selected */}
                                    <AnimatePresence>
                                        {selectedType && (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <p style={{ fontWeight: 600, marginBottom: '0.65rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                                    STEP 2 — Enter Weight & Price <span style={{ color: 'var(--danger)' }}>*</span>
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.75rem' }}>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Weight (kg) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                                        <input className="input" type="number" min="0.1" step="0.1"
                                                            placeholder="e.g. 3.5"
                                                            value={weight}
                                                            onChange={e => { setWeight(e.target.value); setWeightError('') }}
                                                            style={weightError ? { borderColor: 'var(--danger)' } : {}}
                                                            autoFocus />
                                                        {weightError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{weightError}</p>}
                                                    </div>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Price / kg (₹)</label>
                                                        <input className="input" type="number" min="0.1" step="0.5"
                                                            value={pricePerKg}
                                                            onChange={e => setPricePerKg(e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* Live sub-total */}
                                                {weight && pricePerKg && parseFloat(weight) > 0 && (
                                                    <div style={{ background: 'rgba(255,193,7,0.07)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{M[selectedType]?.icon} {weight} kg × ₹{pricePerKg}/kg</span>
                                                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>= ₹{(parseFloat(weight) * parseFloat(pricePerKg)).toFixed(2)}</span>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    {editId !== null && <button className="btn btn-ghost" onClick={handleCancelEdit}>Cancel</button>}
                                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddItem}>
                                                        {editId !== null ? <><FiCheck /> Update Entry</> : <><FiPlus /> Add to List</>}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* ── Pending items list ── */}
                                {items.length > 0 && (
                                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ fontWeight: 700 }}>🗂️ Materials List ({items.length})</h3>
                                        </div>

                                        <AnimatePresence>
                                            {items.map(item => {
                                                const sub = (parseFloat(item.weight) * parseFloat(item.pricePerKg)).toFixed(2)
                                                const mat = M[item.type]
                                                return (
                                                    <motion.div key={item.id}
                                                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '0.6rem',
                                                            background: editId === item.id ? 'rgba(255,193,7,0.08)' : 'var(--bg-card-2)',
                                                            border: `1px solid ${editId === item.id ? 'var(--accent)' : 'var(--border)'}`,
                                                        }}>
                                                        <div>
                                                            <p style={{ fontWeight: 700 }}>{mat?.icon} {mat?.label}</p>
                                                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                                {item.weight} kg × ₹{item.pricePerKg}/kg
                                                            </p>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>₹{sub}</span>
                                                            <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => handleEditItem(item)}><FiEdit2 size={14} /></button>
                                                            <button className="btn btn-danger" style={{ padding: '0.3rem' }} onClick={() => handleRemoveItem(item.id)}><FiTrash2 size={14} /></button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>

                                        {/* Grand total */}
                                        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Amount to Pay</span>
                                            <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary-light)' }}>₹{grandTotal.toFixed(2)}</span>
                                        </div>

                                        {/* Proceed to confirm */}
                                        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.25rem' }}
                                            onClick={() => setPhase('confirm')}>
                                            Review & Confirm Payment →
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════
                            PHASE 2 — CONFIRM
                            ════════════════════════════════════════ */}
                        {phase === 'confirm' && (
                            <motion.div key="confirm" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>💳 Payment Confirmation</h3>

                                {items.map((item, i) => {
                                    const mat = M[item.type]
                                    const sub = (parseFloat(item.weight) * parseFloat(item.pricePerKg)).toFixed(2)
                                    return (
                                        <div key={item.id} style={{ padding: '0.7rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{mat?.icon} {mat?.label} &nbsp;<span className="text-muted" style={{ fontSize: '0.82rem' }}>{item.weight} kg @ ₹{item.pricePerKg}</span></span>
                                            <span style={{ fontWeight: 700 }}>₹{sub}</span>
                                        </div>
                                    )
                                })}

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TOTAL DUE</span>
                                    <span style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--primary-light)' }}>₹{grandTotal.toFixed(2)}</span>
                                </div>

                                <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.82rem', margin: '0.75rem 0 1.5rem' }}>
                                    The entire amount is paid all at once for all materials.
                                </p>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn btn-ghost" onClick={() => setPhase('compose')}>← Edit</button>
                                    <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmitAll} disabled={loading}>
                                        {loading ? '...' : '✅ Confirm & Log All Transactions'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════
                            PHASE 3 — DONE
                            ════════════════════════════════════════ */}
                        {phase === 'done' && (
                            <motion.div key="done" className="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '2.5rem' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✅</div>
                                <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary-light)' }}>All Transactions Logged!</h2>
                                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{items.length} material{items.length > 1 ? 's' : ''} processed</p>

                                {/* Per-material results */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {results.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                            <span>{M[items[i]?.type]?.icon} {M[items[i]?.type]?.label}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 700 }}>₹{r?.amountPaid?.toFixed(2)}</span>
                                                {r?.kCoinsEarned > 0 && <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>🪙 +{r.kCoinsEarned}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total summary */}
                                <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
                                    <div className="card stat-card">
                                        <div className="stat-value">₹{results.reduce((s, r) => s + (r?.amountPaid || 0), 0).toFixed(2)}</div>
                                        <div className="stat-label">Total Paid</div>
                                    </div>
                                    <div className="card stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
                                        <div className="stat-value" style={{ color: 'var(--accent)' }}>🪙 {results.reduce((s, r) => s + (r?.kCoinsEarned || 0), 0)}</div>
                                        <div className="stat-label">K-Coins Earned</div>
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-full" onClick={resetAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <FiPlus /> Log Another Batch
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}
