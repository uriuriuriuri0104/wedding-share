# 結婚式フォトシェア

ゲストがQRコードでアクセスしてスマホから写真を投稿できる結婚式向け写真共有アプリです。

## 機能

- **QRコードアクセス** — ゲストはアカウント不要でURLにアクセス可能
- **写真アップロード** — スマホから複数枚まとめてアップロード・名前/メッセージ添付
- **ギャラリー表示** — 承認済み写真をマソンリーレイアウトで表示
- **管理画面** — 承認/非公開/削除の操作、QRコード表示

## 起動方法（Docker Compose）

```bash
# ビルド＆起動
docker compose up --build -d

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

ブラウザで http://localhost:3000 にアクセス

### 管理画面

http://localhost:3000/admin/login

- デフォルト: `admin` / `wedding2024`
- `docker-compose.yml` の `ADMIN_USER` / `ADMIN_PASS` で変更可能

## ローカル開発

```bash
npm install
npm run db:init
npm run dev
```

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `JWT_SECRET` | JWTトークン署名キー | `wedding-share-secret-key-...` |
| `ADMIN_USER` | 管理者ユーザー名 | `admin` |
| `ADMIN_PASS` | 管理者パスワード | `wedding2024` |
| `DB_DIR` | SQLiteファイルの保存先 | `./data` |
| `UPLOAD_DIR` | アップロード画像の保存先 | `./public/uploads` |

## 本番運用の注意

- `JWT_SECRET` を必ずランダムな文字列に変更する
- `ADMIN_PASS` を強力なパスワードに変更する
- HTTPS化（nginxリバースプロキシ推奨）
