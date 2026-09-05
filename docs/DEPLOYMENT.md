# デプロイメントガイド

本番はRenderのWeb ServiceとSupabase PostgreSQLを想定しています。Renderのfilesystemは永続化されないため、会社ロゴにはS3互換ストレージが必要です。

## Renderの環境変数

`render.yaml` に値の名前は定義されていますが、`sync: false` の値はRenderのEnvironmentで設定します。

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQLプロバイダが発行した接続文字列 |
| `SECRET_KEY_BASE` | Railsの秘密鍵。Blueprintでは自動生成 |
| `DEMO_USER_PASSWORD` | デモユーザーのパスワード |
| `GEMINI_API_KEY` | AI抽出を使う場合のみ必要 |
| `ADMIN_USER_EMAIL` / `ADMIN_USER_PASSWORD` / `ADMIN_USER_NAME` | AI利用を許可した管理者ユーザーを起動時に作成・更新する場合に必要 |

`DATABASE_URL` はプロバイダが発行した接続文字列をそのまま設定してください。ユーザー名、ホスト、ポートを手入力で組み替えないでください。SupabaseのDirect connectionがIPv6を使えない環境では、Session poolerの接続文字列を使います。

## 会社ロゴ用ストレージ

次の3つは必須です。

```text
ACTIVE_STORAGE_ACCESS_KEY_ID=ストレージ側で発行したアクセスキー
ACTIVE_STORAGE_SECRET_ACCESS_KEY=ストレージ側で発行したシークレットキー
ACTIVE_STORAGE_BUCKET=作成したバケット名
```

ストレージ事業者に応じて、必要なら以下も設定します。

```text
ACTIVE_STORAGE_REGION=リージョン
ACTIVE_STORAGE_ENDPOINT=S3互換endpoint
ACTIVE_STORAGE_FORCE_PATH_STYLE=false
```

AWS S3では通常`ACTIVE_STORAGE_ENDPOINT`は不要です。Cloudflare R2やSupabase StorageなどのS3互換サービスでは、各サービスが発行するendpointを設定してください。

本番環境は必須のストレージ設定がない場合、ロゴを失う構成で起動しないように停止します。

## ローカルでDATABASE_URLの接続先が違う場合

ローカル開発はDocker ComposeのPostgreSQLを使います。シェルに外部環境向けの`DATABASE_URL`が残っていると、Railsはそれを優先します。`tenant/user ... not found`などの接続エラーが出る場合は、変数を解除してからDBを準備してください。

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
docker compose up -d db web
docker compose exec -T web bin/rails db:prepare
```

## AI抽出の運用

AI抽出は`GEMINI_API_KEY`を設定しただけでは全ユーザーに開放されません。`ai_enabled`を持つユーザーだけが選択できます。AI呼び出しにはopen timeout 5秒、read timeout 30秒、5分間にユーザーごと20回の制限があります。失敗時はルールベースへフォールバックします。

Gemini側とRender側でも使用量の上限を設定してください。APIの無料枠・レート制限は変わる可能性があるため、最新値は[Gemini API Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)を確認してください。
