# Conecta-frontend/src/features/dashboard/components/

## Responsibility

Reusable dashboard UI: navigation shell widgets, calendar grid, agenda detail/participation modal, and generic dialog/state helpers.

## Design

- `AppSidebar.vue`: navigation links built from a `menuItems` array, active-route highlighting, profile menu, logout via `fetchApi(apiUrl('/auth/logout'))` + `clearSession()` + redirect, and emits `close-mobile` / `open-profile-config`.
- `AppHeader.vue`: date label and search input emitting `update:searchValue` / `search-input`; reads `currentUser` for identity display.
- `DashboardCalendar.vue`: month grid computed from `viewYear`/`viewMonth`, per-day agenda/participation markers, `select-day` event, month navigation and "today" reset.
- `AgendaDetailsModal.vue`: loads participation records for a set of agenda items, toggles interest/attendance through `agenda.ts`, emits `participation-change`, `edit`, `cancel`, `close`; Escape/backdrop handling via `AppModal`.
- `AppModal.vue`: generic backdrop/teleport-style wrapper emitting `backdrop`; `ConfirmDialog.vue` composes it with `confirm`/`cancel` events; `AsyncState.vue`, `PageHeader.vue`, `AppEyebrow.vue` (via `variante="dashboard"`), `AgendaDetailsButton.vue` are small presentational helpers; `UserAvatar.vue` renders an avatar with an initials fallback; `ChatConfirmDialog.vue` handles chat confirmations with initial focus on Cancel and a Tab focus trap.
- Consistent use of `AppDashboardIcon`, `AppArrowIcon`, `AppLogo`, `AppLogoAnimated` from the shared design system.

## Flow

Page passes items/flags as props → component computes derived view state → user action emits an event → page performs the API mutation and refreshes state → props change → component re-renders. Logout path is self-contained in `AppSidebar`.

## Integration

Consumed by `layouts/DashboardLayout.vue` (sidebar/header) and by dashboard pages (calendar, modal, dialogs, state helpers). Depends on `dashboard/services/{api,agenda}.ts`, `auth/services/auth.ts` and `shared/services/session.ts`.
