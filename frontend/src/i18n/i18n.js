import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en/translation.json'
import hi from './locales/hi/translation.json'
import bn from './locales/bn/translation.json'
import ta from './locales/ta/translation.json'
import mr from './locales/mr/translation.json'

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            bn: { translation: bn },
            ta: { translation: ta },
            mr: { translation: mr },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'hi', 'bn', 'ta', 'mr'],
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18n_lang',
        },
        interpolation: { escapeValue: false },
    })

export default i18n
