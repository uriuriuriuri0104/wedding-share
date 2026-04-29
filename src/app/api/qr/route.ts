import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const url = `${protocol}://${host}/upload`

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff',
    },
  })

  return NextResponse.json({ qr: qrDataUrl, url })
}
