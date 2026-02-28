import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getKabadiProfile, updateKabadiProfile } from '../../api/kabadiApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion } from 'framer-motion'
import { FiEdit2, FiSave } from 'react-icons/fi'

export default function KabadiProfile() {
    const { t } = useTranslation()
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({})
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        getKabadiProfile().then(r => { setProfile(r.data.data); setForm(r.data.data) })
            .catch(() => toast.error(t('toast.error')))
    }, [])

    const handleSave = async () => {
        try {
            await updateKabadiProfile(form)
            setProfile(form); setEditing(false)
            toast.success(t('toast.profileUpdated'))
        } catch { toast.error(t('toast.error')) }
    }

    const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?'

    return (
        <div className="page">
            <Navbar userType="KABADI" />
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#FFC107,#F57F17)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#222' }}>
                            {initials}
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{profile?.name}</h1>
                            <p className="text-muted">{profile?.mobile} · {profile?.area}</p>
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700 }}>{t('profile.edit')}</h3>
                            {!editing ? <button className="btn btn-ghost" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
                                : <button className="btn btn-primary" onClick={handleSave}><FiSave /> {t('profile.save')}</button>}
                        </div>
                        <div className="input-group"><label>{t('auth.name')}</label><input className="input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!editing} /></div>
                        <div className="input-group"><label>{t('auth.area')}</label><input className="input" value={form.area || ''} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} disabled={!editing} /></div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
