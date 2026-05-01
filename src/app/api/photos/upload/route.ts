import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { storePhoto } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const uploaderName = (formData.get('uploaderName') as string) || 'ゲスト'
    const message = (formData.get('message') as string) || ''
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: '写真が選択されていません' }, { status: 400 })
    }

    await initDb()
    const db = getDb()

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { storedName, size } = await storePhoto(buffer, file.name, file.type || 'image/jpeg')

      const id = uuidv4()
      await db.execute({
        sql: `INSERT INTO photos (id, filename, original_name, uploader_name, message, status, file_size)
              VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        args: [id, storedName, file.name, uploaderName, message, size],
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
