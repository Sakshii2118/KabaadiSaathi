import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getKabadiProfile, updateKabadiProfile } from '../../api/kabadiApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion } from 'framer-motion'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'

export default function KabadiProfile() {
    const { t } = useTranslation()
    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({})
    const [editing, setEditing] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getKabadiProfile().then(r => {
            setProfile(r.data.data)
            setForm(r.data.data)
        }).catch(() => toast.error(t('toast.error')))
    }, [])

    const validate = () => {
        const e = {}
        if (!form.name?.trim()) e.name = 'Name is required'
        if (!form.addressLine1?.trim()) e.addressLine1 = 'Address Line 1 is required'
        if (!form.pincode?.trim()) e.pincode = 'Pincode is required'
        else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Must be 6 digits'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async () => {
        if (!validate()) return
        setLoading(true)
        try {
            // Convert form object to Map<String,String> as backend expects
            const payload = {
                name: form.name || '',
                area: form.area || '',
                addressLine1: form.addressLine1 || '',
                addressLine2: form.addressLine2 || '',
                pincode: form.pincode || '',
                preferredLanguage: form.preferredLanguage || 'en',
            }
            const res = await updateKabadiProfile(payload)
            setProfile(res.data.data || form)
            setEditing(false)
            setErrors({})
            toast.success(t('toast.profileUpdated'))
        } catch (e) {
            toast.error(e.response?.data?.message || t('toast.error'))
        } finally { setLoading(false) }
    }

    const handleCancel = () => { setForm(profile); setErrors({}); setEditing(false) }

    const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?'

    const Field = ({ label, field, mandatory, disabled: dis, ...rest }) => (
        <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500 }}>
                {label}{mandatory && <span style={{ color: 'var(--danger)' }}> *</span>}
            </label>
            <input className="input"
                value={form[field] || ''}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                disabled={dis !== undefined ? dis : !editing}
                style={errors[field] ? { borderColor: 'var(--danger)', background: 'rgba(244,67,54,0.05)' } : {}}
                {...rest} />
            {errors[field] && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors[field]}</p>}
        </div>
    )

    return (
        <div className="page">
            <Navbar userType="KABADI" />
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#FFC107,#F57F17)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#222', flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{profile?.name}</h1>
                            <p className="text-muted">{profile?.mobile}{profile?.area ? ` · ${profile.area}` : ''}</p>
                        </div>
                    </div>

                    {/* Profile card */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>{t('profile.edit')}</h3>
                            {!editing ? (
                                <button className="btn btn-ghost" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost" onClick={handleCancel}><FiX /> Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                        <FiSave /> {loading ? 'Saving...' : t('profile.save')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <Field label="Full Name" field="name" mandatory />
                        <Field label="Address Line 1" field="addressLine1" mandatory placeholder="House/Street/Colony" />
                        <Field label="Address Line 2" field="addressLine2" placeholder="Landmark, Area (optional)" />
                        <Field label="Pincode" field="pincode" mandatory maxLength={6} placeholder="6-digit pincode" />
                        <Field label={t('auth.area')} field="area" placeholder="Working area / town" />

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 500 }}>{t('auth.language')}</label>
                            <select className="input" value={form.preferredLanguage || 'en'}
                                onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}
                                disabled={!editing}>
                                <option value="en">English</option>
                                <option value="hi">हिन्दी</option>
                                <option value="bn">বাংলা</option>
                                <option value="ta">தமிழ்</option>
                                <option value="mr">मराठी</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
