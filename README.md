# GitReverse

GitReverse is a Next.js app that turns a GitHub repository into a synthetic "build prompt" suitable for coding agents.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS
- LLM fallback chain:
  1. OpenRouter (`OPENROUTER_API_KEY`, default model `google/gemini-2.5-pro`)
  2. Google AI Studio OpenAI-compatible endpoint (`GOOGLE_AI_STUDIO_API_KEY`, default model `gemini-2.5-pro`)
- Optional Supabase (cache + analytics)

## Environment

Create `.env.local`:

```bash
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-pro
GOOGLE_AI_STUDIO_API_KEY=
GOOGLE_AI_STUDIO_MODEL=gemini-2.5-pro
GITHUB_TOKEN=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
EXTERNAL_REVERSE_URL=http://localhost:3001
VIEWS_IP_SALT=dev-salt
```

## Run

```bash
npm install
npm run dev
```

## Supabase notes (optional)

If `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` are set, the app will use:

- `prompt_cache(owner, repo, prompt, source_url, created_at, view_count)`
- `custom_prompt_cache(owner, repo, focus_fingerprint, prompt, source_url, created_at)`
- RPC function `increment_views(p_owner text, p_repo text, p_ip_hash text)` for unique-view tracking.

Cache failures are non-fatal and are logged.
