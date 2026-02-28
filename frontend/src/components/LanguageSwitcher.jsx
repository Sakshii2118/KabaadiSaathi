import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n.js'

const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'mr', label: 'मराठी' },
]

export default function LanguageSwitcher() {
    const { t } = useTranslation()
    const current = i18n.language?.slice(0, 2) || 'en'

    const handleChange = (e) => {
        const code = e.target.value
        i18n.changeLanguage(code)
        localStorage.setItem('i18n_lang', code)
    }

    return (
        <select
            value={current}
            onChange={handleChange}
            style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 8, padding: '0.4rem 0.75rem',
                fontFamily: 'var(--font)', fontSize: '0.85rem', cursor: 'pointer'
            }}
        >
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
    )
}
