# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`les-freres-barbiers` — a barbershop website. The repo is currently a fresh
Vite + React 19 + TypeScript scaffold: `src/App.tsx` still holds the default
Vite/React starter landing page (hero logos, counter button, docs/social
links). Expect to replace this starter content when building out the real site.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Type-check (tsc -b) then production build to dist/
npm run lint       # Run ESLint over the repo
npm run preview    # Serve the built dist/ locally
```

There is no test runner configured. `npm run build` is the gate that must pass —
it runs `tsc -b` (project-references build) before `vite build`, so a type error
fails the build even though Vite itself would not type-check.

## Architecture & conventions

- **Build**: Vite 8 with `@vitejs/plugin-react`. Entry is `index.html` →
  `src/main.tsx` → mounts `<App />` into `#root` under `<StrictMode>`.
- **Styling**: Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no
  `tailwind.config.js`, no PostCSS config — v4 is configured in CSS). Alongside
  Tailwind, plain CSS lives in `src/index.css` (global) and `src/App.css`
  (component). Mixing Tailwind utility classes and hand-written CSS is expected.
- **TypeScript**: split project references — `tsconfig.app.json` (the `src/`
  app, bundler mode, `noEmit`) and `tsconfig.node.json` (the Vite config),
  joined by the root `tsconfig.json`. App config enables strict-ish unused-code
  rules (`noUnusedLocals`, `noUnusedParameters`) and `verbatimModuleSyntax`, so
  import type-only symbols with `import type` and remove unused locals/params.
- **Assets / icons**: bundled assets (logos, `hero.png`) are imported from
  `src/assets/`. SVG icons are served statically from `public/icons.svg` and
  referenced by fragment, e.g. `<use href="/icons.svg#github-icon">` — add new
  icons as `<symbol id="...">` entries there rather than as React components.
- **Lint**: flat ESLint config (`eslint.config.js`) extends the recommended JS,
  typescript-eslint, react-hooks, and react-refresh rule sets. `dist/` is
  ignored. The react-refresh rule expects component files to export only
  components (keep non-component exports out of `.tsx` component files).
