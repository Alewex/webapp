window.extractToken = (hash) => {
  const match = hash.match(/access_token=(\w+)/);
  let token = !!match && match[1];
  if (!token) {
    token = localStorage.getItem('ello_access_token');
  }
  return token;
}

window.checkAuth = () => {
  const token = extractToken(document.location.hash);
  if (token) {
    localStorage.setItem('ello_access_token', token)
  } else {
    // TODO: protocol, hostname, <port>, scope, client_id are all ENVs?
    const url = 'https://' + ENV.AUTH_DOMAIN + '/api/oauth/authorize.html' +
      '?response_type=token' +
      '&scope=web_app' +
      '&client_id='    + ENV.AUTH_CLIENT_ID +
      '&redirect_uri=' + ENV.AUTH_REDIRECT_URI;
    window.location.href = url;
  }
}

window.resetAuth = () => {
  const token = localStorage.getItem('ello_access_token');
  if (token) {
    localStorage.removeItem('ello_access_token');
    window.checkAuth()
  }
}

window.checkAuth()