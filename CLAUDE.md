# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Bắt Bóng Số & Chữ" — a Vietnamese-language Angular game for children (3-6 y/o) that teaches
counting and the Vietnamese alphabet by popping balloons. Angular 20 (zoneless, standalone
components, signals), SSR via Angular SSR/Express, and installable as a PWA (service worker +
manifest). UI strings, comments in core services, and speech output are in Vietnamese — keep new
user-facing text and voice-related code consistent with that.

## Commands

```bash
npm start            # ng serve — dev server at http://localhost:4200/
npm run build         # ng build — production build (SSR) to dist/
npm run watch          # ng build --watch --configuration development
npm test              # ng test — Karma/Jasmine unit tests, watches by default
node dist/gameStudy/server/server.mjs   # run the built SSR server (serve:ssr:gameStudy script)
```

To generate a component/service via schematics, use `ng generate component features/<name>` etc.
— note the project has no `.cursorrules`/ESLint config; formatting is governed by
`.editorconfig` and the `prettier` key in [package.json](package.json) (single quotes, 100 print
width, Angular parser for `*.html`).

There is no e2e test setup and no lint script configured.

## Architecture

### Routing & guards
Three standalone, lazy-loaded routes defined in [src/app/app.routes.ts](src/app/app.routes.ts):
`/` (Welcome — enter child's name), `/start` (mode picker), `/play` (the game). `/start` and
`/play` are protected by [hasChildNameGuard](src/app/core/has-child-name.guard.ts), which
redirects to `/` if no child name is set in `GameStateService`.

### State: GameStateService
[src/app/core/game-state.service.ts](src/app/core/game-state.service.ts) is the single source of
truth, built entirely on signals (no NgRx/store library). It holds `childName`, `mode`
(`'number' | 'letter'`), `levelIndex`, `totalStars`, and a computed `isPhone` (based on a
`matchMedia` breakpoint). It persists `childName`, `totalStars`, and per-mode best level to
`localStorage` under key `bat-bong-so-chu:v1`, guarded by `isPlatformBrowser` checks so it's safe
under SSR. Components read/act on game state by injecting this service directly rather than
through inputs/outputs.

### Content/config: theme.ts
[src/app/core/theme.ts](src/app/core/theme.ts) is the design/content data module: balloon color
palettes, motion timing constants (`MOTION`), breakpoints, the Vietnamese alphabet, level
generation for both modes (`NUMBER_LEVELS` built from ranges, `LETTER_LEVELS` from the alphabet
split into 7 groups), praise phrases, and small random-pick helpers. Add new levels/content here,
not in components.

### Speech
[src/app/core/speech.service.ts](src/app/core/speech.service.ts) wraps the Web Speech API
(vi-VN voice). Browsers block autoplay audio, so `unlock()` must be called from a user gesture
(done in Welcome/Start on first touch/continue) before `speak()` will reliably produce sound.
No-ops silently when not in a browser or when speechSynthesis is unavailable.

### Play screen mechanics
[src/app/features/play/play.ts](src/app/features/play/play.ts) is the core game loop: it spawns
balloons into fixed "lanes" (`maxBalloons` = 4 on phone / 6 otherwise) on an interval, tracks a
current `target` value, and on catch either awards a star via `GameStateService.addStars` and
advances the target, or marks the balloon wrong. After `CORRECT_CATCHES_PER_LEVEL` (5) correct
catches it triggers a level-up (confetti + praise speech) and calls
`GameStateService.advanceLevel()`. A hint timer (`MOTION.hintDelayMs`) highlights the correct
balloon and re-speaks the prompt if the child hasn't acted. All timers
(`spawnTimer`/`hintTimer`/`removalTimers`) are cleaned up in `teardown()`, called both on
`DestroyRef.onDestroy` and when navigating home — keep this pattern when touching the loop to
avoid leaked intervals.

### Shared components
`src/app/shared/` holds small standalone, `OnPush` presentational components consumed by the
features: `Balloon` (pointer/keyboard-activatable balloon, emits `caught`/`reachedTop`), `Mascot`
(bouncing SVG mascot), `AppIcon` (inline SVG icon set switched by `name` input), and `ModeCard`
(number/letter mode selector card). These take inputs/emit outputs only — no service injection —
so keep new shared UI pieces presentational too.

### PWA / SSR
- Service worker config: [ngsw-config.json](ngsw-config.json) (app shell prefetched, media assets
  lazy, Google Fonts cached as data groups). Registered in
  [src/app/app.config.ts](src/app/app.config.ts) only when not `isDevMode()`.
- SSR entry points: [src/main.server.ts](src/main.server.ts),
  [src/server.ts](src/server.ts) (Express), route rendering mode in
  [src/app/app.routes.server.ts](src/app/app.routes.server.ts) (currently full prerender for all
  routes).
- Manifest and icons live under [public/](public/); static assets referenced by components (e.g.
  mascot SVGs) also live there and are served at `/assets/...`.
