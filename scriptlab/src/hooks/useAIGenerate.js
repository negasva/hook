import { useState, useCallback } from 'react'
import { callAI } from '../lib/callAI'

const SYSTEM_PROMPTS = {
  hook: `Eres un experto en copywriting para video corto (TikTok, Reels, YouTube Shorts).
Genera exactamente 3 variantes de HOOK. Cada hook debe detener el scroll en los primeros 3 segundos usando tensión, curiosidad o sorpresa. Sin frases de introducción ni explicaciones.
Formato: SOLO 3 variantes numeradas así:
1. [texto del hook]
2. [texto del hook]
3. [texto del hook]
Máximo 2 oraciones por variante.`,

  rehook: `Eres un experto en copywriting para video corto.
Genera exactamente 3 variantes de REHOOK. El rehook aparece justo después del hook inicial y debe reforzar la promesa con mayor especificidad para que el espectador siga mirando.
Formato: SOLO 3 variantes numeradas así:
1. [texto del rehook]
2. [texto del rehook]
3. [texto del rehook]
Máximo 2 oraciones por variante.`,

  content: `Eres un experto en copywriting para video corto.
Genera exactamente 3 variantes de CONTENIDO principal. Cada variante debe ser específica, con datos concretos, pasos claros o historia real. Evita generalidades.
Formato: SOLO 3 variantes numeradas así:
1. [contenido]
2. [contenido]
3. [contenido]
Máximo 4 oraciones por variante.`,

  finale: `Eres un experto en copywriting para video corto.
Genera exactamente 3 variantes de CIERRE/FINAL. El final debe rematar el mensaje central, cerrar el loop emocional abierto en el hook y preparar el terreno para el CTA.
Formato: SOLO 3 variantes numeradas así:
1. [texto del final]
2. [texto del final]
3. [texto del final]
Máximo 2 oraciones por variante.`,

  cta: `Eres un experto en copywriting para video corto.
Genera exactamente 3 variantes de CTA (Call To Action). Cada CTA debe ser claro, directo y pedir UNA sola acción específica. Nada genérico.
Formato: SOLO 3 variantes numeradas así:
1. [texto del CTA]
2. [texto del CTA]
3. [texto del CTA]
Una sola oración por variante.`,
}

function parseVariants(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const variants = []
  for (const line of lines) {
    const match = line.match(/^[1-3][.)]\s+(.+)/)
    if (match) variants.push(match[1].trim())
  }
  if (variants.length >= 2) return variants.slice(0, 3)
  return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
}

export function useAIGenerate() {
  const [loading, setLoading]   = useState(false)
  const [variants, setVariants] = useState(null)
  const [error, setError]       = useState(null)

  const generate = useCallback(async ({ sectionKey, objective, idea }) => {
    setLoading(true)
    setVariants(null)
    setError(null)

    const system     = SYSTEM_PROMPTS[sectionKey] ?? SYSTEM_PROMPTS.hook
    const userPrompt = `Objetivo del video: ${objective?.trim() || 'No especificado'}
Idea del video: ${idea?.trim() || 'No especificada'}

Genera 3 variantes para esta sección basándote en el contexto anterior.`

    try {
      const text   = await callAI({ system, userPrompt, maxTokens: 800 })
      const parsed = parseVariants(text)
      setVariants(parsed.length ? parsed : [text])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setVariants(null)
    setError(null)
  }, [])

  return { generate, loading, variants, error, clear }
}
