import { useState, useCallback } from 'react'
import { callAI } from '../lib/callAI'

const ANTI_AI_RULES = `
REGLAS DE ESTILO OBLIGATORIAS:

PALABRAS PROHIBIDAS (si las usas, falla):
- Adjetivos: fascinante, cautivador, intrincado, transformador, vital, crucial, revolucionario, poderoso, impactante, valioso, increíble, extraordinario
- Sustantivos: paisaje (metafórico), reino, secretos, sinergia, potencial, estrategia, viaje, trayectoria
- Verbos: desbloquear, explorar, sumergirnos, descubrir, elevar, optimizar, maximizar, potenciar

ESTRUCTURAS PROHIBIDAS:
- Cero saludos ("Hola", "Bienvenidos", "En este video")
- Cero enumeración rígida ("Punto uno", "En primer lugar")
- Cero conclusiones filosóficas ("En última instancia", "Al final del día")

CÓMO ESCRIBIR:
- Español neutro coloquial — como hablar con un amigo
- Frases cortas, a veces incompletas
- Opiniones concretas y sesgadas, no neutralidad
- Rompe la gramática si suena más humano`

/* ─── Section prompts (cada uno encadena al anterior) ─────────────────────── */

function hookPrompt({ objective, idea }) {
  return {
    system: `Eres un experto en contenido viral para redes sociales.
${ANTI_AI_RULES}

Formato OBLIGATORIO — devuelve SOLO esto:
1. [hook]
2. [hook]
3. [hook]`,
    user: `Con base en este objetivo: ${objective?.trim() || 'No especificado'}
Y esta idea: ${idea?.trim() || 'No especificada'}

Genera 3 opciones de HOOK (primeros 1-3 segundos del video) que detengan el scroll, generen curiosidad inmediata y hablen directamente al dolor o deseo del espectador.
Cada hook MÁXIMO 15 palabras. Una sola frase.`,
  }
}

function rehookPrompt({ objective, idea, hook }) {
  return {
    system: `Eres un experto en contenido viral para redes sociales. Mantienes la coherencia narrativa entre hook y rehook.
${ANTI_AI_RULES}

Formato OBLIGATORIO — devuelve SOLO esto:
1. [rehook]
2. [rehook]
3. [rehook]`,
    user: `Objetivo del video: ${objective?.trim() || 'No especificado'}
Idea del video: ${idea?.trim() || 'No especificada'}

El HOOK de este video es:
"${hook?.trim() || '(aún no escrito)'}"

Continúa la narrativa con un REHOOK que profundice la promesa del hook, mantenga EXACTAMENTE el mismo tono y voz, y evite que el espectador se vaya.
Genera 3 opciones de máximo 20 palabras cada una.`,
  }
}

function contentPrompt({ objective, idea, hook, rehook }) {
  return {
    system: `Eres un experto en contenido viral para redes sociales. Tu trabajo es cumplir la promesa que hicieron el hook y el rehook.
${ANTI_AI_RULES}

Formato OBLIGATORIO — devuelve SOLO esto:
1. [contenido en 3-5 puntos breves]
2. [contenido en 3-5 puntos breves]
3. [contenido en 3-5 puntos breves]`,
    user: `Objetivo del video: ${objective?.trim() || 'No especificado'}
Idea del video: ${idea?.trim() || 'No especificada'}

El HOOK es:
"${hook?.trim() || '(aún no escrito)'}"

El REHOOK es:
"${rehook?.trim() || '(aún no escrito)'}"

Genera el cuerpo del guión que cumpla la promesa que hicieron el hook y rehook. Debe mantener el MISMO tono, ser concreto, aportar valor real y preparar al espectador para el CTA.
Estructura cada variante en 3-5 puntos breves.`,
  }
}

function ctaPrompt({ objective, idea, hook, rehook, content }) {
  return {
    system: `Eres un experto en contenido viral. Tu CTA cierra de forma natural y coherente con TODO el guión anterior.
${ANTI_AI_RULES}

Formato OBLIGATORIO — devuelve SOLO esto:
1. [CTA]
2. [CTA]
3. [CTA]`,
    user: `El objetivo del video es: ${objective?.trim() || 'No especificado'}
La idea es: ${idea?.trim() || 'No especificada'}

El guión completo es:
- HOOK: "${hook?.trim() || '(vacío)'}"
- REHOOK: "${rehook?.trim() || '(vacío)'}"
- CONTENIDO: "${content?.trim() || '(vacío)'}"

Genera 3 opciones de CTA que cierren de forma natural y coherente con todo lo anterior, y que lleven al espectador a cumplir este objetivo: ${objective?.trim() || 'el objetivo del video'}.
MÁXIMO 20 palabras cada uno.`,
  }
}

const BUILDERS = {
  hook:    hookPrompt,
  rehook:  rehookPrompt,
  content: contentPrompt,
  cta:     ctaPrompt,
}

function parseVariants(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const variants = []
  let current = null
  for (const line of lines) {
    const match = line.match(/^[1-3][.)]\s+(.+)/)
    if (match) {
      if (current !== null) variants.push(current.trim())
      current = match[1].trim()
    } else if (current !== null) {
      current += '\n' + line
    }
  }
  if (current !== null) variants.push(current.trim())
  if (variants.length >= 2) return variants.slice(0, 3)
  return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
}

export function useAIGenerate() {
  const [loading,  setLoading]  = useState(false)
  const [variants, setVariants] = useState(null)
  const [error,    setError]    = useState(null)

  const generate = useCallback(async ({ sectionKey, objective, idea, hook, rehook, content }) => {
    setLoading(true)
    setVariants(null)
    setError(null)

    const builder = BUILDERS[sectionKey] ?? BUILDERS.hook
    const { system, user } = builder({ objective, idea, hook, rehook, content })

    try {
      const maxTokens = sectionKey === 'hook' ? 250 : sectionKey === 'content' ? 1000 : 400
      const text   = await callAI({ system, userPrompt: user, maxTokens })
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
