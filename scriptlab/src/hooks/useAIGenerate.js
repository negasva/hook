import { useState, useCallback } from 'react'
import { callAI } from '../lib/callAI'

/* ─── Anti-IA style rules (shared across all prompts) ─────────────────────── */

const ANTI_AI_RULES = `
REGLAS DE ESTILO OBLIGATORIAS — LEE ESTO ANTES DE GENERAR:

PALABRAS PROHIBIDAS (si las usas, el guion falla):
- Adjetivos: fascinante, cautivador, intrincado, transformador, vital, crucial, revolucionario, poderoso, impactante, valioso, increíble, extraordinario
- Sustantivos: paisaje (ej: "el paisaje digital"), reino, secretos, sinergia, potencial, estrategia, viaje, trayectoria
- Verbos: desbloquear, explorar, sumergirnos, descubrir, elevar, optimizar, maximizar, potenciar

ESTRUCTURAS PROHIBIDAS:
- No saludes: cero "¡Hola!", cero "Bienvenidos", cero "En este video..."
- No enumeres rígido: nada de "Punto número uno", "En primer lugar", "En segundo lugar"
- No hagas conclusión filosófica: nada de "En última instancia...", "Al final del día..."
- No resumas al final. Corta de golpe o con pregunta real.

CÓMO ESCRIBIR (obligatorio):
- Español neutro coloquial — como si hablaras con un amigo, no como doblaje de película de los 90
- Frases cortas. Muy cortas. A veces incompletas.
- Mete dudas reales: "No me acuerdo exactamente, pero era algo así...", "Creo que fue...", "No sé si esto aplica para todos, pero..."
- Opiniones concretas y sesgadas: di "esto es una basura" o "esto me cambió la vida" — no seas neutral
- Rompe la gramática si suena más humano. Una coma de más, una frase sin verbo — bien.
- El gancho empieza en el segundo 0. Sin contexto previo. Sin calentamiento.`

/* ─── Section prompts ─────────────────────────────────────────────────────── */

const SYSTEM_PROMPTS = {
  hook: `Eres un creador de contenido con 2M de seguidores en TikTok. Escribes la primera línea que detiene el scroll en los primeros 2 segundos.
El HOOK es UNA SOLA frase de apertura — lo que se dice en los primeros 2-3 segundos del video. No es un párrafo, no es un resumen, no es una historia. Es una sola línea de impacto.
Genera exactamente 3 variantes de HOOK. Cada una debe ser:
- Una sola oración. Máximo 20 palabras.
- Que genere tensión, contradicción, curiosidad o provocación inmediata
- Sin contexto previo, sin calentamiento, sin "hola", sin presentación
Formato ESTRICTO — SOLO esto, nada más:
1. [una sola frase]
2. [una sola frase]
3. [una sola frase]
${ANTI_AI_RULES}`,

  rehook: `Eres un creador de contenido con 2M de seguidores en TikTok. Sabes cómo mantener a alguien mirando después del hook.
Genera exactamente 3 variantes de REHOOK. Aparece justo después del hook — es la segunda razón para quedarse, más específica y personal que el hook.
Formato: SOLO 3 variantes numeradas:
1. [rehook]
2. [rehook]
3. [rehook]
Máximo 2 oraciones. Puede empezar a la mitad de una idea.
${ANTI_AI_RULES}`,

  content: `Eres un creador de contenido con 2M de seguidores en TikTok. Tu contenido siempre tiene datos concretos, no generalidades.
Genera exactamente 3 variantes de CONTENIDO PRINCIPAL del video. Cada variante debe tener sustancia real: números, pasos concretos, historia personal o contraejemplo. Nada vago.
Formato: SOLO 3 variantes numeradas:
1. [contenido]
2. [contenido]
3. [contenido]
Máximo 5 oraciones por variante. Usa saltos de línea dentro si ayuda al ritmo.
${ANTI_AI_RULES}`,

  finale: `Eres un creador de contenido con 2M de seguidores en TikTok. Tus cierres no son moralejas — son remates que duelen o sorprenden.
Genera exactamente 3 variantes de CIERRE del video. El cierre cierra el loop emocional del hook sin resumir lo dicho. Puede ser abrupto, puede ser una pregunta incómoda, puede ser un giro.
Formato: SOLO 3 variantes numeradas:
1. [cierre]
2. [cierre]
3. [cierre]
1-2 oraciones máximo. Cuanto más corto, más golpea.
${ANTI_AI_RULES}`,

  cta: `Eres un creador de contenido con 2M de seguidores en TikTok. Tus CTAs suenan como peticiones de un amigo, no como publicidad.
Genera exactamente 3 variantes de CTA (llamada a la acción). Cada CTA pide UNA sola cosa, de forma directa y sin justificación larga.
Formato: SOLO 3 variantes numeradas:
1. [CTA]
2. [CTA]
3. [CTA]
Una sola oración. Sin puntos finales si no suenan naturales.
${ANTI_AI_RULES}`,
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

Genera 3 variantes para esta sección. Recuerda: coloquial, directo, imperfecto, humano.`

    try {
      const maxTokens = sectionKey === 'hook' ? 200 : 800
      const text   = await callAI({ system, userPrompt, maxTokens })
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
