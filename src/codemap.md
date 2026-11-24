# Conecta-frontend/src/

## Responsibility

Application source root, organized into five layers: `app/` (bootstrap + global styles), `router/` (route table and navigation guard), `layouts/` (authenticated shell), `features/` (auth, catalog, landpage, profile, dashboard), `shared/` (design-system components with SVG paths centralized in `icons.ts`, session service, types).

## Design

- Feature-sliced architecture: each feature owns its pages, components and API services; cross-feature primitives live in `shared/`.
- Vue 3 `<script setup lang="ts">` SFCs throughout, Composition API refs/computed, `defineModel`/`defineEmits` for component contracts.
- Lazy route components via dynamic `import()`; only the shell is eager.
- Global design tokens are defined once in `app/styles/tailwind.css` (`@theme`) and consumed as utility classes in all features.
- Client-side session is a reactive singleton (`currentUser`) in `shared/services/session.ts`, with token reads centralized for REST and Socket.IO clients.

## Flow

`index.html` → `app/main.ts` → register `font-awesome-icon`, install router → `App.vue` renders `<RouterView>` → guard resolves public vs dashboard routes → layout/shell renders feature pages → feature services call backend → reactive state updates views; chat additionally listens to Socket.IO events.

## Integration

`app/` depends on `router/`, `router/` imports `shared/services/session.ts` and lazy-loads every `features/` page; `layouts/` composes dashboard components from `features/dashboard/` and the profile modal. `features/` consumes `shared/ui/` and `shared/types/auth.ts`.
