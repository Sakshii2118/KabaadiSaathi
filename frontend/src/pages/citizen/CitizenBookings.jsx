import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getCitizenBookings, cancelBooking, updateBooking } from '../../api/bookingApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi'

const STATUS_COLORS = { PENDING: 'chip-warning', COMPLETED: 'chip-success', CANCELLED: 'chip-danger' }
const MATERIALS = [
    { type: 'PLASTIC', icon: '🧴' }, { type: 'PAPER', icon: '📄' },
    { type: 'METAL', icon: '🔩' }, { type: 'GLASS', icon: '🪟' }, { type: 'E_WASTE', icon: '💻' }
]
const MATERIAL_MAP = Object.fromEntries(MATERIALS.map(m => [m.type, m.icon]))

export default function CitizenBookings() {
    const { t } = useTranslation()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ materialType: '', expectedWeightKg: '' })
    const [editSaving, setEditSaving] = useState(false)

    useEffect(() => { fetchBookings() }, [])

    const fetchBookings = async () => {
        try {
            const res = await getCitizenBookings()
            setBookings(res.data.data || [])
        } catch { toast.error(t('toast.error')) }
        finally { setLoading(false) }
    }

    const handleCancel = async (id) => {
        if (!confirm('Cancel this booking?')) return
        try {
            await cancelBooking(id)
            toast.success('Booking cancelled')
            fetchBookings()
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
    }

    const startEdit = (b) => {
        setEditingId(b.id)
        setEditForm({ materialType: b.materialType || '', expectedWeightKg: b.expectedWeightKg || '' })
    }

    const handleUpdate = async () => {
        if (!editForm.materialType) return toast.error('Select a material type')
        setEditSaving(true)
        try {
            await updateBooking(editingId, {
                materialType: editForm.materialType,
                expectedWeightKg: editForm.expectedWeightKg ? parseFloat(editForm.expectedWeightKg) : null
            })
            toast.success('Booking updated')
            setEditingId(null)
            fetchBookings()
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setEditSaving(false) }
    }

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>{t('nav.bookings')}</h1>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
                    ) : bookings.length === 0 ? (
                        <div className="card text-center" style={{ padding: '3rem' }}>
                            <p style={{ fontSize: '2rem' }}>📭</p>
                            <p className="text-muted">No bookings yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <AnimatePresence>
                                {bookings.map(b => (
                                    <motion.div key={b.id} className="card"
                                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        style={{ padding: '1.25rem' }}>

                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                                    <span className={`chip ${STATUS_COLORS[b.status] || 'chip-info'}`}>{t(`booking.status.${b.status}`)}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</span>
                                                </div>
                                                <p style={{ fontWeight: 600 }}>📍 {b.pickupAddress || 'No address'}</p>
                                                {b.materialType && (
                                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                        {MATERIAL_MAP[b.materialType] || ''} {b.materialType}
                                                        {b.expectedWeightKg ? ` · ~${b.expectedWeightKg} kg` : ''}
                                                        {b.scheduledAt ? ` · ${new Date(b.scheduledAt).toLocaleString('en-IN')}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            {b.status === 'PENDING' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                        onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)}>
                                                        {editingId === b.id ? <FiX /> : <><FiEdit2 /> Edit</>}
                                                    </button>
                                                    <button className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                        onClick={() => handleCancel(b.id)}>Cancel</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inline edit panel */}
                                        <AnimatePresence>
                                            {editingId === b.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    style={{ overflow: 'hidden', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                                    <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>✏️ Edit Booking</p>

                                                    {/* Material chips */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                                        {MATERIALS.map(m => (
                                                            <button key={m.type}
                                                                onClick={() => setEditForm(p => ({ ...p, materialType: m.type }))}
                                                                style={{
                                                                    padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                                                                    border: `2px solid ${editForm.materialType === m.type ? 'var(--primary)' : 'var(--border)'}`,
                                                                    background: editForm.materialType === m.type ? 'rgba(46,125,50,0.15)' : 'var(--bg-card-2)',
                                                                    cursor: 'pointer', color: 'var(--text)', transition: 'all 0.15s'
                                                                }}>
                                                                {m.icon} {m.type}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Weight */}
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Weight (kg, optional)</label>
                                                            <input className="input" type="number" min="0" step="0.5"
                                                                value={editForm.expectedWeightKg}
                                                                onChange={e => setEditForm(p => ({ ...p, expectedWeightKg: e.target.value }))} />
                                                        </div>
                                                        <button className="btn btn-primary" onClick={handleUpdate} disabled={editSaving}
                                                            style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            {editSaving ? '...' : <><FiCheck /> Save</>}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
