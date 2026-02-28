import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getPriorityKabadi, getNearbyKabadi } from '../../api/kabadiApi.js'
import { getCitizenProfile } from '../../api/citizenApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// ── Custom marker icons ────────────────────────────────────────────
const kabadiIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
})

const homeIcon = new L.DivIcon({
    html: `<div style="background:#1565C0;color:#fff;border-radius:50%;width:34px;height:34px;
           display:flex;align-items:center;justify-content:center;font-size:18px;
           border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🏠</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], className: ''
})

const priorityIcon = new L.DivIcon({
    html: `<div style="background:#F57F17;color:#fff;border-radius:50%;width:34px;height:34px;
           display:flex;align-items:center;justify-content:center;font-size:18px;
           border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">⭐</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], className: ''
})

// Recenter map helper
function FlyTo({ pos }) {
    const map = useMap()
    useEffect(() => { if (pos) map.flyTo(pos, 13, { animate: true, duration: 1 }) }, [pos, map])
    return null
}

// Geocode address via OpenStreetMap Nominatim (free, no key)
async function geocodeAddress(addressLine1, pincode) {
    const q = encodeURIComponent(`${addressLine1 || ''} ${pincode || ''} India`)
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        if (data?.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    } catch { /* fallback to browser geolocation */ }
    return null
}

export default function FindKabadi() {
    const { t } = useTranslation()
    const [phase, setPhase] = useState('idle')        // idle | priority | normal
    const [kabadis, setKabadis] = useState([])
    const [radius, setRadius] = useState(5)
    const [countdown, setCountdown] = useState(30)
    const [userPos, setUserPos] = useState(null)      // [lat, lng] — citizen's geocoded home
    const [searchPos, setSearchPos] = useState(null)  // [lat, lng] used for kabadi search
    const [loading, setLoading] = useState(false)
    const [geocoding, setGeocoding] = useState(true)
    const timerRef = useRef(null)
    const expandRef = useRef(null)

    // ── Geocode citizen's profile address on mount ────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const res = await getCitizenProfile()
                const p = res.data.data
                const coords = await geocodeAddress(p.addressLine1, p.pincode)
                if (coords) {
                    setUserPos(coords)
                    setSearchPos(coords)
                } else {
                    // Fallback: browser geolocation
                    navigator.geolocation.getCurrentPosition(
                        pos => {
                            const c = [pos.coords.latitude, pos.coords.longitude]
                            setUserPos(c)
                            setSearchPos(c)
                        },
                        () => toast('📍 Could not locate you. Enter address in Profile first.', { icon: '⚠️' })
                    )
                }
            } catch { /* ignore */ }
            finally { setGeocoding(false) }
        }
        init()
        return () => { clearInterval(timerRef.current); clearTimeout(expandRef.current) }
    }, [])

    // ── Normal search expanding every 30s up to 5 km ─────────────
    const startNormalSearch = useCallback(async (lat, lng, r = 5) => {
        setPhase('normal')
        setRadius(r)
        try {
            const res = await getNearbyKabadi(lat, lng, r)
            const list = res.data.data || []
            setKabadis(list)
            if (list.length === 0 && r < 5) {
                toast(t('toast.expandingSearch'))
                expandRef.current = setTimeout(() => startNormalSearch(lat, lng, r + 1), 30000)
            }
        } catch { toast.error(t('toast.error')) }
    }, [t])

    // ── Main search: priority first, then normal ──────────────────
    const startSearch = useCallback(async () => {
        setLoading(true)
        clearInterval(timerRef.current)
        clearTimeout(expandRef.current)
        try {
            let lat, lng
            if (searchPos) {
                [lat, lng] = searchPos
            } else {
                // Last-resort geolocation
                const pos = await new Promise((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
                )
                lat = pos.coords.latitude
                lng = pos.coords.longitude
                setUserPos([lat, lng])
                setSearchPos([lat, lng])
            }

            const priorityRes = await getPriorityKabadi(lat, lng)
            const priorityList = priorityRes.data.data || []

            if (priorityList.length > 0) {
                setKabadis(priorityList)
                setPhase('priority')
                setCountdown(30)
                timerRef.current = setInterval(() => {
                    setCountdown(p => {
                        if (p <= 1) {
                            clearInterval(timerRef.current)
                            startNormalSearch(lat, lng)
                            return 0
                        }
                        return p - 1
                    })
                }, 1000)
            } else {
                startNormalSearch(lat, lng)
            }
        } catch {
            toast.error('Could not get your location. Please allow location access.')
        } finally {
            setLoading(false)
        }
    }, [searchPos, startNormalSearch])

    const skipPriority = () => {
        clearInterval(timerRef.current)
        if (searchPos) startNormalSearch(searchPos[0], searchPos[1])
    }

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 64px)' }}>

                {/* ── Map ── */}
                <div style={{ position: 'relative' }}>
                    {geocoding && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            zIndex: 999, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1rem 2rem',
                            borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.75rem'
                        }}>
                            <div className="loading-spinner" /> Locating your address…
                        </div>
                    )}
                    <MapContainer
                        center={userPos || [20.5937, 78.9629]}
                        zoom={userPos ? 13 : 5}
                        style={{ width: '100%', height: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {/* Fly to citizen position when known */}
                        {userPos && <FlyTo pos={userPos} />}

                        {/* Citizen home marker */}
                        {userPos && (
                            <Marker position={userPos} icon={homeIcon}>
                                <Popup>📍 Your location</Popup>
                            </Marker>
                        )}

                        {/* Search radius circle */}
                        {userPos && phase !== 'idle' && (
                            <Circle center={userPos} radius={radius * 1000}
                                color="#2E7D32" fillColor="#2E7D32" fillOpacity={0.06} weight={2} />
                        )}

                        {/* Kabadi markers */}
                        {kabadis.map(k => k.latitude && k.longitude && (
                            <Marker key={k.id}
                                position={[k.latitude, k.longitude]}
                                icon={k.priorityActive ? priorityIcon : kabadiIcon}>
                                <Popup>
                                    <strong>{k.priorityActive ? '⭐ ' : ''}{k.name}</strong><br />
                                    {k.area}<br />
                                    {k.priorityActive && <span style={{ color: '#F57F17', fontWeight: 700 }}>Priority Active</span>}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* ── Sidebar ── */}
                <div style={{
                    background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
                    padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                    {/* Priority window banner */}
                    {phase === 'priority' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)',
                                borderRadius: 10, padding: '1rem', textAlign: 'center'
                            }}>
                            <p style={{ color: 'var(--accent)', fontWeight: 700 }}>⭐ {t('find.priorityWindow')}</p>
                            <p className="text-muted" style={{ fontSize: '0.82rem' }}>{t('find.refreshIn', { sec: countdown })}</p>
                            <button className="btn btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                                onClick={skipPriority}>Skip priority window →</button>
                        </motion.div>
                    )}

                    {/* Location info */}
                    {userPos && (
                        <div style={{ background: 'rgba(21,101,192,0.1)', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}>
                            🏠 Searching from <strong>your registered address</strong>
                        </div>
                    )}

                    {/* Search button */}
                    <button className="btn btn-primary btn-full"
                        onClick={startSearch}
                        disabled={loading || phase === 'priority' || geocoding}>
                        {loading ? '...' : phase === 'idle' ? '🔍 Find Kabadi Within 5 km' : '🔄 Search Again'}
                    </button>

                    {/* No results */}
                    {phase !== 'idle' && kabadis.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ fontSize: '2rem' }}>🚫</p>
                            <p className="text-muted">{t('find.noKabadi')}</p>
                            <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={startSearch}>{t('find.retry')}</button>
                        </div>
                    )}

                    {/* Kabadi cards */}
                    {kabadis.map(k => (
                        <motion.div key={k.id} className="card" whileHover={{ y: -2 }} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontWeight: 700 }}>
                                        {k.priorityActive ? '⭐' : '🛒'} {k.name}
                                    </p>
                                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>{k.area}</p>
                                    {k.priorityActive && (
                                        <span className="chip chip-warning" style={{ marginTop: '0.4rem', display: 'inline-block' }}>
                                            ⭐ Priority Active
                                        </span>
                                    )}
                                    {!k.latitude && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.3rem' }}>
                                            ⚠️ No location set
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
