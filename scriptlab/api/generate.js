export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' })
  }

  const { system, messages, max_tokens } = req.body

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        max_tokens: max_tokens ?? 800,
        temperature: 0.8,
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return res.status(upstream.status).json(data)
    }

    // Return in the same shape the client expects
    const text = data.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ content: [{ type: 'text', text }] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
