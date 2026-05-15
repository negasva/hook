const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function callAI({ system, userPrompt, maxTokens = 800 }) {
  const devApiKey = import.meta.env.VITE_GROQ_API_KEY
  const useDirect = import.meta.env.DEV && devApiKey

  if (useDirect) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens:  maxTokens,
        temperature: 0.8,
      }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e?.error?.message ?? `Error ${res.status}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  } else {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e?.error?.message ?? `Error ${res.status}`)
    }
    const data = await res.json()
    return data.content?.[0]?.text?.trim() ?? ''
  }
}
