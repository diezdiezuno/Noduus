'use client'

import { createContext, useContext, useState } from 'react'
import type { Property } from '@/types'

export type Lang = 'es' | 'en'

interface LanguageCtx {
  lang: Lang
  setLang: (l: Lang) => void
}

const Ctx = createContext<LanguageCtx>({ lang: 'es', setLang: () => {} })

export function LanguageProvider({
  children,
  defaultLang = 'es',
}: {
  children: React.ReactNode
  defaultLang?: Lang
}) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}

/** Returns a property with title/description/type resolved to the given language */
export function locProp(p: Property, lang: Lang): Property {
  return {
    ...p,
    title:       (lang === 'es' ? p.title_es       : p.title_en)       ?? p.title_es       ?? p.title_en       ?? p.title,
    description: (lang === 'es' ? p.description_es : p.description_en) ?? p.description_es ?? p.description_en ?? p.description,
    type:        (lang === 'es' ? p.type_es         : p.type_en)         ?? p.type_es         ?? p.type_en         ?? p.type,
  }
}
