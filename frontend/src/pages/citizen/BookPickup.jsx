import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { createBooking } from '../../api/bookingApi.js'
import { getCitizenProfile } from '../../api/citizenApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiTrash2, FiCheck, FiPlus } from 'react-icons/fi'

const MATERIALS = [
    { type: 'PLASTIC', icon: '🧴' },
    { type: 'PAPER', icon: '📄' },
    { type: 'METAL', icon: '🔩' },
    { type: 'GLASS', icon: '🪟' },
    { type: 'E_WASTE', icon: '💻' },
]

export default function BookPickup() {
    const { t } = useTranslation()
    const [profile, setProfile] = useState(null)
    const [selectedMaterials, setSelectedMaterials] = useState([])
    const [totalWeight, setTotalWeight] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [pickupAddress, setPickupAddress] = useState('')
    const [pendingList, setPendingList] = useState([]) // { id, materials[], weight, scheduledAt, pickupAddress }
    const [editingId, setEditingId] = useState(null) // which pending item is being edited
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getCitizenProfile().then(r => {
            const p = r.data.data
            setProfile(p)
            const addr = [p.addressLine1, p.addressLine2, p.pincode].filter(Boolean).join(', ')
            setPickupAddress(addr)
        }).catch(() => { })
    }, [])

    const toggleMaterial = (type) => {
        setSelectedMaterials(prev =>
            prev.includes(type) ? prev.filter(m => m !== type) : [...prev, type]
        )
    }

    const handleAddToList = () => {
        if (selectedMaterials.length === 0) return toast.error('Select at least one material type')

        if (editingId !== null) {
            // Update existing item
            setPendingList(prev => prev.map(item =>
                item.id === editingId
                    ? { ...item, materials: selectedMaterials, weight: totalWeight, scheduledAt, pickupAddress }
                    : item
            ))
            setEditingId(null)
            toast.success('Item updated')
        } else {
            // Add new item
            const newItem = {
                id: Date.now(),
                materials: selectedMaterials,
                weight: totalWeight,
                scheduledAt,
                pickupAddress,
            }
            setPendingList(prev => [...prev, newItem])
            toast.success('Added to list')
        }

        // Reset selector
        setSelectedMaterials([])
        setTotalWeight('')
    }

    const handleEditItem = (item) => {
        setSelectedMaterials([...item.materials])
        setTotalWeight(item.weight)
        setScheduledAt(item.scheduledAt)
        setPickupAddress(item.pickupAddress)
        setEditingId(item.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleRemoveItem = (id) => {
        setPendingList(prev => prev.filter(item => item.id !== id))
        if (editingId === id) {
            setEditingId(null)
            setSelectedMaterials([])
            setTotalWeight('')
        }
    }

    const handleSaveAll = async () => {
        if (pendingList.length === 0) return toast.error('Add at least one item to the list')
        setSaving(true)
        try {
            // Create one booking per (item × material)
            const promises = pendingList.flatMap(item =>
                item.materials.map(mat =>
                    createBooking({
                        userId: profile?.id,
                        materialType: mat,
                        expectedWeightKg: item.weight ? parseFloat(item.weight) / item.materials.length : null,
                        scheduledAt: item.scheduledAt || null,
                        pickupAddress: item.pickupAddress || null,
                    })
                )
            )
            await Promise.all(promises)
            toast.success(`✅ ${promises.length} pickup(s) booked!`)
            setPendingList([])
            setSelectedMaterials([])
            setTotalWeight('')
        } catch (e) {
            toast.error(e.response?.data?.message || t('toast.error'))
        } finally {
            setSaving(false)
        }
    }

    const MATERIAL_MAP = Object.fromEntries(MATERIALS.map(m => [m.type, m.icon]))

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 680 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

                    {/* ── Booking Form ── */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
                            📅 {editingId !== null ? '✏️ Edit Item' : t('booking.schedule')}
                        </h1>

                        {/* Multi-select Material chips */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
                                {t('booking.material')} <span style={{ color: 'var(--danger)' }}>*</span>
                                <span className="text-muted" style={{ fontWeight: 400, marginLeft: '0.5rem' }}>(select one or more)</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {MATERIALS.map(m => {
                                    const selected = selectedMaterials.includes(m.type)
                                    return (
                                        <button key={m.type} onClick={() => toggleMaterial(m.type)}
                                            style={{
                                                padding: '0.6rem 1.1rem', borderRadius: 10,
                                                border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                                                background: selected ? 'rgba(46,125,50,0.18)' : 'var(--bg-card-2)',
                                                cursor: 'pointer', color: 'var(--text)', fontWeight: 600,
                                                fontSize: '0.9rem', transition: 'all 0.18s',
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                boxShadow: selected ? '0 0 0 3px rgba(46,125,50,0.2)' : 'none'
                                            }}>
                                            {selected && <FiCheck size={14} style={{ color: 'var(--primary)' }} />}
                                            {m.icon} {m.type}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Total weight */}
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>{t('booking.expectedWeight')} <span className="text-muted" style={{ fontWeight: 400 }}>(optional, total kg)</span></label>
                            <input className="input" type="number" min="0" step="0.5"
                                placeholder="e.g. 5.0"
                                value={totalWeight}
                                onChange={e => setTotalWeight(e.target.value)} />
                        </div>

                        {/* Pickup address */}
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>{t('booking.pickupAddress')}</label>
                            <input className="input" value={pickupAddress}
                                onChange={e => setPickupAddress(e.target.value)} />
                        </div>

                        {/* Scheduled date */}
                        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                            <label>{t('booking.scheduledAt')}</label>
                            <input className="input" type="datetime-local" value={scheduledAt}
                                onChange={e => setScheduledAt(e.target.value)} />
                        </div>

                        <button className="btn btn-primary btn-full"
                            onClick={handleAddToList}
                            style={{ gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {editingId !== null
                                ? <><FiCheck /> Update Item</>
                                : <><FiPlus /> Add to Pickup List</>}
                        </button>
                        {editingId !== null && (
                            <button className="btn btn-ghost btn-full" style={{ marginTop: '0.5rem' }}
                                onClick={() => { setEditingId(null); setSelectedMaterials([]); setTotalWeight('') }}>
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    {/* ── Pending Pickup List ── */}
                    {pendingList.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="section-title" style={{ margin: 0 }}>🗂️ Pickup List ({pendingList.length})</h3>
                                <button className="btn btn-primary"
                                    onClick={handleSaveAll}
                                    disabled={saving}
                                    style={{ padding: '0.5rem 1.25rem' }}>
                                    {saving ? '...' : '✅ Save All Pickups'}
                                </button>
                            </div>

                            <AnimatePresence>
                                {pendingList.map((item, idx) => (
                                    <motion.div key={item.id}
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                                        style={{
                                            padding: '1rem', borderRadius: 10, marginBottom: '0.75rem',
                                            background: editingId === item.id ? 'rgba(46,125,50,0.08)' : 'var(--bg-card-2)',
                                            border: `1px solid ${editingId === item.id ? 'var(--primary)' : 'var(--border)'}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
                                        }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                                {item.materials.map(mat => (
                                                    <span key={mat} style={{
                                                        background: 'rgba(46,125,50,0.15)', color: 'var(--primary-light)',
                                                        borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.82rem', fontWeight: 700
                                                    }}>
                                                        {MATERIAL_MAP[mat]} {mat}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                                                {item.weight ? `~${item.weight} kg total` : 'Weight: flexible'}
                                                {item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString('en-IN')}` : ''}
                                            </p>
                                            {item.pickupAddress && (
                                                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>📍 {item.pickupAddress}</p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-ghost" style={{ padding: '0.4rem' }}
                                                onClick={() => handleEditItem(item)} title="Edit">
                                                <FiEdit2 size={15} />
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.4rem' }}
                                                onClick={() => handleRemoveItem(item.id)} title="Remove">
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
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
