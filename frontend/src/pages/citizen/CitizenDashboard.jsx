import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getCitizenDashboard, getCitizenTransactions } from '../../api/citizenApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Navbar from '../../components/Navbar.jsx'

export default function CitizenDashboard() {
    const { t } = useTranslation()
    const { auth } = useAuth()
    const [stats, setStats] = useState(null)
    const [txs, setTxs] = useState([])
    const [filter, setFilter] = useState('monthly')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [filter])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsRes, txRes] = await Promise.all([getCitizenDashboard(filter), getCitizenTransactions(filter)])
            setStats(statsRes.data.data)
            setTxs(txRes.data.data || [])
        } catch { toast.error(t('toast.error')) }
        finally { setLoading(false) }
    }

    const MATERIAL_ICONS = { PLASTIC: '🧴', PAPER: '📄', METAL: '🔩', GLASS: '🪟', E_WASTE: '💻' }

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{t('nav.dashboard')}</h1>
                            <p className="text-muted">{auth?.name}</p>
                        </div>
                        <div className="tabs">
                            {['daily', 'monthly', 'yearly'].map(f => (
                                <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                                    {t(`dashboard.${f}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid-2" style={{ marginBottom: '2rem' }}>
                        <StatCard icon="💰" label={t('dashboard.totalEarnings')} value={`₹${stats?.totalEarnings?.toFixed(2) || '0.00'}`} color="#FFC107" />
                        <StatCard icon="♻️" label={t('dashboard.totalWaste')} value={`${stats?.totalWasteSoldKg?.toFixed(2) || '0'} kg`} color="#43A047" />
                    </div>

                    {/* Transactions */}
                    <div className="card">
                        <h3 className="section-title">📋 {t('dashboard.transactions')}</h3>
                        {loading ? <Spinner /> : txs.length === 0 ? (
                            <p className="text-muted text-center" style={{ padding: '2rem' }}>No transactions found.</p>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead><tr>
                                        <th>{t('dashboard.date')}</th>
                                        <th>{t('dashboard.material')}</th>
                                        <th>{t('dashboard.weight')}</th>
                                        <th>{t('dashboard.amount')}</th>
                                        <th>{t('dashboard.kabadi')}</th>
                                    </tr></thead>
                                    <tbody>{txs.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{new Date(tx.transactionTime).toLocaleDateString('en-IN')}</td>
                                            <td>{MATERIAL_ICONS[tx.materialType] || ''} {tx.materialType}</td>
                                            <td>{tx.weightKg} kg</td>
                                            <td>₹{tx.amountPaid?.toFixed(2)}</td>
                                            <td>{tx.kabadiWala?.name || '-'}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }) {
    return (
        <motion.div className="card stat-card" whileHover={{ y: -4 }} style={{ borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
        </motion.div>
    )
}

function Spinner() {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="loading-spinner" /></div>
}
