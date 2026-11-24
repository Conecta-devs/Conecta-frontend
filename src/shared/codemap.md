# Conecta-frontend/src/shared/

## Responsibility

Cross-feature application layer: reusable design-system components (`ui/`), session/token singleton (`services/`) and shared TypeScript contracts (`types/`).

## Design

- `ui/`: presentational SFCs mapped to Figma components with prop-driven variants, slots/emits and Tailwind token classes; no business logic or API calls.
- `services/session.ts`: single source of truth for `currentUser` (Vue `reactive`), token/cookie reads and localStorage writes; session, token and last-email keys are centralized constants.
- `types/auth.ts`: minimal `AuthUser` interface shared by auth services, dashboard identity hydration and profile editing.
- `composables/`: currently holds no code (only this folder's codemap); it is reserved for future shared composables.
- Dependency direction is one-way: features import shared code; shared modules never import feature modules.

## Flow

Session write (login/register/profile edit) → `saveSession()` → reactive `currentUser` update + localStorage → router guard/`isAuthenticated()` and API clients read the same state. UI components receive data via props and emit events back to feature pages.

## Integration

Consumed by `router/index.ts`, `layouts/DashboardLayout.vue`, all `features/` pages and the dashboard API/socket services. Consumes only Vue, Vue Router types, and Tailwind tokens from `app/styles/tailwind.css`.
