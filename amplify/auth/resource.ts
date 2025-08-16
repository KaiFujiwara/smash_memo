import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['openid', 'profile', 'email']
      },
      callbackUrls: [
        'http://localhost:3000/login',
        ...(process.env.AMPLIFY_CALLBACK_URL ? [process.env.AMPLIFY_CALLBACK_URL] : [])
      ],
      logoutUrls: [
        'http://localhost:3000/login',
        ...(process.env.AMPLIFY_LOGOUT_URL ? [process.env.AMPLIFY_LOGOUT_URL] : [])
      ]
    }
  },
});
