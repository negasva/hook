import { useState, useCallback } from 'react'
import { callAI } from '../lib/callAI'

const PROMPTS = {
  improve_objective: `Eres un estratega de contenido para video corto (TikTok, Reels, YouTube Shorts).
El usuario escribió un objetivo de video. Tu tarea: mejóralo para que sea específico, orientado a resultados y accionable. Máximo una oración clara y directa.
Devuelve SOLO el texto mejorado, sin explicaciones, sin comillas, sin prefijos.`,

  improve_idea: `Eres un experto en copywriting y storytelling para video corto.
El usuario tiene una idea de video. Tu tarea: mejora la descripción para que incluya el ángulo narrativo específico, el personaje o situación de partida y la transformación o conflicto central. Máximo 3 oraciones.
Devuelve SOLO el texto mejorado, sin explicaciones, sin comillas, sin prefijos.`,

  key_questions: `Eres un experto en copywriting para video corto (TikTok, Reels, YouTube Shorts).
Basándote en el objetivo e idea del video, genera exactamente 5 preguntas clave que el creador debe responder para que el guión sea más específico, poderoso y efectivo. Las preguntas deben revelar vacíos de especificidad, ángulo narrativo, audiencia concreta o prueba social.
Formato: SOLO 5 preguntas numeradas:
1. [pregunta]
2. [pregunta]
3. [pregunta]
4. [pregunta]
5. [pregunta]`,
}

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

export function useContextAI() {
  const [improving, setImproving]           = useState(null)       // 'objective' | 'idea' | null
  const [suggestions, setSuggestions]       = useState({})         // { objective?: string, idea?: string }
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questions, setQuestions]           = useState(null)
  const [error, setError]                   = useState(null)

  const improve = useCallback(async ({ field, currentValue, objective, idea }) => {
    setImproving(field)
    setError(null)
    setSuggestions((prev) => { const n = { ...prev }; delete n[field]; return n })

    const fieldLabel = field === 'objective' ? 'objetivo del video' : 'idea del video'
    const userPrompt = `${buildContext(objective, idea)}\n\nTexto actual del ${fieldLabel}:\n"${currentValue?.trim() || '(vacío)'}"\n\nMejora el texto anterior.`

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

    const userPrompt = `${buildContext(objective, idea)}\n\nGenera las 5 preguntas clave.`

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
