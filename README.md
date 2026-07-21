# Symposium — OpenAI Build Week 2026

Symposium is a spatial research platform for students, universities, and research communities. It brings literature discovery, evidence-aware discussion, private scholarly work, collaboration, publishing, and contextual AI into one connected environment.

**Build Week deployment:** [buildweek.symposiumsci.com](https://buildweek.symposiumsci.com)

**Submission track:** Education

**Frozen release:** `build-week-2026-submission`

## The product

Symposium is organized as a set of connected rooms rather than a conventional dashboard:

- **Library** — discover papers, inspect structured scholarly records, preview PDF and DOCX attachments, and translate the visible document page in place.
- **Symposium** — publish papers and thoughts, discuss claims and evidence, quote sources, save work, signal contributions, and follow complete reply trees.
- **Office** — keep private notebooks and drafts, collaborate with controlled roles, capture sourced Quick Notes, work with a contextual AI Tablet, and publish exact saved revisions.
- **Communities** — organize public and private research groups, membership requests, governance, announcements, calls, and community-specific activity.
- **Messages** — use direct and group conversations with attachments, drafts, search, shared media, read state, unread reconciliation, and live updates.
- **Opportunities and Patronage** — develop research opportunities and funding proposals from private drafts into structured public records.

The interface supports day and night environments, canonical deep links, responsive laptop layouts, durable persistence, and authenticated multi-session use.

## A three-minute path through Symposium

The submission demo follows one concrete research loop:

1. Enter through the Main Hall and open the Library.
2. Search the historical corpus and open a paper.
3. Translate the visible PDF page in the document viewer.
4. Save a sourced Quick Note and join the paper discussion.
5. Move into the Office and develop the note with the contextual AI Tablet.
6. Publish the exact saved revision.
7. Verify the publication and discussion on the resulting public record and profile.

Communities, the Amphitheater, Messages, Opportunities, and the wider spatial shell extend that same discover-to-publish system.

## OpenAI and Codex

Codex was the primary engineering collaborator during Build Week: it was used to inspect the existing architecture, implement features across the frontend and backend, design migrations and contracts, repair browser-visible defects, run focused and full verification, and verify deployed behavior.

The live product uses the OpenAI Responses API with `gpt-5.6-terra` for:

- a context-grounded AI Tablet that receives the active user, workspace, task, attachment text, and visible PDF-page context;
- structured, visible-page translation for PDF and DOCX documents;
- vision input for scanned or image-only PDF pages;
- reviewable translation output that can be saved as a private sourced Quick Note;
- hard per-user, global, daily, and monthly usage limits with durable accounting.

The assistant distinguishes current evidence from requested actions. Document translation is deliberately page-scoped: it translates the page in view and leaves other pages in their original form.

## Build Week scope

Symposium existed before Build Week. The submission evaluates the meaningful work completed during the July 13–21, 2026 event window.

- **Pre-event evidence boundary:** `6f61b017`
- **Build Week implementation range:** `8a68257..a28d5dc`
- **Build Week change set:** 113 commits, 397 files changed, 49,735 additions, and 5,228 deletions

That work includes the durable Office and collaboration system, Quick Notes, revision-safe publishing, Communities and Opportunities workflows, the production messaging and notifications system, bounded backend read models and idle-cost containment, contextual AI execution, in-view document translation, scanned-page vision translation, the historical demonstration corpus, and final Main Hall and Office interaction polish.

The repository history is intentionally retained so the pre-existing product and eligible Build Week work remain inspectable.

## Architecture

- **Web:** Next.js, React, and TypeScript on Vercel
- **API:** Fastify and TypeScript on Render
- **Persistence:** PostgreSQL on Neon with versioned migrations
- **Authentication:** Clerk
- **Attachments:** Cloudflare R2 with verified staged uploads and durable deletion
- **Shared mutation limiting:** Upstash Redis
- **AI:** OpenAI Responses API
- **Live convergence:** authenticated server-sent events with durable cursor recovery and cross-tab reconciliation

Domain writes, idempotency receipts, audit records, and durable live events are committed transactionally. Private workspaces, conversations, notifications, community membership, and personalized projections are authorized server-side.

## Run locally

Requirements: a current Node.js release and npm.

```bash
npm install --cache .npm-cache
cp .env.example .env.local
npm run dev
```

Without live provider variables, the application runs in local preview mode. See [`docs/backend.md`](docs/backend.md) and [`.env.example`](.env.example) for the independent API, database, authentication, storage, and AI configuration.

## Verification

```bash
npm run verify
npm audit --omit=dev --audit-level=high
```

`npm run verify` runs the architecture, security, cost-boundary, read-model, routing, persistence, collaboration, messaging, attachment, AI, TypeScript, production-build, and hydration gates used for the frozen submission release.

Write-path smoke tests are intentionally separate because they create persistent verification records:

```bash
npm run api:smoke
npm run api:smoke:writes
```

## Frozen Build Week installation

This repository and `buildweek.symposiumsci.com` are the independent Build Week installation. They use dedicated deployment, database, authentication, storage, rate-limit, and AI resources. Future development and user activity in the main Symposium product do not synchronize with this release in either direction.
