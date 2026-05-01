import path from 'path'
import fs from 'fs'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

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

export async function storePhoto(
  buffer: Buffer,
  filename: string,
  contentType = 'image/jpeg'
): Promise<{ storedName: string; size: number }> {
  if (isR2Configured()) {
    const key = `photos/${Date.now()}-${filename}`
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
    return { storedName: `${publicUrl}/${key}`, size: buffer.length }
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  return { storedName: filename, size: fs.statSync(filepath).size }
}

export async function removePhoto(storedName: string): Promise<void> {
  if (storedName.startsWith('http')) {
    if (!isR2Configured()) return
    const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
    const key = storedName.replace(`${publicUrl}/`, '')
    const client = getR2Client()
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    )
  } else {
    const filepath = path.join(UPLOAD_DIR, storedName)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
  }
}
