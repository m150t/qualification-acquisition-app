# QUALog (Beta)

QUALog は、資格学習の「目標・進捗・振り返り」をログとして残し、継続を支援する学習サポートアプリです。  
※ 現在ベータ版として試験公開中です。

## Demo / URL
- Production: https://qua-log.com

## Features
- 目標設定（学習計画）
- 学習ログの記録・閲覧
- レポート表示（振り返り）
- 認証（サインアップ / ログイン / ログアウト）

## Tech Stack
- Frontend: Next.js (App Router), TypeScript
- Styling: Tailwind CSS
- Hosting: AWS Amplify Hosting
- Auth: AWS Amplify Gen2 + Amazon Cognito
- (Optional) Data: DynamoDB

## PWA / Web Push の設定

Web Push のリマインド通知は、`Asia/Tokyo` タイムゾーンの毎日20時に実行されます。デプロイ前に以下を設定してください。

1. P-256形式のVAPIDキーペアを生成します。URLセーフBase64形式の公開鍵をAmplifyシークレットの`VAPID_PUBLIC_KEY`に、32バイトのURLセーフBase64形式の秘密鍵を`VAPID_PRIVATE_KEY`に保存します。
2. 認証済みクライアントが`/api/push-subscriptions`から公開鍵を取得できるよう、サーバーの実行時環境変数`VAPID_PUBLIC_KEY`にも同じ公開鍵を設定します。
3. `StudyGoals`と`StudyReports`へのアクセスに使用する既存のAmplifyシークレット`DDB_ACCESS_KEY_ID`と`DDB_SECRET_ACCESS_KEY`を設定します。デプロイ先のテーブル名やリージョンが初期値と異なる場合は、`DDB_GOALS_TABLE`、`DDB_REPORTS_TABLE`、`DDB_REGION`を上書きします。

Push購読情報は既存の`StudyGoals`アイテムの`pushSubscriptions`属性に保存するため、破壊的なテーブル移行は不要です。日報の学習時間が1以上、完了タスク数が1以上、またはいずれかのタスク状態が完了の場合、その日は実施済みと判定します。今日を含む直近3日間のすべてに予定タスクがあり、いずれも未実施の場合は、通常のリマインドではなく計画の見直しを促す通知を送信します。
