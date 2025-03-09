#!/bin/bash
set -e

echo "Amplify環境情報を確認します..."

# amplify_outputs.jsonからテーブル情報を抽出
if [ ! -f "amplify_outputs.json" ]; then
  echo "警告: amplify_outputs.jsonが見つかりません。"
  echo "Amplify Sandboxか本番環境用に初期化されたプロジェクトですか？"
  echo "サンドボックスの場合は、別のターミナルで次のコマンドを実行してください："
  echo "npx amplify sandbox"
else
  echo "amplify_outputs.jsonを解析中..."
  
  # テーブル定義の確認
  TABLE_DEFS=$(jq '.datastore.tables' amplify_outputs.json 2>/dev/null)
  if [ -n "$TABLE_DEFS" ] && [ "$TABLE_DEFS" != "null" ]; then
    echo ""
    echo "検出されたテーブル定義："
    echo $TABLE_DEFS | jq -r 'keys[]'
    
    # Character関連テーブルを検索
    CHARACTER_TABLE_KEY=$(echo $TABLE_DEFS | jq -r 'keys[]' | grep -i character)
    if [ -n "$CHARACTER_TABLE_KEY" ]; then
      CHARACTER_TABLE=$(echo $TABLE_DEFS | jq -r ".[\"$CHARACTER_TABLE_KEY\"].tableName")
      echo ""
      echo "キャラクターテーブル: $CHARACTER_TABLE"
    fi
  fi
fi

# テーブル一覧の取得と表示
echo ""
echo "AWS DynamoDBテーブル一覧を取得中..."
aws dynamodb list-tables --region ap-northeast-1 --output json | jq -r '.TableNames[]'

echo ""
echo "データを投入するには以下のコマンドを実行してください:"
echo "./amplify/scripts/deploy-initial-data.sh" 