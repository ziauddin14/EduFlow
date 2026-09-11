# EduFlow

A polished School Management System sales demo built by Softwaremine for private-school
outreach. See `EduFlow MVP.docx` for the full product specification — this README covers
local setup only.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · MongoDB Atlas + Mongoose ·
NextAuth (Credentials) · Recharts · Gemini API · Vercel

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI` — a MongoDB Atlas connection string
   - `NEXTAUTH_SECRET` — any long random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev
   - `GEMINI_API_KEY` — a Gemini API key (needed for the AI Assistant module)

3. Seed demo data:

   ```bash
   npm run seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Demo accounts

Seeded by `npm run seed`. Password is the same for all three: **`Demo@123`**

| Role    | Email                 |
|---------|------------------------|
| Admin   | admin@eduflow.demo    |
| Teacher | teacher@eduflow.demo  |
| Staff   | staff@eduflow.demo    |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm run test` — Vitest
- `npm run seed` — populate MongoDB with demo data (idempotent, safe to re-run)

## Project status

Implementation follows the day-by-day plan in the spec (Foundation → Core Operations →
Financial & Academic → Intelligence & Reporting → Polish/Testing/Deployment). Modules not
yet implemented show a placeholder page in the app so navigation and role-based access can
be reviewed end-to-end from Day 1 onward.

## Known limitations (Day 1 baseline)

- TypeScript is pinned to `6.0.3` rather than the newer `7.x` that was in the original
  dependency list — `typescript-eslint` (used by `eslint-config-next`) does not yet support
  TypeScript 7, so linting would fail entirely on that version. Application type-checking
  itself (`next build`) is unaffected either way.
- ESLint is pinned to `9.39.5` rather than `10.x` — `eslint-plugin-react` (bundled inside
  `eslint-config-next`) crashes under ESLint 10's flat-config API. Both downgrades are pure
  tooling version pins with no effect on application code or the locked product stack.
- `middleware.ts` uses Next.js's (deprecated but still supported) middleware convention
  rather than the newer `proxy.ts` — an automatic codemod migration is available
  (`npx @next/codemod@canary middleware-to-proxy .`) but was deferred to avoid an unreviewed
  rewrite of the auth-protection file.
