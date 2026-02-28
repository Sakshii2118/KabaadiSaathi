import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getKabadiDashboard, getKabadiTransactions, getKCoins, redeemKCoins } from '../../api/kabadiApi.js'
import { getKabadiBookings, updateBookingStatus } from '../../api/bookingApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const TABS = ['overview', 'transactions', 'bookings', 'kcoins']
const STATUS_COLORS = { PENDING: 'chip-warning', COMPLETED: 'chip-success', CANCELLED: 'chip-danger' }
const COMMODITIES = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste']

export default function KabadiDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [tab, setTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [txs, setTxs] = useState([])
    const [bookings, setBookings] = useState([])
    const [kcoins, setKcoins] = useState(null)
    const [filter, setFilter] = useState('monthly')
    const [redeemOpen, setRedeemOpen] = useState(false)
    const [commodity, setCommodity] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => { loadAll() }, [filter])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [s, tx, bk, kc] = await Promise.all([
                getKabadiDashboard(filter),
                getKabadiTransactions(filter),
                getKabadiBookings(),
                getKCoins()
            ])
            setStats(s.data.data)
            setTxs(tx.data.data || [])
            setBookings(bk.data.data || [])
            setKcoins(kc.data.data)
        } catch { toast.error(t('toast.error')) }
        finally { setLoading(false) }
    }

    const handleRedeem = async () => {
        if (!commodity) return toast.error('Select a commodity')
        try {
            await redeemKCoins({ selectedCommodity: commodity })
            toast.success('Redeemed successfully!')
            setRedeemOpen(false)
            loadAll()
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
    }

    const handleBookingStatus = async (id, status) => {
        try {
            await updateBookingStatus(id, status)
            toast.success('Booking updated')
            loadAll()
        } catch { toast.error(t('toast.error')) }
    }

    const MATERIAL_ICONS = { PLASTIC: '🧴', PAPER: '📄', METAL: '🔩', GLASS: '🪟', E_WASTE: '💻' }
    const thresholdKg = stats?.thresholdKg || 20
    const dailyPct = Math.min(((stats?.dailyCollectedKg || 0) / thresholdKg) * 100, 100)
    const kCoinPct = Math.min(((kcoins?.kCoinsBalance || 0) / 30) * 100, 100)

    return (
        <div className="page">
            <Navbar userType="KABADI" />
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🛒 {t('nav.dashboard')}</h1>
                        <div className="tabs">
                            {TABS.map(t2 => <button key={t2} className={`tab${tab === t2 ? ' active' : ''}`} onClick={() => setTab(t2)}>{t2.charAt(0).toUpperCase() + t2.slice(1)}</button>)}
                        </div>
                    </div>

                    {/* Filter */}
                    {(tab === 'overview' || tab === 'transactions') && (
                        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                            {['daily', 'monthly', 'yearly'].map(f => (
                                <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{t(`dashboard.${f}`)}</button>
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {tab === 'overview' && (
                            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                                    <div className="card stat-card"><div className="stat-value">⚖️ {stats?.totalCollectedKg?.toFixed(1) || 0} kg</div><div className="stat-label">Total Collected</div></div>
                                    <div className="card stat-card"><div className="stat-value">📦 {stats?.transactionCount || 0}</div><div className="stat-label">Transactions</div></div>
                                    <div className="card stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
                                        <div className="stat-value" style={{ color: 'var(--accent)' }}>🪙 {stats?.kCoinsBalance || 0}</div>
                                        <div className="stat-label">{t('kcoins.balance')}</div>
                                    </div>
                                </div>
                                {/* Daily progress */}
                                <div className="card">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📈 Daily Collection</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="text-muted">{stats?.dailyCollectedKg?.toFixed(1) || 0} / {thresholdKg} kg</span>
                                        {stats?.thresholdUnlocked && <span className="chip chip-success">✅ Unlocked!</span>}
                                    </div>
                                    <div style={{ background: 'var(--bg-card-2)', borderRadius: 100, height: 10, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${dailyPct}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: 'var(--primary)', borderRadius: 100 }} />
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/kabadi/log-transaction')}>+ Log Transaction</button>
                                </div>
                            </motion.div>
                        )}

                        {tab === 'transactions' && (
                            <motion.div key="tx" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
                                <h3 className="section-title">📋 Transactions</h3>
                                <div className="table-wrap">
                                    <table>
                                        <thead><tr><th>Date</th><th>Material</th><th>Weight</th><th>Amount</th><th>Citizen</th></tr></thead>
                                        <tbody>{txs.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.transactionTime).toLocaleDateString('en-IN')}</td>
                                                <td>{MATERIAL_ICONS[tx.materialType]} {tx.materialType}</td>
                                                <td>{tx.weightKg} kg</td>
                                                <td>₹{tx.amountPaid?.toFixed(2)}</td>
                                                <td>{tx.user?.name || 'Walk-in'}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {tab === 'bookings' && (
                            <motion.div key="bk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {bookings.length === 0 ? <div className="card text-center" style={{ padding: '3rem' }}><p className="text-muted">No bookings yet.</p></div> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {bookings.map(b => (
                                            <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                                <div>
                                                    <span className={`chip ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                                                    <p style={{ marginTop: '0.4rem' }}>📍 {b.pickupAddress || 'No address'}</p>
                                                    <p className="text-muted">{b.user?.name} · {b.materialType}</p>
                                                </div>
                                                {b.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleBookingStatus(b.id, 'COMPLETED')}>✅ Complete</button>
                                                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleBookingStatus(b.id, 'CANCELLED')}>❌ Cancel</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {tab === 'kcoins' && (
                            <motion.div key="kc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid-2">
                                    <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--accent)' }}>
                                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom: '0.75rem' }}>
                                            <circle className="progress-ring-track" cx="60" cy="60" r="50" strokeWidth="10" />
                                            <circle className="progress-ring-bar" cx="60" cy="60" r="50" strokeWidth="10" strokeDasharray={`${314 * kCoinPct / 100} 314`} transform="rotate(-90 60 60)" />
                                            <text x="60" y="65" textAnchor="middle" fill="var(--accent)" fontSize="22" fontWeight="800">{kcoins?.kCoinsBalance || 0}</text>
                                        </svg>
                                        <div className="stat-label">{t('kcoins.balance')}</div>
                                        {kcoins?.redemptionEligible && (
                                            <button className="btn btn-accent" style={{ marginTop: '1rem' }} onClick={() => setRedeemOpen(true)}>{t('kcoins.redeem')}</button>
                                        )}
                                        {!kcoins?.redemptionEligible && <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>Need 30 K-Coins to redeem</p>}
                                    </div>
                                    <div className="card">
                                        {kcoins?.priorityActive ? (
                                            <div>
                                                <span className="chip chip-warning" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>⭐ {t('kcoins.priority')}</span>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('kcoins.validUntil')}: {new Date(kcoins?.priorityExpiresAt).toLocaleString('en-IN')}</p>
                                                {kcoins?.activeRedemption && (
                                                    <div style={{ marginTop: '0.75rem', background: 'var(--bg-card-2)', borderRadius: 8, padding: '0.75rem' }}>
                                                        <p style={{ fontWeight: 600 }}>📦 {kcoins.activeRedemption.commodity}</p>
                                                        <p className="text-muted" style={{ fontSize: '0.82rem' }}>{kcoins.activeRedemption.coinsRedeemed} coins redeemed</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>How to earn K-Coins?</h4>
                                                <p className="text-muted" style={{ fontSize: '0.88rem' }}>Collect 20+ kg/day to unlock the threshold, then earn 5 K-Coins per extra kg.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Redeem Modal */}
            {redeemOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <motion.div className="card" initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: 420 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🪙 {t('kcoins.redeem')}</h3>
                        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>Select a commodity to get price discount for 2 days</p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            {COMMODITIES.map(c => (
                                <button key={c} onClick={() => setCommodity(c)} style={{ padding: '0.6rem 1rem', borderRadius: 8, border: `2px solid ${commodity === c ? 'var(--accent)' : 'var(--border)'}`, background: commodity === c ? 'rgba(255,193,7,0.15)' : 'var(--bg-card-2)', cursor: 'pointer', color: 'var(--text)', fontWeight: 600 }}>{c}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-accent btn-full" onClick={handleRedeem}>Confirm Redemption</button>
                            <button className="btn btn-ghost" onClick={() => setRedeemOpen(false)}>Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
