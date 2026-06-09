# Rust Learning Manual

Rust Learning Manual is a self-hostable Rust learning site with authored MDX
manual content and runnable Rust snippets. It is built as a React single-page
app plus a Node.js/Express proxy that submits code to the public Rust Playground.

## What It Does

- Presents developer-focused Rust manual sections for getting started,
  ownership, types, and errors.
- Renders MDX content with reusable callouts, copyable code blocks, and runnable
  snippets.
- Lets readers edit Rust examples in a CodeMirror editor, run them, and view
  stdout, stderr, compiler output, loading states, and actionable error hints.
- Supports light and dark themes, responsive section navigation, and an
  in-page table of contents generated from content headings.

## Architecture

- `apps/web` is the Vite/React/Tailwind SPA. MDX files live under
  `apps/web/src/content`; shared content components and playground components
  live under `apps/web/src/components`.
- `apps/api` is the Express proxy. It exposes `/health` and `/run`, validates
  run requests, enforces source-size caps, applies per-client rate limiting, and
  forwards execution to `play.rust-lang.org`.
- Runtime configuration is environment-driven. The API reads bind settings,
  allowed CORS origins, Rust Playground upstream URL, timeout, code-size cap,
  and rate-limit settings from env vars documented in `.env.example`.
- Self-hosting uses `apps/web/dist` as a static SPA bundle and `apps/api/dist`
  as the proxy. A reverse proxy should route `/run` and `/health` to the API and
  all other paths to the SPA with an `index.html` fallback.

## Error Handling And UX

- API errors use structured JSON: `{ "error": { "code": "...", "message": "..." } }`.
- Validation and size failures return 4xx responses, rate limits return `429`,
  upstream Playground failures return `502` or `504`, and unexpected server
  failures return `500` while logging full server-side details.
- The frontend preserves diagnostic code/status details while also showing
  user-facing recovery guidance.

## Conventions

- Keep manual content in MDX and prefer reusable MDX components for repeated
  presentation patterns.
- Keep Rust execution behind the Express proxy; the browser should call `/run`
  rather than the Rust Playground directly.
- Keep deployment configuration in environment variables and document new
  runtime settings in `.env.example`.
- Validate changes with unit tests, typecheck, build, lint, format check, and
  the Playwright E2E test when the runnable snippet flow is affected.
