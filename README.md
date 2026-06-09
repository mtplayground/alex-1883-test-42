# Rust Learning Manual

Rust Learning Manual is a React and MDX single-page manual with runnable Rust
snippets. The frontend renders manual content and CodeMirror editors; the
Node.js/Express proxy validates `/run` requests, rate-limits clients, and
forwards code execution to `play.rust-lang.org`.

## Project Layout

- `apps/web`: Vite, React, Tailwind, MDX content, runnable snippet UI, unit and
  Playwright E2E tests.
- `apps/api`: Express proxy with `/health` and `/run`, CORS, request logging,
  validation, rate limiting, upstream timeouts, and structured error responses.
- `.env.example`: documented runtime configuration for the API proxy.

## Local Development

Install dependencies once:

```bash
npm install
```

Run the frontend development server on `0.0.0.0:8080`:

```bash
npm run dev:web
```

Run the API proxy in watch mode:

```bash
npm run dev:api
```

For local browser-to-proxy testing from the Vite dev server, copy
`.env.example` to `.env` and set `ALLOWED_ORIGINS=http://localhost:8080`.

## Configuration

The API reads runtime configuration from environment variables:

- `HOST` and `PORT`: bind address and port for the Express proxy.
- `ALLOWED_ORIGINS`: comma-separated browser origins allowed by CORS. Use the
  public frontend origin in production.
- `RUST_PLAYGROUND_URL`: upstream Rust Playground base URL.
- `RUST_PLAYGROUND_TIMEOUT_MS`: upstream request timeout in milliseconds.
- `RUN_CODE_MAX_BYTES`: maximum UTF-8 byte size accepted by `POST /run`.
- `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`: per-client rate limit.

See `.env.example` for defaults and deployment notes.

## Build And Validation

Run the full non-E2E validation set:

```bash
npm run test
npm run typecheck
npm run build
npm run lint
npm run format:check
```

Run the browser E2E test. The Playwright config starts the web server and stubs
`/run` inside the test:

```bash
npm run test:e2e
```

If the host does not already have Playwright browsers installed, run:

```bash
npx playwright install chromium
```

## Bare Self-Hosted Deployment

Build both workspaces:

```bash
npm ci
npm run build
```

This produces:

- `apps/web/dist`: static frontend bundle.
- `apps/api/dist`: compiled Express proxy.

Run the proxy with production environment variables:

```bash
HOST=0.0.0.0 \
PORT=8080 \
ALLOWED_ORIGINS=https://rust-manual.example.com \
RUST_PLAYGROUND_URL=https://play.rust-lang.org \
RUST_PLAYGROUND_TIMEOUT_MS=10000 \
RUN_CODE_MAX_BYTES=100000 \
RATE_LIMIT_WINDOW_MS=60000 \
RATE_LIMIT_MAX_REQUESTS=60 \
npm run start:api
```

Serve `apps/web/dist` with any static file server or reverse proxy. Route
`POST /run` and `GET /health` to the API proxy, and route all other paths to the
SPA bundle with an `index.html` fallback.

Minimal Nginx shape:

```nginx
server {
  listen 80;
  server_name rust-manual.example.com;

  root /srv/rust-learning-manual/apps/web/dist;
  index index.html;

  location /run {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /health {
    proxy_pass http://127.0.0.1:8080;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Error Handling

The proxy returns structured JSON errors in the shape
`{ "error": { "code": "...", "message": "..." } }`. Validation failures use
4xx responses, rate limiting uses `429`, upstream Rust Playground failures use
`502` or `504`, and unexpected server failures use `500` with full details
logged on the server. The frontend output panel shows the user-facing message,
recovery guidance, and diagnostic code/status details.
