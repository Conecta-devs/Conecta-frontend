# Conecta-frontend/src/shared/ui/

## Responsibility

Project design system: stateless, prop-driven Vue components that implement the Figma component library (buttons, links, logos, icons, auth form atoms and decorative/article surfaces).

## Design

- Presentational components only; state is local interaction state (hover, reveal timers, password visibility) and outputs are slots/events (`AppButton`, `AppLink`, `AppAuthTabs`, `AppCartaz`, `AppModal`-style contracts).
- Variant tables map named options to Tailwind utility strings (`AppButton` coral/blue ± outline, `AppLink`, `AppLogo`), keeping design tokens in `app/styles/tailwind.css`.
- SVG paths are centralized in `icons.ts` (single source of truth, with the `DashboardIconName` type); `AppIcon`, `AppAuthIcon` and `AppDashboardIcon` import from it so glyph edits live in one file. `AppArrowIcon` and `AppLogo` (imported SVG marks blended with a live wordmark) keep their own paths.
- Motion components (`BlurReveal`, `AppLogoAnimated`) use CSS animations with `prefers-reduced-motion` fallbacks and cleanup of timers on unmount.
- Accessibility support: `aria-hidden` on decorative glyphs, `aria-pressed` on tabs, `aria-busy` on buttons, `sr-only` text in `BlurReveal`, focus-visible outlines.

## Flow

Feature page passes props/slots → component computes classes/styles from token maps → hover/focus or mounted state toggles CSS transitions → optional emit (e.g. `cta`, `select`) returns control to the page.

## Integration

Consumed by every feature folder (landing, auth, catalog, dashboard) and by `layouts/DashboardLayout.vue`. Depends on `icons.ts`, `shared/types/`, static assets in `src/assets/` and globally registered FontAwesome.
