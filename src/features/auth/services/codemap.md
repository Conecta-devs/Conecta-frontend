# Conecta-frontend/src/features/auth/services/

## Responsibility

HTTP client for authentication/profile endpoints and the shared protected-fetch wrapper used by all authenticated API services.

## Design

- Low-level plumbing comes from `dashboard/services/api.ts` (`apiUrl`, `fetchApi` with timeout). Endpoints: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/profile`, `/auth/edit`.
- `normalizeUser()` and `isRecord()` defensively narrow unknown JSON into `AuthUser`; `responseMessage()`/`readRecoveryMessage()` extract backend error text with fallbacks.
- `refreshAccessToken(expectedAccessToken)`: calls `/auth/refresh`, detects concurrent token changes, saves the rotated token with `saveSession(user, data.accessToken)`.
- `fetchProtected()`: adds `Authorization: Bearer <token>` + `X-CSRF-Protection: 1`, retries once after a 401 refresh, and on failure calls `clearSession()` and redirects to `/login`.
- `getUserProfile()` uses the protected fetch; `updateUserProfile()` retries `/auth/edit` after a profile identity refresh when the first attempt is rejected.

## Flow

Caller → `fetchProtected(url, init)` → read token → `fetchApi` → 401 → `refreshAccessToken()` → retry → parsed/normalized data. Login flow: `loginUser()` → save session → page redirects. Recovery flows return human-readable status strings.

## Integration

Imported by auth pages, profile modal, dashboard pages (identity hydration), `chatSocket.ts` (token recovery via `getUserProfile()`), and `dashboard/services/{posts,agenda,chat}.ts` (through `fetchProtected`).
