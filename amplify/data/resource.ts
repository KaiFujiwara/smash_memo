import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // キャラクターマスター
  Character: a
    .model({
      name: a.string().required(),
      icon: a.string().required(),
      order: a.integer().required()
    })
    .authorization(allow => [
      allow.publicApiKey().to(['read']),
    ]),
    
  // ユーザーごとのメモ項目マスター
  MemoItem: a
    .model({
      name: a.string().required(),
      visible: a.boolean().default(true),
      order: a.integer().required(),
      owner: a.string(), 
    })
    .secondaryIndexes(index => [
      // ownerパーティション内をorderでソート
      index("owner").sortKeys(["order"]).queryField("memoItemsByOwner"),
    ])
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
    ]),

  // メモ内容
  MemoContent: a
    .model({
      characterId: a.string().required(),
      memoItemId: a.string().required(),
      content: a.string(),
      owner: a.string(), 
    })
    .secondaryIndexes(index => [
      // characterIdでクエリするためのGSI
      index("owner").sortKeys(["characterId", "memoItemId"]).queryField("memoContentsByOwnerCharacter"),
      // memoItemIdでクエリするためのGSI（削除時に使用）
      index("memoItemId").queryField("listMemoContentsByMemoItem"),
    ])
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
    ]),

    
  // キャラクターカテゴリ
  CharacterCategory: a
    .model({
      name: a.string().required(),
      color: a.string(),
      order: a.integer().required()
    })
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
    ]),

  // ユーザーごとのキャラクターカテゴリ設定
  UserCharacterSetting: a
    .model({
      characterId: a.string().required(),
      categoryId: a.string(),
      customOrder: a.integer(),
    })
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
    ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    }
  },
});

