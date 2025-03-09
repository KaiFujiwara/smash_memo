#!/bin/bash
set -e

# このスクリプトはAWS環境（dev, prod等）にキャラクターの初期データを投入するためのもの

# 環境変数の設定
ENV=${ENV:-dev}
REGION=${REGION:-ap-northeast-1}
PROFILE=${AWS_PROFILE:-default}

# amplify_outputs.jsonからテーブル情報を取得（存在する場合）
if [ -f "amplify_outputs.json" ]; then
  echo "amplify_outputs.jsonからテーブル情報を取得しています..."
  
  # テーブル定義を取得
  TABLE_DEFS=$(jq '.datastore.tables' amplify_outputs.json 2>/dev/null)
  if [ -n "$TABLE_DEFS" ] && [ "$TABLE_DEFS" != "null" ]; then
    echo "Amplify Gen2のテーブル定義が見つかりました"
    # Character関連テーブルを検索
    CHARACTER_TABLE_KEY=$(echo $TABLE_DEFS | jq -r 'keys[]' | grep -i character)
    if [ -n "$CHARACTER_TABLE_KEY" ]; then
      CHARACTER_TABLE=$(echo $TABLE_DEFS | jq -r ".[\"$CHARACTER_TABLE_KEY\"].tableName")
      echo "モデル定義からテーブルを検出: $CHARACTER_TABLE"
      AUTO_DETECTED=true
    fi
  fi
fi

echo "環境: $ENV, リージョン: $REGION, プロファイル: $PROFILE"

# キャラクターリストのJSONファイルパス
CHARACTER_LIST="amplify/scripts/data/character-list.json"
TEMP_DIR="amplify/scripts/data"

# データディレクトリの確認
mkdir -p "$TEMP_DIR"

# キャラクターリストが存在するか確認
if [ ! -f "$CHARACTER_LIST" ]; then
  echo "エラー: キャラクターリスト ($CHARACTER_LIST) が見つかりません"
  exit 1
fi

# AWS認証情報の確認
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  if [ -n "$PROFILE" ] && [ "$PROFILE" != "default" ]; then
    echo "AWS認証にプロファイル '$PROFILE' を使用します"
  else
    echo "警告: AWS認証情報が設定されていません"
    echo "以下のいずれかの方法で認証情報を設定してください:"
    echo "1. 環境変数: AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY"
    echo "2. AWS CLI プロファイル: --profile オプション"
    echo "続行しますか？(y/n)"
    read -p "> " CONTINUE
    if [[ $CONTINUE != "y" && $CONTINUE != "Y" ]]; then
      echo "中止します"
      exit 1
    fi
  fi
fi

# 利用可能なテーブル一覧を取得
echo "DynamoDBテーブルを検索しています..."
TABLES=$(aws dynamodb list-tables --region $REGION --profile $PROFILE --output json)

# テーブル一覧を表示
echo "利用可能なテーブル一覧:"
echo "$TABLES" | jq -r '.TableNames[]'

# 既に自動検出されている場合はスキップ
if [ "$AUTO_DETECTED" != "true" ]; then
  # Characterテーブルのパターンを検索
  CHARACTER_TABLES=($(echo "$TABLES" | jq -r '.TableNames[]' | grep -i "character"))

  if [ ${#CHARACTER_TABLES[@]} -eq 0 ]; then
    echo "警告: 'Character'という名前を含むテーブルが見つかりませんでした。"
    
    # テーブル一覧の表示
    TABLE_LIST=($(echo "$TABLES" | jq -r '.TableNames[]'))
    
    echo "利用可能なテーブル一覧から選択してください:"
    for i in "${!TABLE_LIST[@]}"; do
      echo "[$i] ${TABLE_LIST[$i]}"
    done
    
    echo "キャラクターデータを格納するテーブルの番号を選択してください:"
    read -p "> " TABLE_INDEX
    if [[ $TABLE_INDEX =~ ^[0-9]+$ ]] && [ $TABLE_INDEX -lt ${#TABLE_LIST[@]} ]; then
      CHARACTER_TABLE=${TABLE_LIST[$TABLE_INDEX]}
      echo "選択されたテーブル: $CHARACTER_TABLE"
    else
      echo "無効な選択です。終了します。"
      exit 1
    fi
  elif [ ${#CHARACTER_TABLES[@]} -eq 1 ]; then
    CHARACTER_TABLE=${CHARACTER_TABLES[0]}
    echo "キャラクターテーブルを自動検出しました: $CHARACTER_TABLE"
  else
    echo "複数のキャラクターテーブルが見つかりました:"
    for i in "${!CHARACTER_TABLES[@]}"; do
      echo "[$i] ${CHARACTER_TABLES[$i]}"
    done
    echo "使用するテーブルの番号を選択してください:"
    read -p "> " TABLE_INDEX
    if [[ $TABLE_INDEX =~ ^[0-9]+$ ]] && [ $TABLE_INDEX -lt ${#CHARACTER_TABLES[@]} ]; then
      CHARACTER_TABLE=${CHARACTER_TABLES[$TABLE_INDEX]}
      echo "選択されたテーブル: $CHARACTER_TABLE"
    else
      echo "無効な選択です。終了します。"
      exit 1
    fi
  fi
fi

echo "使用するキャラクターテーブル: $CHARACTER_TABLE"

# テーブルの存在確認
echo "キャラクターテーブルの存在を確認しています..."
if ! aws dynamodb describe-table --table-name "$CHARACTER_TABLE" --region $REGION --profile $PROFILE --output json > /dev/null 2>&1; then
  echo "エラー: テーブル ($CHARACTER_TABLE) にアクセスできません。"
  echo "以下を確認してください："
  echo "1. 適切なAWS認証情報またはプロファイルを使用しているか"
  echo "2. 選択したテーブル名が正しいか"
  echo "3. 適切な権限があるか"
  exit 1
fi

echo "テーブル ($CHARACTER_TABLE) が存在します"

# 現在のテーブルデータを確認
echo "既存のキャラクターデータを確認しています..."
EXISTING_DATA=$(aws dynamodb scan --table-name "$CHARACTER_TABLE" --region $REGION --profile $PROFILE --output json)
EXISTING_COUNT=$(echo "$EXISTING_DATA" | jq '.Count')
echo "既存のキャラクター数: $EXISTING_COUNT"

# character-list.jsonの項目数を確認
LIST_COUNT=$(jq 'length' "$CHARACTER_LIST")
echo "キャラクターリストの項目数: $LIST_COUNT"

# 確認プロセス
if [ "$EXISTING_COUNT" -gt 0 ]; then
  echo "テーブルに既存データがあります。"
  echo "データを上書きしますか？(y/n)"
  read -p "> " OVERWRITE
  if [[ "$OVERWRITE" != "y" && "$OVERWRITE" != "Y" ]]; then
    echo "データ投入をキャンセルしました。"
    exit 0
  fi
fi

# キャラクターをひとつずつDynamoDBに投入
echo "キャラクターデータを投入します..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
COUNT=0

jq -c '.[]' "$CHARACTER_LIST" | while read -r character; do
  name=$(echo "$character" | jq -r '.name')
  icon=$(echo "$character" | jq -r '.icon')
  order=$(echo "$character" | jq -r '.order')
  id=$(printf "%03d" "$order")
  
  # 一時ファイルにJSONを作成
  ITEM_FILE="$TEMP_DIR/item-$id.json"
  
  # AWS CLIのJSONフォーマットで項目を出力
  cat > "$ITEM_FILE" << EOF
{
  "id": {"S": "$id"},
  "name": {"S": "$name"},
  "icon": {"S": "$icon"},
  "order": {"N": "$order"},
  "createdAt": {"S": "$TIMESTAMP"},
  "updatedAt": {"S": "$TIMESTAMP"}
}
EOF
  
  # DynamoDBに項目を投入
  echo "[$id] $name を登録中..."
  aws dynamodb put-item \
    --table-name "$CHARACTER_TABLE" \
    --item file://"$ITEM_FILE" \
    --region "$REGION" \
    --profile "$PROFILE"
  
  # カウンターを増やす
  COUNT=$((COUNT + 1))
  
  # 一時ファイルを削除
  rm "$ITEM_FILE"
done

echo "完了: $COUNT件のキャラクターデータを投入しました。"
