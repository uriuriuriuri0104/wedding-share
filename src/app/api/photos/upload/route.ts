import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { storePhoto } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

export const maxDuration = 60

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const formData = await req.formData()
    const files = formData.getAll('photos') as File[]
    const uploaderName = (formData.get('uploaderName') as string) || 'ゲスト'
    const message = (formData.get('message') as string) || ''

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '写真を選択してください' }, { status: 400 })
    }

    const db = getDb()
    let count = 0

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_FILE_SIZE) continue

      const id = uuidv4()
      const filename = `${id}.jpg`

      const buffer = Buffer.from(await file.arrayBuffer())
      let processed: Buffer
      try {
        processed = await sharp(buffer)
          .rotate()
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
      } catch {
        processed = buffer
      }

      const { storedName, size } = await storePhoto(processed, filename)

      await db.execute({
        sql: `INSERT INTO photos (id, filename, original_name, uploader_name, message, status, file_size)
              VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        args: [id, storedName, file.name, uploaderName, message, size],
      })

      count++
    }

    if (count === 0) {
      return NextResponse.json({ error: 'アップロードできる写真がありませんでした' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
