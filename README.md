# 会議室予約アプリ MVP (Backend)

- ランタイム: Node.js 18+
- 技術: TypeScript + Express + Zod
- 状態: インメモリ（プロセス終了で消えます）

## セットアップ
```bash
npm install
npm run dev
# 別ターミナルで動作確認
curl http://localhost:3000/health
```

## サンプルデータ
- 起動時に 10 室をシードします（`src/store/seed.ts`）。

## 推薦API
- POST `/api/recommend`
- 入力
```json
{
  "durationMinutes": 60,
  "attendees": 7,
  "requiredEquipment": ["projector"],
  "startFrom": "2025-10-01T03:00:00.000Z"
}
```
- 出力: 設備完全一致かつ空き有りの部屋を、収容人数の近さで昇順

## 予約API
- GET `/api/reservations` 一覧
- POST `/api/reservations` 作成
```json
{
  "roomId": "R4",
  "title": "Design Review",
  "start": "2025-10-01T03:00:00.000Z",
  "end": "2025-10-01T04:00:00.000Z",
  "attendees": 7
}
```
- DELETE `/api/reservations/:id` 取消

## Outlook 連携（プレースホルダ）
- `src/services/outlook.ts` に Noop 実装あり
- 後続で Microsoft Graph API を実装予定（Client Credential or On-Behalf-Of）

## 今後の拡張（案）
- 代替時間帯の提案、繰り返し予約
- ノーショー自動解放、チェックイン
- ロール/認証、監査ログ
- 永続化（PostgreSQL）と競合防止ロック
- Outlook 双方向同期
## フロントエンドの起動

```bash
cd web
npm run dev
# http://localhost:3001 にアクセス（ポート変更は web/package.json の scripts.dev を編集）
```
