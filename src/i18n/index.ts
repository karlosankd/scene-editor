import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, type Language, type Translations } from './translations'

interface I18nState {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'zh',
      t: translations.zh,
      setLanguage: (lang: Language) => {
        set({ language: lang, t: translations[lang] })
      },
      toggleLanguage: () => {
        const newLang = get().language === 'zh' ? 'en' : 'zh'
        set({ language: newLang, t: translations[newLang] })
      },
    }),
    {
      name: 'scene-editor-language',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language]
        }
      },
    }
  )
)
