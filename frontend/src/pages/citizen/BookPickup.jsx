import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { createBooking } from '../../api/bookingApi.js'
import { getCitizenProfile } from '../../api/citizenApi.js'
import { getPriorityKabadi, getNearbyKabadi } from '../../api/kabadiApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiTrash2, FiCheck, FiPlus, FiMapPin } from 'react-icons/fi'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const MATERIALS = [
    { type: 'PLASTIC', icon: '🧴' }, { type: 'PAPER', icon: '📄' },
    { type: 'METAL', icon: '🔩' }, { type: 'GLASS', icon: '🪟' }, { type: 'E_WASTE', icon: '💻' },
]
const MATERIAL_MAP = Object.fromEntries(MATERIALS.map(m => [m.type, m.icon]))

const homeIcon = new L.DivIcon({
    html: `<div style="background:#1565C0;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">🏠</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15], className: ''
})
const priorityIcon = new L.DivIcon({
    html: `<div style="background:#F57F17;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">⭐</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15], className: ''
})
const kabadiIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30]
})

function FlyTo({ pos }) {
    const map = useMap()
    useEffect(() => { if (pos) map.flyTo(pos, 13, { animate: true, duration: 1 }) }, [pos, map])
    return null
}

async function geocodeAddress(addressLine1, pincode) {
    const q = encodeURIComponent(`${addressLine1 || ''} ${pincode || ''} India`)
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        if (data?.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    } catch { }
    return null
}

// Steps: 'booking' → 'findKabadi' → done (confirm shows)
export default function BookPickup() {
    const { t } = useTranslation()
    const [profile, setProfile] = useState(null)

    // Booking list state
    const [selectedMaterials, setSelectedMaterials] = useState([])
    const [totalWeight, setTotalWeight] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [pickupAddress, setPickupAddress] = useState('')
    const [pendingList, setPendingList] = useState([])
    const [editingId, setEditingId] = useState(null)

    // Flow steps: 'booking' | 'findKabadi'
    const [flowStep, setFlowStep] = useState('booking')

    // Kabadi selection state
    const [userPos, setUserPos] = useState(null)
    const [kabadis, setKabadis] = useState([])
    const [selectedKabadi, setSelectedKabadi] = useState(null)
    const [searchPhase, setSearchPhase] = useState('idle') // idle | priority | normal
    const [kabadiLoading, setKabadiLoading] = useState(false)
    const [countdown, setCountdown] = useState(30)
    const timerRef = useRef(null)

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getCitizenProfile().then(r => {
            const p = r.data.data
            setProfile(p)
            const addr = [p.addressLine1, p.addressLine2, p.pincode].filter(Boolean).join(', ')
            setPickupAddress(addr)
            // Geocode for map
            geocodeAddress(p.addressLine1, p.pincode).then(coords => {
                if (coords) setUserPos(coords)
            })
        }).catch(() => { })

        return () => clearInterval(timerRef.current)
    }, [])

    // ── Booking list helpers ─────────────────────────────────────
    const toggleMaterial = (type) =>
        setSelectedMaterials(prev => prev.includes(type) ? prev.filter(m => m !== type) : [...prev, type])

    const handleAddToList = () => {
        if (selectedMaterials.length === 0) return toast.error('Select at least one material type')
        if (editingId !== null) {
            setPendingList(prev => prev.map(item =>
                item.id === editingId ? { ...item, materials: selectedMaterials, weight: totalWeight, scheduledAt, pickupAddress } : item
            ))
            setEditingId(null)
            toast.success('Item updated')
        } else {
            setPendingList(prev => [...prev, { id: Date.now(), materials: selectedMaterials, weight: totalWeight, scheduledAt, pickupAddress }])
            toast.success('Added to list')
        }
        setSelectedMaterials([])
        setTotalWeight('')
    }

    const handleEditItem = (item) => { setSelectedMaterials([...item.materials]); setTotalWeight(item.weight); setScheduledAt(item.scheduledAt); setPickupAddress(item.pickupAddress); setEditingId(item.id) }
    const handleRemoveItem = (id) => { setPendingList(prev => prev.filter(item => item.id !== id)); if (editingId === id) { setEditingId(null); setSelectedMaterials([]) } }

    const goToFindKabadi = () => {
        if (pendingList.length === 0) return toast.error('Add at least one item to the list first')
        setFlowStep('findKabadi')
    }

    // ── Kabadi search ─────────────────────────────────────────────
    const startNormalSearch = useCallback(async (lat, lng, r = 5) => {
        setSearchPhase('normal')
        try {
            const res = await getNearbyKabadi(lat, lng, r)
            setKabadis(res.data.data || [])
        } catch { toast.error(t('toast.error')) }
    }, [t])

    const handleKabadiSearch = useCallback(async () => {
        setKabadiLoading(true)
        clearInterval(timerRef.current)
        try {
            let lat, lng
            if (userPos) { [lat, lng] = userPos }
            else {
                const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }))
                lat = pos.coords.latitude; lng = pos.coords.longitude
                setUserPos([lat, lng])
            }
            const priorityRes = await getPriorityKabadi(lat, lng)
            const priorityList = priorityRes.data.data || []
            if (priorityList.length > 0) {
                setKabadis(priorityList)
                setSearchPhase('priority')
                setCountdown(30)
                timerRef.current = setInterval(() => {
                    setCountdown(p => {
                        if (p <= 1) { clearInterval(timerRef.current); startNormalSearch(lat, lng); return 0 }
                        return p - 1
                    })
                }, 1000)
            } else { startNormalSearch(lat, lng) }
        } catch { toast.error('Could not get location') }
        finally { setKabadiLoading(false) }
    }, [userPos, startNormalSearch])

    // ── Final save ────────────────────────────────────────────────
    const handleSaveAll = async () => {
        if (!selectedKabadi) return toast.error('Please select a Kabadi-wala first')
        setSaving(true)
        try {
            const promises = pendingList.flatMap(item =>
                item.materials.map(mat => createBooking({
                    userId: profile?.id,
                    materialType: mat,
                    expectedWeightKg: item.weight ? parseFloat(item.weight) / item.materials.length : null,
                    scheduledAt: item.scheduledAt || null,
                    pickupAddress: item.pickupAddress || null,
                    kabadiWalaId: selectedKabadi.id,
                }))
            )
            await Promise.all(promises)
            toast.success(`✅ ${promises.length} pickup(s) booked with ${selectedKabadi.name}!`)
            setPendingList([]); setSelectedKabadi(null); setFlowStep('booking')
        } catch (e) { toast.error(e.response?.data?.message || t('toast.error')) }
        finally { setSaving(false) }
    }

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 720 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

                    {/* ── Progress Steps ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
                        {['📋 Book Pickup', '🔍 Find Kabadi', '✅ Confirm'].map((label, i) => {
                            const done = (i === 0 && flowStep !== 'booking') || (i === 1 && selectedKabadi)
                            const active = (i === 0 && flowStep === 'booking') || (i === 1 && flowStep === 'findKabadi') || (i === 2 && selectedKabadi && flowStep === 'findKabadi')
                            return (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: i < 2 ? 1 : 0 }}>
                                    <div style={{
                                        padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                                        background: done ? 'rgba(46,125,50,0.2)' : active ? 'rgba(46,125,50,0.1)' : 'var(--bg-card-2)',
                                        color: done || active ? 'var(--primary-light)' : 'var(--text-muted)',
                                        border: `1.5px solid ${done || active ? 'var(--primary)' : 'var(--border)'}`
                                    }}>{label}</div>
                                    {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
                                </div>
                            )
                        })}
                    </div>

                    {/* ══ STEP 1: Book Pickup ══ */}
                    {flowStep === 'booking' && (
                        <>
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
                                    {editingId !== null ? '✏️ Edit Item' : '📅 ' + t('booking.schedule')}
                                </h1>

                                {/* Multi-select chips */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
                                        {t('booking.material')} <span style={{ color: 'var(--danger)' }}>*</span>
                                        <span className="text-muted" style={{ fontWeight: 400, marginLeft: '0.5rem' }}>(one or more)</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        {MATERIALS.map(m => {
                                            const sel = selectedMaterials.includes(m.type)
                                            return (
                                                <button key={m.type} onClick={() => toggleMaterial(m.type)} style={{
                                                    padding: '0.55rem 1rem', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem',
                                                    border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                                                    background: sel ? 'rgba(46,125,50,0.16)' : 'var(--bg-card-2)',
                                                    cursor: 'pointer', color: 'var(--text)', transition: 'all 0.15s',
                                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                    boxShadow: sel ? '0 0 0 3px rgba(46,125,50,0.18)' : 'none'
                                                }}>
                                                    {sel && <FiCheck size={13} style={{ color: 'var(--primary)' }} />}
                                                    {m.icon} {m.type}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '0.9rem' }}>
                                    <label>{t('booking.expectedWeight')} <span className="text-muted" style={{ fontWeight: 400 }}>(optional total kg)</span></label>
                                    <input className="input" type="number" min="0" step="0.5" placeholder="e.g. 5.0" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '0.9rem' }}>
                                    <label>{t('booking.pickupAddress')}</label>
                                    <input className="input" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <label>{t('booking.scheduledAt')}</label>
                                    <input className="input" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                                </div>

                                <button className="btn btn-primary btn-full" onClick={handleAddToList}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {editingId !== null ? <><FiCheck /> Update Item</> : <><FiPlus /> Add to Pickup List</>}
                                </button>
                                {editingId !== null && (
                                    <button className="btn btn-ghost btn-full" style={{ marginTop: '0.5rem' }}
                                        onClick={() => { setEditingId(null); setSelectedMaterials([]); setTotalWeight('') }}>
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {/* Pending list */}
                            {pendingList.length > 0 && (
                                <div className="card">
                                    <h3 className="section-title" style={{ marginBottom: '1rem' }}>🗂️ Pickup List ({pendingList.length})</h3>
                                    <AnimatePresence>
                                        {pendingList.map(item => (
                                            <motion.div key={item.id}
                                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
                                                style={{
                                                    padding: '0.9rem', borderRadius: 10, marginBottom: '0.7rem',
                                                    background: editingId === item.id ? 'rgba(46,125,50,0.08)' : 'var(--bg-card-2)',
                                                    border: `1px solid ${editingId === item.id ? 'var(--primary)' : 'var(--border)'}`,
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'
                                                }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                                                        {item.materials.map(mat => (
                                                            <span key={mat} style={{ background: 'rgba(46,125,50,0.15)', color: 'var(--primary-light)', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                                                {MATERIAL_MAP[mat]} {mat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        {item.weight ? `~${item.weight} kg` : 'Flexible weight'}{item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString('en-IN')}` : ''}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '0.35rem' }} onClick={() => handleEditItem(item)}><FiEdit2 size={14} /></button>
                                                    <button className="btn btn-danger" style={{ padding: '0.35rem' }} onClick={() => handleRemoveItem(item.id)}><FiTrash2 size={14} /></button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* ─ Find Kabadi button ─ */}
                                    <button className="btn btn-primary btn-full" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        onClick={goToFindKabadi}>
                                        <FiMapPin /> Find Kabadi →
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ══ STEP 2: Find Kabadi ══ */}
                    {flowStep === 'findKabadi' && (
                        <div>
                            <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setFlowStep('booking')}>← Back to Pickup List</button>

                            {/* Priority banner */}
                            {searchPhase === 'priority' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--accent)', fontWeight: 700 }}>⭐ Priority Kabadi-walas available! ({countdown}s)</p>
                                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Other kabadi-walas load automatically after countdown</p>
                                </motion.div>
                            )}

                            {/* Map */}
                            <div style={{ borderRadius: 12, overflow: 'hidden', height: 280, marginBottom: '1rem', border: '1px solid var(--border)' }}>
                                <MapContainer center={userPos || [20.5937, 78.9629]} zoom={userPos ? 13 : 5} style={{ width: '100%', height: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {userPos && <FlyTo pos={userPos} />}
                                    {userPos && <Marker position={userPos} icon={homeIcon}><Popup>📍 Your location</Popup></Marker>}
                                    {userPos && searchPhase !== 'idle' && <Circle center={userPos} radius={5000} color="#2E7D32" fillOpacity={0.05} weight={2} />}
                                    {kabadis.map(k => k.latitude && k.longitude && (
                                        <Marker key={k.id} position={[k.latitude, k.longitude]} icon={k.priorityActive ? priorityIcon : kabadiIcon}>
                                            <Popup><strong>{k.name}</strong><br />{k.area}{k.priorityActive && <><br /><span style={{ color: '#F57F17' }}>⭐ Priority</span></>}</Popup>
                                        </Marker>
                                    ))}
                                    {selectedKabadi?.latitude && selectedKabadi?.longitude && (
                                        <Circle center={[selectedKabadi.latitude, selectedKabadi.longitude]} radius={80} color="#1565C0" fillOpacity={0.3} />
                                    )}
                                </MapContainer>
                            </div>

                            <button className="btn btn-primary btn-full" style={{ marginBottom: '1rem' }}
                                onClick={handleKabadiSearch} disabled={kabadiLoading}>
                                {kabadiLoading ? '...' : searchPhase === 'idle' ? '🔍 Search Kabadi Within 5 km' : '🔄 Search Again'}
                            </button>

                            {/* Kabadi cards */}
                            {kabadis.length === 0 && searchPhase !== 'idle' && !kabadiLoading && (
                                <p className="text-muted text-center" style={{ padding: '1.5rem' }}>No kabadi-walas found nearby.</p>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {kabadis.map(k => {
                                    const sel = selectedKabadi?.id === k.id
                                    return (
                                        <motion.div key={k.id} whileHover={{ y: -2 }}
                                            onClick={() => setSelectedKabadi(sel ? null : k)}
                                            style={{
                                                padding: '1rem', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                                                border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                                                background: sel ? 'rgba(46,125,50,0.1)' : 'var(--bg-card-2)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                            <div>
                                                <p style={{ fontWeight: 700 }}>{k.priorityActive ? '⭐' : '🛒'} {k.name}</p>
                                                <p className="text-muted" style={{ fontSize: '0.82rem' }}>{k.area}</p>
                                                {k.priorityActive && <span className="chip chip-warning" style={{ marginTop: '0.3rem', display: 'inline-block' }}>Priority Active</span>}
                                            </div>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                                                background: sel ? 'var(--primary)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {sel && <FiCheck size={13} color="#fff" />}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Confirm Booking — only shown after kabadi is selected */}
                            <AnimatePresence>
                                {selectedKabadi && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        <div style={{ background: 'rgba(46,125,50,0.08)', border: '1px solid var(--primary)', borderRadius: 10, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
                                            <p style={{ fontWeight: 700, color: 'var(--primary-light)' }}>✓ Selected: {selectedKabadi.name}</p>
                                            <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                                                {pendingList.length} item(s) · {pendingList.reduce((s, i) => s + i.materials.length, 0)} booking(s) will be created
                                            </p>
                                        </div>
                                        <button className="btn btn-primary btn-full btn-lg"
                                            onClick={handleSaveAll} disabled={saving}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            {saving ? '...' : '✅ Confirm Booking'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                </motion.div>
            </div>
        </div>
    )
}
