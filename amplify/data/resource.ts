import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Character: a
    .model({
      name: a.string().required(),
      icon: a.string().required(),
      order: a.integer().required()
    })
    .authorization(allow => [
      allow.publicApiKey()
    ]),
    
  UserCharacterSetting: a
    .model({
      characterId: a.string().required(),
      categoryId: a.string(),
      customOrder: a.integer(),
    })
    .authorization(allow => [
      allow.owner()
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
    
  Category: a
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
    apiKeyAuthorizationMode: {}
  },
});
