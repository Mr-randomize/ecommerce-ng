export default {

  oidc: {
    clientId: '0oahcd671CPm0wbrQ5d6',
    issuer: 'https://dev-28927487.okta.com/oauth2/default',
    //Change Sign-in/out redirect URIs in Okta Dashboard
    //Change API Trusted Origins Url
    redirectUri: 'https://localhost:4200/login/callback',
    //redirectUri: 'http://localhost:4200/login/callback',
    scopes: ['openid', 'profile', 'email']
  }
};
