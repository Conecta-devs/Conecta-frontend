# Conecta-frontend/src/shared/composables/

## Responsibility

Placeholder directory for shared Composition API helpers. It currently contains no composables — the former body scroll-lock helper and its canvas-layout consumer were removed in an earlier refactoring.

## Design

Empty (this codemap is the only file). Any new composable added here must be framework-only (Vue lifecycle/DOM), dependency-free of feature modules, and imported by more than one feature.

## Flow

Not applicable while the directory has no code.

## Integration

Nothing consumes this directory yet. Shared UI behavior that previously lived here now belongs to the component that needs it (see `shared/ui/`).
