/**
 * Token persistence lives outside the Zustand store so the Axios interceptors
 * can read/write tokens without importing React state (and without a cycle).
 */

const ACCESS_KEY = "ridex.access_token";
const REFRESH_KEY = "ridex.refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (!hasStorage()) return null;
  accessToken = window.localStorage.getItem(ACCESS_KEY);
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  if (!hasStorage()) return null;
  refreshToken = window.localStorage.getItem(REFRESH_KEY);
  return refreshToken;
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (!hasStorage()) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (!hasStorage()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}
