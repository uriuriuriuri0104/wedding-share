import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')

export async function storePhoto(buffer: Buffer, filename: string): Promise<{ storedName: string; size: number }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(filename, buffer, { access: 'authenticated', contentType: 'image/jpeg' })
    return { storedName: blob.url, size: buffer.length }
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  return { storedName: filename, size: fs.statSync(filepath).size }
}

export async function removePhoto(storedName: string): Promise<void> {
  if (storedName.startsWith('http')) {
    const { del } = await import('@vercel/blob')
    await del(storedName)
  } else {
    const filepath = path.join(UPLOAD_DIR, storedName)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
  }
}
