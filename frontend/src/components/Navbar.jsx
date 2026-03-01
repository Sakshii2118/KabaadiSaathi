import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { FiHome, FiUser, FiCalendar, FiMapPin, FiPlusCircle, FiLogOut } from 'react-icons/fi'

export default function Navbar({ userType }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { auth, logout } = useAuth()

    const citizenLinks = [
        { to: '/citizen/dashboard', label: t('nav.dashboard'), icon: <FiHome /> },
        { to: '/citizen/profile', label: t('nav.profile'), icon: <FiUser /> },
        { to: '/citizen/bookings', label: t('nav.bookings'), icon: <FiCalendar /> },
        { to: '/citizen/book-pickup', label: t('nav.bookPickup'), icon: <FiMapPin /> },
        { to: '/citizen/find-kabadi', label: t('nav.findKabadi'), icon: <FiMapPin /> },
    ]
    const kabadiLinks = [
        { to: '/kabadi/dashboard', label: t('nav.dashboard'), icon: <FiHome /> },
        { to: '/kabadi/profile', label: t('nav.profile'), icon: <FiUser /> },
        { to: '/kabadi/log-transaction', label: t('nav.logTx'), icon: <FiPlusCircle /> },
    ]
    const adminLinks = [
        { to: '/admin/dashboard', label: 'Admin Dashboard', icon: <FiHome /> },
    ]

    const links = userType === 'CITIZEN' ? citizenLinks : userType === 'KABADI' ? kabadiLinks : adminLinks

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>KabaadiSaathi</div>
            <div className="navbar-links">
                {links.map(l => (
                    <a key={l.to} className={`nav-link${location.pathname === l.to ? ' active' : ''}`} onClick={() => navigate(l.to)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {l.icon} {l.label}
                    </a>
                ))}
                <LanguageSwitcher />
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={logout}>
                    <FiLogOut /> {t('nav.logout')}
                </button>
            </div>
        </nav>
    )
}
