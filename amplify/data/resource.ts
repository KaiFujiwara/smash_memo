import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Character: a
    .model({
      name: a.string().required(),
      icon: a.string().required(),
      order: a.integer().required()
    })
    .authorization(allow => [
      // ログインユーザーに読み取り権限のみを付与
      allow.authenticated().to(['read']),
    ]),
    
  UserCharacterSetting: a
    .model({
      characterId: a.string().required(),
      categoryId: a.string(),
      customOrder: a.integer(),
    })
    .authorization(allow => [
      allow.owner(), // 所有者のみアクセス可能
    ]),
    
  MemoItem: a
    .model({
      name: a.string().required(),
      visible: a.boolean().default(true),
      order: a.integer().required()
    })
    .authorization(allow => [
      allow.owner()
    ]),
    
  MemoContent: a
    .model({
      characterId: a.string().required(),
      memoItemId: a.string().required(),
      content: a.string()
    })
    .authorization(allow => [
      allow.owner()
    ]),
    
  CharacterCategory: a
    .model({
      name: a.string().required(),
      color: a.string(),
      order: a.integer().required()
    })
    .authorization(allow => [
      allow.owner()
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
