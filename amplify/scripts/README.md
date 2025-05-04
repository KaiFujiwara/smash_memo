# データ初期化スクリプト

## 概要

このディレクトリには、アプリケーションの初期データを設定するためのスクリプトが含まれています。
主にスマブラキャラクターのマスターデータをDynamoDBに投入するために使用します。

## ファイル構成

- `deploy-initial-data.sh`: キャラクターデータの投入スクリプト
- `data/character-list.json`: キャラクターの基本情報（名前、アイコンURL、表示順）

## 使用方法

### 1. サンドボックス環境でのデータ投入

**前提条件**:
- Amplify Sandboxが起動していること (`amplify sandbox` コマンドで起動)

**実行方法**:

```bash
# サンドボックス環境にデータ投入
SANDBOX=true ./amplify/scripts/deploy-initial-data.sh
```

サンドボックス環境の場合：
- ローカルのDynamoDBエミュレータに接続します（http://localhost:20005）
- 認証情報は自動的にダミー値が設定されます
- デプロイしたテーブルにキャラクターデータが投入されます

### 2. AWS本番環境でのデータ投入

**前提条件**:
- AWS CLIがインストールされていること
- 適切なIAM権限を持つAWS認証情報が設定されていること

**実行方法**:

```bash
# AWS認証情報を明示的に設定する場合
export AWS_ACCESS_KEY_ID=あなたのアクセスキー
export AWS_SECRET_ACCESS_KEY=あなたのシークレットキー
# (必要に応じて) export AWS_SESSION_TOKEN=あなたのセッショントークン

# デフォルト環境(dev)にデータ投入
./amplify/scripts/deploy-initial-data.sh

# 特定の環境を指定してデータ投入
ENV=prod ./amplify/scripts/deploy-initial-data.sh

# AWS CLIプロファイルを使用する場合
AWS_PROFILE=myprofile ./amplify/scripts/deploy-initial-data.sh
```

AWS本番環境の場合：
- AWS認証情報またはプロファイルを使用して接続します
- 指定した環境（dev, prod等）のDynamoDBテーブルに接続します
- テーブルの既存データと照合し、必要な場合のみ更新します

### データの重複チェック

スクリプトは自動的に以下を確認します：
1. 既存のキャラクター数とキャラクターリストの項目数が一致するか
2. 名前やアイコンURLなど具体的な内容に違いがないか

既存データと完全に一致する場合は投入をスキップし、違いがある場合のみユーザーに確認してから更新します。

## トラブルシューティング

### 認証エラー
- AWS認証情報が正しく設定されているか確認してください
- 必要なIAM権限（DynamoDBへの読み書き権限）があるか確認してください

### テーブルが見つからない
- 指定した環境（ENV変数）が正しいか確認してください
- Amplifyが正しくデプロイされているか確認してください

### スキャンエラー
- テーブル名が変更されていないか確認してください
- サービスの制限（クォータ）に達していないか確認してください

### jqコマンドが見つからない
- スクリプトはJSONを処理するために`jq`コマンドを使用します
- 以下のコマンドでインストールしてください：
  - Ubuntu/Debian: `sudo apt-get install jq`
  - macOS: `brew install jq`
  - Windows: `choco install jq` (Chocolateyを使用)

# Amplify Gen2 サンドボックスでのデータ投入

## サンドボックスの起動と確認

1. 別のターミナルウィンドウで、プロジェクトルートディレクトリからサンドボックスを起動してください：

```bash
amplify sandbox
```

## データ投入スクリプトの実行

1. スクリプトを実行します：

```bash
./amplify/scripts/deploy-initial-data.sh
```

2. スクリプトはテーブル一覧を表示します。キャラクターデータを格納するサンドボックス環境のテーブルを選択してください。

## トラブルシューティング

### サンドボックスに接続できない場合

- サンドボックスが正常に起動しているか確認してください
- 正しいエンドポイントURLとポート番号を使用しているか確認してください
- スクリプト実行時にSANDBOX_ENDPOINTを正確に指定してください
- Amplify CLIが最新バージョンであることを確認してください：
  ```bash
  npm install -g @aws-amplify/cli
  ```

### テーブルが見つからない場合

- サンドボックスでモデルが正常に作成されているか確認してください
- Amplify Gen2のdata/resource.tsファイルで定義されたモデルをチェックしてください
