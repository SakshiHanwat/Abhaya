import { NextRequest, NextResponse } from 'next/server'

function detectLanguage(text: string): string {
  const hindiPattern = /[\u0900-\u097F]/
  if (hindiPattern.test(text)) return 'Hindi'
  return 'English'
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const language = detectLanguage(message)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content: `You are Devi, a warm AI safety assistant for women in India.
            STRICT RULES:
            - You MUST reply ONLY in ${language}. This is mandatory.
            - Maximum 2 sentences only. No exceptions.
            - If emergency, say: Please call 112 immediately
            - Be warm, concise and direct`
          },
          { role: 'user', content: message }
        ]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', data)
      throw new Error(data.error?.message || 'API failed')
    }

    const reply = data.choices?.[0]?.message?.content || 'Kuch gadbad hui!'

    return NextResponse.json({ reply })

  } catch (error) {
    console.error('Devi error:', error)
    return NextResponse.json(
      { reply: 'Error aaya!' },
      { status: 500 }
    )
  }
}