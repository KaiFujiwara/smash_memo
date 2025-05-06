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
      order: a.integer().required()
    })
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
      // 誰でも読み取り可能（公開設定はアプリ側で制御）
      allow.publicApiKey().to(['read'])
    ]),

  // メモ内容
  MemoContent: a
    .model({
      characterId: a.string().required(),
      memoItemId: a.string().required(),
      content: a.string()
    })
    .authorization(allow => [
      // 所有者は全操作可能
      allow.owner(),
      // 誰でも読み取り可能（公開設定はアプリ側で制御）
      allow.publicApiKey().to(['read'])
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
      // 誰でも読み取り可能（公開設定はアプリ側で制御）
      allow.publicApiKey().to(['read'])
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
      // 誰でも読み取り可能（公開設定はアプリ側で制御）
      allow.publicApiKey().to(['read'])
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

