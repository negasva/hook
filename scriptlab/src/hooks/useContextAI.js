import { useState, useCallback } from 'react'
import { callAI } from '../lib/callAI'

/* ─── Anti-IA style rules ─────────────────────────────────────────────────── */

const ANTI_AI_RULES = `
ESTILO OBLIGATORIO:
- Español neutro coloquial. Como si hablaras con un amigo, no como manual de marketing.
- Frases cortas. Incompletas si hace falta.
- Palabras PROHIBIDAS: fascinante, cautivador, transformador, vital, crucial, revolucionario, potencial, sinergia, desbloquear, explorar, descubrir, paisaje (en sentido metafórico), reino, secretos
- Sin saludos, sin conclusiones filosóficas, sin enumeración rígida
- Imperfección humana: dudas reales, opiniones sesgadas, gramática rota si suena más natural`

/* ─── Prompts ─────────────────────────────────────────────────────────────── */

const PROMPTS = {
  improve_objective: `Eres un estratega de contenido para TikTok, Reels y Shorts con 2M de seguidores.
El usuario escribió un objetivo de video. Mejóralo para que sea concreto, orientado a un resultado medible y que suene como lo diría una persona real, no una agencia.
Una sola oración. Sin puntos finales si no suenan naturales.
Devuelve SOLO el texto mejorado, sin explicaciones, sin comillas.
${ANTI_AI_RULES}`,

  improve_idea: `Eres un creador de contenido con 2M de seguidores. Sabes exactamente qué ideas tienen tracción y cuáles no.
El usuario tiene una idea de video. Mejórala para que incluya: el ángulo narrativo específico, quién es el protagonista o desde qué perspectiva se cuenta, y cuál es el conflicto o giro que engancha. Máximo 3 oraciones.
Devuelve SOLO el texto mejorado, sin explicaciones, sin comillas.
${ANTI_AI_RULES}`,

  key_questions: `Eres un creador de contenido con 2M de seguidores y un ojo clínico para detectar qué le falta a un guion antes de escribirlo.
Basándote en el objetivo e idea del video, genera exactamente 5 preguntas que el creador TIENE que responder para que el video sea concreto y no genérico. Las preguntas deben exponer los vacíos reales: falta de especificidad, audiencia no definida, ángulo sin conflicto, falta de prueba social, o final sin impacto.
Las preguntas deben sonar directas, casi incómodas — como se las haría un editor brutal, no un coach motivacional.
Formato: SOLO 5 preguntas numeradas:
1. [pregunta]
2. [pregunta]
3. [pregunta]
4. [pregunta]
5. [pregunta]
${ANTI_AI_RULES}`,
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function parseQuestions(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const result = []
  for (const line of lines) {
    const match = line.match(/^[1-5][.)]\s+(.+)/)
    if (match) result.push(match[1].trim())
  }
  return result.length >= 2 ? result.slice(0, 5) : [text]
}

function buildContext(objective, idea) {
  return `Objetivo del video: ${objective?.trim() || 'No especificado'}\nIdea del video: ${idea?.trim() || 'No especificada'}`
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */

export function useContextAI() {
  const [improving, setImproving]               = useState(null)
  const [suggestions, setSuggestions]           = useState({})
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questions, setQuestions]               = useState(null)
  const [error, setError]                       = useState(null)

  const improve = useCallback(async ({ field, currentValue, objective, idea }) => {
    setImproving(field)
    setError(null)
    setSuggestions((prev) => { const n = { ...prev }; delete n[field]; return n })

    const fieldLabel = field === 'objective' ? 'objetivo del video' : 'idea del video'
    const userPrompt = `${buildContext(objective, idea)}\n\nTexto actual del ${fieldLabel}:\n"${currentValue?.trim() || '(vacío)'}"\n\nMejóralo. Que suene humano, directo, imperfecto si hace falta.`

    try {
      const result = await callAI({ system: PROMPTS[`improve_${field}`], userPrompt, maxTokens: 300 })
      setSuggestions((prev) => ({ ...prev, [field]: result }))
    } catch (e) {
      setError(e.message)
    } finally {
      setImproving(null)
    }
  }, [])

  const clearSuggestion = useCallback((field) => {
    setSuggestions((prev) => { const n = { ...prev }; delete n[field]; return n })
  }, [])

  const generateQuestions = useCallback(async ({ objective, idea }) => {
    setQuestionsLoading(true)
    setQuestions(null)
    setError(null)

    const userPrompt = `${buildContext(objective, idea)}\n\nGenera las 5 preguntas que este guion necesita responder para no ser genérico.`

    try {
      const result = await callAI({ system: PROMPTS.key_questions, userPrompt, maxTokens: 500 })
      setQuestions(parseQuestions(result))
    } catch (e) {
      setError(e.message)
    } finally {
      setQuestionsLoading(false)
    }
  }, [])

  const clearQuestions = useCallback(() => setQuestions(null), [])

  return {
    improving, suggestions, clearSuggestion, improve,
    questionsLoading, questions, clearQuestions, generateQuestions,
    error,
  }
}
