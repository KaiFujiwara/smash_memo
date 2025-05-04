import {defineAuth, secret} from "@aws-amplify/backend";
import 'dotenv/config';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'すまめも！へようこそ！メールを確認してください'
    },
    externalProviders: {
      oidc: [
        {
          name: 'Auth0',
          clientId: secret('AUTH0_CLIENT_ID'),
          clientSecret: secret('AUTH0_CLIENT_SECRET'),
          issuerUrl: process.env.ISSUER_URL || '',
          scopes: ['openid', 'profile', 'email']
        },
      ],
      callbackUrls: [process.env.CALLBACK_URL || ''],
      logoutUrls: [process.env.LOGOUT_URL || ''],
    },
  },
});