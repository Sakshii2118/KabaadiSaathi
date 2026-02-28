import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getAdminOverview, getAdminUsers, getAdminKabadis, getAdminTransactions, getAdminConfig, updateAdminConfig } from '../../api/adminApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = ['overview', 'users', 'kabadis', 'transactions', 'config']

export default function AdminDashboard() {
    const { t } = useTranslation()
    const { auth, logout } = useAuth()
    const [tab, setTab] = useState('overview')
    const [overview, setOverview] = useState(null)
    const [users, setUsers] = useState([])
    const [kabadis, setKabadis] = useState([])
    const [txs, setTxs] = useState([])
    const [config, setConfig] = useState([])
    const [editConfig, setEditConfig] = useState({})

    useEffect(() => { getAdminOverview().then(r => setOverview(r.data.data)) }, [])
    useEffect(() => {
        if (tab === 'users') getAdminUsers().then(r => setUsers(r.data.data || []))
        if (tab === 'kabadis') getAdminKabadis().then(r => setKabadis(r.data.data || []))
        if (tab === 'transactions') getAdminTransactions().then(r => setTxs(r.data.data || []))
        if (tab === 'config') getAdminConfig().then(r => { setConfig(r.data.data || []); const e = {}; r.data.data?.forEach(c => { e[c.configKey] = c.configValue }); setEditConfig(e) })
    }, [tab])

    const saveConfig = async (key) => {
        try {
            await updateAdminConfig(key, editConfig[key])
            toast.success('Config saved')
        } catch { toast.error(t('toast.error')) }
    }

    return (
        <div className="page">
            <Navbar userType="ADMIN" />
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <h1 style={{ fontWeight: 800 }}>🔐 {t('admin.overview')}</h1>
                        <div className="tabs">
                            {TABS.map(tb => <button key={tb} className={`tab${tab === tb ? ' active' : ''}`} onClick={() => setTab(tb)}>{t(`admin.${tb}`)}</button>)}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'overview' && (
                            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {overview && (
                                    <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                                        <div className="card stat-card"><div className="stat-value">{overview.totalUsers}</div><div className="stat-label">Citizens</div></div>
                                        <div className="card stat-card"><div className="stat-value">{overview.totalKabadis}</div><div className="stat-label">Kabadi-walas</div></div>
                                        <div className="card stat-card"><div className="stat-value">{overview.totalTransactions}</div><div className="stat-label">Transactions</div></div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {tab === 'users' && (
                            <motion.div key="us" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
                                <h3 className="section-title">{t('admin.users')}</h3>
                                <div className="table-wrap">
                                    <table>
                                        <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Waste-Recycler ID</th><th>Pincode</th></tr></thead>
                                        <tbody>{users.map(u => (
                                            <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.mobile}</td><td>{u.wasteRecyclerId || '-'}</td><td>{u.pincode || '-'}</td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {tab === 'kabadis' && (
                            <motion.div key="kab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
                                <h3 className="section-title">{t('admin.kabadis')}</h3>
                                <div className="table-wrap">
                                    <table>
                                        <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Area</th><th>K-Coins</th><th>Priority</th></tr></thead>
                                        <tbody>{kabadis.map(k => (
                                            <tr key={k.id}><td>{k.id}</td><td>{k.name}</td><td>{k.mobile}</td><td>{k.area}</td><td>{k.kCoinsBalance}</td>
                                                <td>{k.priorityActive ? <span className="chip chip-warning">⭐ Active</span> : '—'}</td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {tab === 'transactions' && (
                            <motion.div key="tx" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
                                <h3 className="section-title">{t('admin.transactions')}</h3>
                                <div className="table-wrap">
                                    <table>
                                        <thead><tr><th>ID</th><th>Material</th><th>Weight</th><th>Amount</th><th>Date</th></tr></thead>
                                        <tbody>{txs.map(tx => (
                                            <tr key={tx.id}><td>{tx.id}</td><td>{tx.materialType}</td><td>{tx.weightKg} kg</td><td>₹{tx.amountPaid?.toFixed(2)}</td>
                                                <td>{new Date(tx.transactionTime).toLocaleDateString('en-IN')}</td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {tab === 'config' && (
                            <motion.div key="cfg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
                                <h3 className="section-title">{t('admin.config')}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {config.map(c => (
                                        <div key={c.configKey} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ flex: 1, fontWeight: 500 }}>{c.configKey}</span>
                                            <input className="input" style={{ width: 120 }} value={editConfig[c.configKey] || ''} onChange={e => setEditConfig(p => ({ ...p, [c.configKey]: e.target.value }))} />
                                            <button className="btn btn-primary" style={{ padding: '0.5rem 0.9rem' }} onClick={() => saveConfig(c.configKey)}>Save</button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}
