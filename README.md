# SYMPOSIUM

Early public prototype for the Science Rebirth software vessel.

## Run locally

```bash
npm install --cache .npm-cache
npm run dev
```

## Production check

```bash
npm run typecheck
npm run build
npm run start
```

## Persistence

The app uses API routes for profiles, posts, comments, and post actions.

- Locally, data is stored in `.data/symposium.json`.
- In production, set `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRES_PRISMA_URL` to use hosted Postgres.
- If no database URL is present on Vercel, the site still builds and runs, but writes are not durable across serverless instances.

## Current v0 shape

- Greco-futurist arrival screen.
- Room shell for Office, Symposium, Library, and Amphitheater.
- Seeded feeds for papers, thoughts, drafts, code, and saved work.
- Lightweight account/profile creation and switching.
- Persisted post creation, comments, nested replies, saves, signals, forks, and reads.
- Paper/thought detail views with claims, objections, evidence, tests, forks, comments, and signal panels.
- Notebook and AI tablet concepts.
- Profile concept and day/night mode.
