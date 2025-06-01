/**
 * メモ項目関連の型定義
 * 
 * このファイルでは、メモ項目の管理に関連する型を定義しています。
 * AWS AmplifyのDynamoDBスキーマと整合性を保ちながら、
 * フロントエンドで使いやすい形で型を統一しています。
 */

/**
 * メモ項目の基本情報
 * 
 * DynamoDBのMemoItemテーブルに対応する型です。
 * ユーザーごとにカスタマイズ可能なメモ項目を表現します。
 */
export interface MemoItem {
  /** メモ項目の一意識別子 */
  id: string
  /** メモ項目の名前（例: 立ち回り、崖狩り、コンボなど） */
  name: string
  /** 表示順序（小さいほど上位に表示） */
  order: number
  /** 項目の表示/非表示設定 */
  visible: boolean
  /** 作成日時（ISO文字列） */
  createdAt?: string
  /** 更新日時（ISO文字列） */
  updatedAt?: string
  /** 所有者のユーザーID（Amplifyが自動設定） */
  owner?: string
}

/**
 * メモ項目作成用の入力型
 * 
 * 新しいメモ項目を作成する際に使用する型です。
 * IDや自動設定されるフィールドは除外されています。
 */
export interface CreateMemoItemInput {
  /** メモ項目の名前 */
  name: string
  /** 表示順序 */
  order: number
  /** 表示/非表示設定（デフォルト: true） */
  visible?: boolean
}

/**
 * メモ項目更新用の入力型
 * 
 * 既存のメモ項目を更新する際に使用する型です。
 * Amplifyでは_versionは自動管理されるため除外されています。
 */
export interface UpdateMemoItemInput {
  /** 更新対象のID */
  id: string
  /** 新しい名前（省略可） */
  name?: string
  /** 新しい表示順序（省略可） */
  order?: number
  /** 新しい表示/非表示設定（省略可） */
  visible?: boolean
}

/**
 * メモ項目削除用の入力型
 */
export interface DeleteMemoItemInput {
  /** 削除対象のID */
  id: string
}

/**
 * ドラッグ&ドロップの結果を表す型
 * 
 * @hello-pangea/dndライブラリから提供される型の
 * アプリケーション固有の部分を定義しています。
 */
export interface DragDropResult {
  /** ドラッグされたアイテムのID */
  draggableId: string
  /** ドラッグ元の位置情報 */
  source: {
    /** ドロップ可能エリアのID */
    droppableId: string
    /** 元のインデックス */
    index: number
  }
  /** ドロップ先の位置情報（ドロップされなかった場合はnull） */
  destination: {
    /** ドロップ可能エリアのID */
    droppableId: string
    /** 新しいインデックス */
    index: number
  } | null
}

/**
 * メモ項目の一括更新用の型
 * 
 * ドラッグ&ドロップ後の順序保存など、
 * 複数のメモ項目を同時に更新する際に使用します。
 */
export interface BulkUpdateMemoItemInput {
  /** 更新するメモ項目のリスト */
  items: Array<{
    id: string
    order: number
  }>
}

/**
 * メモ項目の操作結果を表す型
 */
export interface MemoItemOperationResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** エラーが発生した場合のメッセージ */
  error?: string
  /** 操作後のメモ項目（成功時のみ） */
  item?: MemoItem
}

/**
 * メモ項目リストの取得結果を表す型
 */
export interface MemoItemListResult {
  /** 取得されたメモ項目のリスト */
  items: MemoItem[]
  /** 次ページが存在するかどうか */
  hasNextPage?: boolean
  /** 次ページ取得用のトークン */
  nextToken?: string
} 