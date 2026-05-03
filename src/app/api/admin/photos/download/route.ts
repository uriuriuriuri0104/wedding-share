import { NextResponse } from 'next/server'
import { Readable } from 'stream'
import path from 'path'
import fs from 'fs'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import JSZip from 'jszip'
import { getDb, initDb } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const maxDuration = 60

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function fetchPhotoBuffer(filename: string): Promise<Buffer> {
  if (filename.startsWith('http')) {
    const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
    const key = filename.replace(`${publicUrl}/`, '')
    const client = getR2Client()
    const res = await client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }))
    return streamToBuffer(res.Body as Readable)
  }
  return fs.readFileSync(path.join(UPLOAD_DIR, filename))
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    await initDb()
    const db = getDb()
    const result = await db.execute(`
      SELECT filename, original_name, uploader_name
      FROM photos
      WHERE status = 'approved'
      ORDER BY created_at ASC
    `)

    const photos = result.rows as unknown as Array<{
      filename: string
      original_name: string
      uploader_name: string
    }>

    if (photos.length === 0) {
      return NextResponse.json({ error: '承認済みの写真がありません' }, { status: 404 })
    }

    const zip = new JSZip()
    const usedNames = new Set<string>()

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const buffer = await fetchPhotoBuffer(photo.filename)

      let zipName = photo.original_name || `photo_${i + 1}.jpg`
      if (usedNames.has(zipName)) {
        const ext = path.extname(zipName)
        const base = path.basename(zipName, ext)
        zipName = `${base}_${i + 1}${ext}`
      }
      usedNames.add(zipName)

      zip.file(zipName, buffer)
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const dateStr = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="wedding-photos-${dateStr}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Download ZIP error:', err)
    return NextResponse.json({ error: 'ダウンロードに失敗しました' }, { status: 500 })
  }
}
