import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phones, message } = await req.json()

    const response = await fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${phones.join(',')}`,
      { method: 'GET' }
    )

    const data = await response.json()
    console.log('SMS Response:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('SMS Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}