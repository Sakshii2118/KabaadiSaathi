import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getCitizenProfile, updateCitizenProfile } from '../../api/citizenApi.js'
import Navbar from '../../components/Navbar.jsx'
import { motion } from 'framer-motion'
import { FiCopy, FiEdit2, FiSave } from 'react-icons/fi'

export default function CitizenProfile() {
    const { t } = useTranslation()
    const [profile, setProfile] = useState(null)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({})
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getCitizenProfile().then(r => {
            setProfile(r.data.data)
            setForm(r.data.data)
        }).catch(() => toast.error(t('toast.error')))
    }, [])

    const validate = () => {
        const e = {}
        if (!form.name?.trim()) e.name = 'Name is required'
        if (!form.addressLine1?.trim()) e.addressLine1 = 'Address Line 1 is required'
        if (!form.pincode?.trim()) e.pincode = 'Pincode is required'
        else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode must be 6 digits'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async () => {
        if (!validate()) return
        setLoading(true)
        try {
            await updateCitizenProfile(form)
            setProfile(form)
            setEditing(false)
            setErrors({})
            toast.success(t('toast.profileUpdated'))
        } catch { toast.error(t('toast.error')) }
        finally { setLoading(false) }
    }

    const handleCancel = () => {
        setForm(profile)
        setErrors({})
        setEditing(false)
    }

    const copyId = () => {
        navigator.clipboard.writeText(profile?.wasteRecyclerId || '')
        toast.success('Copied!')
    }

    const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?'

    return (
        <div className="page">
            <Navbar userType="CITIZEN" />
            <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2E7D32,#FFC107)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{profile?.name}</h1>
                            <p className="text-muted">{profile?.mobile}</p>
                        </div>
                    </div>

                    {/* Waste-Recycler ID */}
                    {profile?.wasteRecyclerId && (
                        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '3px solid var(--primary-light)' }}>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profile.wasteId')}</p>
                                <p style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.08em', color: 'var(--primary-light)' }}>{profile?.wasteRecyclerId}</p>
                            </div>
                            <button className="btn btn-ghost" onClick={copyId}><FiCopy /></button>
                        </div>
                    )}

                    {/* Profile form */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>{t('profile.edit')}</h3>
                            {!editing ? (
                                <button className="btn btn-ghost" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSave} disabled={loading}><FiSave /> {t('profile.save')}</button>
                                </div>
                            )}
                        </div>

                        <FieldGroup label={<>{t('auth.name')} <span style={{ color: 'var(--danger)' }}>*</span></>}
                            value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            disabled={!editing} error={errors.name} />

                        <FieldGroup label={<>{t('auth.address1')} <span style={{ color: 'var(--danger)' }}>*</span></>}
                            value={form.addressLine1 || ''} onChange={e => setForm(p => ({ ...p, addressLine1: e.target.value }))}
                            disabled={!editing} error={errors.addressLine1} />

                        <FieldGroup label={t('auth.address2')}
                            value={form.addressLine2 || ''} onChange={e => setForm(p => ({ ...p, addressLine2: e.target.value }))}
                            disabled={!editing} />

                        <FieldGroup label={<>{t('auth.pincode')} <span style={{ color: 'var(--danger)' }}>*</span></>}
                            value={form.pincode || ''} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                            disabled={!editing} error={errors.pincode} maxLength={6} />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function FieldGroup({ label, value, onChange, disabled, error, maxLength }) {
    return (
        <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500 }}>{label}</label>
            <input
                className="input"
                value={value}
                onChange={onChange}
                disabled={disabled}
                maxLength={maxLength}
                style={error ? { borderColor: 'var(--danger)', background: 'rgba(244,67,54,0.05)' } : {}}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>
    )
}
