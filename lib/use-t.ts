"use client"

import { useStore } from "./store"
import { getDict, isRtl } from "./i18n"

export function useT() {
  const { state } = useStore()
  const dict = getDict(state.language)
  const t = (key: string) => dict[key] ?? key
  return { t, lang: state.language, rtl: isRtl(state.language) }
}
