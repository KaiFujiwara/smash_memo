import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'memoImages',
  access: (allow) => ({
    'memo-images/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});
