const ACCESS_TOKEN_KEY = "access_token";
const ID_TOKEN_KEY = "id_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRES_AT_KEY = "token_expires_at";
const PKCE_VERIFIER_KEY = "cognito_pkce_verifier";
const OAUTH_STATE_KEY = "cognito_oauth_state";

const stripTrailingSlash = (value) => (value || "").replace(/\/+$/, "");

const getApiUrl = () =>
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

export const isLocalAuthMode = () => import.meta.env.VITE_AUTH_MODE === "local";

export const getCognitoConfig = () => {
  const domain = stripTrailingSlash(import.meta.env.VITE_COGNITO_DOMAIN);
  const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
  const redirectUri =
    import.meta.env.VITE_COGNITO_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`;
  const logoutUri =
    import.meta.env.VITE_COGNITO_LOGOUT_URI ||
    `${window.location.origin}/login`;
  const scope =
    import.meta.env.VITE_COGNITO_SCOPES ||
    "openid email profile aws.cognito.signin.user.admin";

  return { domain, clientId, redirectUri, logoutUri, scope };
};

export const isCognitoConfigured = () => {
  if (isLocalAuthMode()) return false;

  const { domain, clientId } = getCognitoConfig();
  return Boolean(domain && clientId);
};

const requireCognitoConfig = () => {
  const config = getCognitoConfig();
  if (!config.domain || !config.clientId) {
    throw new Error("Cognito is not configured.");
  }
  return config;
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getIdToken = () => localStorage.getItem(ID_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getApiToken = () => {
  if (isLocalAuthMode()) return getAccessToken();
  return getIdToken() || getAccessToken();
};

export const setTokens = (tokens) => {
  const accessToken = tokens.access_token || tokens.access;
  const idToken = tokens.id_token || tokens.idToken;
  const refreshToken = tokens.refresh_token || tokens.refresh || getRefreshToken();

  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (idToken) localStorage.setItem(ID_TOKEN_KEY, idToken);
  if (isLocalAuthMode()) localStorage.removeItem(ID_TOKEN_KEY);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  const expiresIn = Number(tokens.expires_in || tokens.expiresIn || 3600);
  const tokenForExpiry = idToken || accessToken;
  const jwtExpiresAt = tokenForExpiry ? getJwtExpiresAt(tokenForExpiry) : null;
  const expiresAt = jwtExpiresAt || Date.now() + expiresIn * 1000;
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
};

export const hasValidSession = () => {
  const token = getApiToken();
  if (!token) return Boolean(getRefreshToken());

  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY)) || getJwtExpiresAt(token);
  if (!expiresAt) return true;
  return Date.now() < expiresAt - 60_000 || Boolean(getRefreshToken());
};

export const redirectToSignIn = () => redirectToManagedLogin();
export const redirectToSignUp = () => redirectToManagedLogin({ screenHint: "signup" });

export const redirectToManagedLogin = async ({ screenHint } = {}) => {
  const { domain, clientId, redirectUri, scope } = requireCognitoConfig();
  const verifier = randomBase64Url(32);
  const state = randomBase64Url(32);
  const challenge = await pkceChallenge(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  if (screenHint) params.set("screen_hint", screenHint);

  window.location.assign(`${domain}/oauth2/authorize?${params.toString()}`);
};

export const handleAuthCallback = async () => {
  const { domain, clientId, redirectUri } = requireCognitoConfig();
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (error) {
    throw new Error(params.get("error_description") || error);
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

  if (!code || !state || !verifier || state !== expectedState) {
    throw new Error("Invalid Cognito callback.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const tokens = await requestTokens(domain, body);
  setTokens(tokens);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  window.history.replaceState({}, document.title, window.location.pathname);
  return tokens;
};

export const refreshTokens = async () => {
  if (isLocalAuthMode()) {
    return refreshLocalTokens();
  }

  const { domain, clientId } = requireCognitoConfig();
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const tokens = await requestTokens(domain, body);
  setTokens({ ...tokens, refresh_token: refreshToken });
  return tokens;
};

export const signOut = ({ redirect = true } = {}) => {
  if (isLocalAuthMode()) {
    clearTokens();
    if (redirect) window.location.assign("/login");
    return;
  }

  const configured = isCognitoConfigured();
  const { domain, clientId, logoutUri } = getCognitoConfig();
  clearTokens();

  if (redirect && configured) {
    const params = new URLSearchParams({
      client_id: clientId,
      logout_uri: logoutUri,
    });
    window.location.assign(`${domain}/logout?${params.toString()}`);
  }
};

export const localLogin = async ({ email, password }) => {
  const tokens = await requestLocalAuth("/auth/local/login/", { email, password });
  setTokens(tokens);
  return tokens;
};

export const localSignup = async ({ username, email, password, password2 }) => {
  const tokens = await requestLocalAuth("/auth/local/signup/", {
    username,
    email,
    password,
    password2,
  });
  setTokens(tokens);
  return tokens;
};

const requestTokens = async (domain, body) => {
  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Cognito token request failed.");
  }
  return data;
};

const refreshLocalTokens = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  const tokens = await requestLocalAuth("/auth/local/refresh/", { refresh });
  setTokens({ ...tokens, refresh: tokens.refresh || refresh });
  return tokens;
};

const requestLocalAuth = async (path, body) => {
  const response = await fetch(`${stripTrailingSlash(getApiUrl())}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Local authentication failed.");
  }
  return data;
};

const pkceChallenge = async (verifier) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
};

const randomBase64Url = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

const base64UrlEncode = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const getJwtExpiresAt = (token) => {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const base64UrlDecode = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
};
