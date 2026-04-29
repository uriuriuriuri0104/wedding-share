import { createClient, Client } from '@libsql/client'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

let client: Client | null = null

export function getDb(): Client {
  if (client) return client

  const tursoUrl = process.env.TURSO_DATABASE_URL

  if (tursoUrl) {
    client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  } else {
    const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data')
    fs.mkdirSync(DB_DIR, { recursive: true })
    client = createClient({
      url: `file:${path.join(DB_DIR, 'wedding.db')}`,
    })
  }

  return client
}

export async function initDb(): Promise<void> {
  const db = getDb()

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploader_name TEXT NOT NULL DEFAULT 'ゲスト',
      message TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const existing = await db.execute('SELECT COUNT(*) as count FROM admins')
  const count = existing.rows[0].count as number
  if (count === 0) {
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin'
    const defaultPassword = process.env.ADMIN_PASSWORD || 'wedding2024'
    const hash = bcrypt.hashSync(defaultPassword, 10)
    await db.execute({
      sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      args: [defaultUsername, hash],
    })
  }
}
