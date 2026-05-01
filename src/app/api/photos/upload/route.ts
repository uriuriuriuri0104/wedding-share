import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/heic',
            'image/heif',
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20MB
          tokenPayload: clientPayload ?? '',
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? JSON.parse(tokenPayload) : {}
        await initDb()
        const db = getDb()
        const id = uuidv4()
        await db.execute({
          sql: `INSERT INTO photos (id, filename, original_name, uploader_name, message, status, file_size)
                VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
          args: [
            id,
            blob.url,
            blob.pathname.split('/').pop() || blob.pathname,
            payload.uploaderName || 'ゲスト',
            payload.message || '',
            0,
          ],
        })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
