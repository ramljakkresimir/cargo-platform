# CargoConnect BiH — Development Journal

## Product Philosophy

CargoConnect is a connection platform, not a transport management system.

Every new feature must help users find transport or cargo faster, easier, or with more trust.

Simplicity is preferred over enterprise complexity.

The primary target users are small transport companies and owner-drivers in Bosnia and Herzegovina and Croatia.

Features that increase marketplace liquidity — better matching, easier search, notifications, and trust — take priority over infrastructure improvements unless they block production.

---

## Project Overview

A full-stack logistics marketplace for the Bosnia and Herzegovina market, inspired by TIMOCOM but scoped as a focused MVP for the local market. Connects companies that need cargo transported with transport companies and drivers that have available vehicle capacity.

**Stack:** React 19 + TypeScript + Vite (frontend) · NestJS 11 + TypeScript (backend) · PostgreSQL via TypeORM (database) · JWT/HS256 auth · npm workspaces monorepo.

Full stack details, the backend/frontend directory layout, and the module map live in **[docs/architecture.md](docs/architecture.md)**.

---

## Documentation Map

This file is a summary. Detailed, current-state documentation lives under `docs/`:

| Doc | Covers |
|-----|--------|
| [docs/architecture.md](docs/architecture.md) | Technology stack, backend/frontend directory structure, module responsibilities |
| [docs/database-schema.md](docs/database-schema.md) | Every table, column, type, constraint, and index |
| [docs/api-reference.md](docs/api-reference.md) | All REST endpoints (cities, auth, companies, cargo/vehicle posts, users, conversations, admin) + the standard error response shape |
| [docs/frontend-pages.md](docs/frontend-pages.md) | Route table, page components, auth requirements, role-based access control |
| [docs/environment-variables.md](docs/environment-variables.md) | Full `.env` reference for backend and frontend |
| [docs/development-workflow.md](docs/development-workflow.md) | Monorepo scripts, setup instructions, git workflow/history |
| [docs/key-decisions.md](docs/key-decisions.md) | Why TypeORM, JWT design, the full Session 20 auth/security architecture (email verification, password reset, CAPTCHA, rate limiting), migrations, monorepo tooling choices |
| [docs/known-issues.md](docs/known-issues.md) | Open caveats plus resolved Windows/npm-workspace port and hoisting bugs (with root causes) |
| [docs/todo.md](docs/todo.md) | Feature checklist — done vs. open |
| [docs/changelog/](docs/changelog/README.md) | Full session-by-session implementation history (Sessions 1–25) |

**When starting work:** read this file for orientation, then open the specific doc(s) relevant to the task — e.g. editing an endpoint → `api-reference.md` + `key-decisions.md`; touching a DB column → `database-schema.md`; onboarding a new page → `frontend-pages.md`. Update the relevant `docs/*.md` file (not this one) when you change behavior, and add a new `docs/changelog/` entry for the session's work.

---

## Current State (as of Session 25 — 2026-08-27)

The MVP is feature-complete for its original scope:
- Auth: JWT + bcrypt, mandatory email verification, password reset, adaptive CAPTCHA (Cloudflare Turnstile), per-route rate limiting, no permanent lockout
- Marketplace: cargo/vehicle post CRUD, ownership-scoped editing, public browse, pagination
- Location intelligence: normalized cities, ORS-driven route-corridor matching, route map visualization, cached road-distance lookups
- Trust/UX: full Croatian localization, redesigned card-based search/listing pages, in-app chat ("Razgovori"), user ratings (1–5 stars, shown on profile/listing pages/search cards, given via an always-visible immediate-submit star input) replacing static contact info
- Admin: user/post CRUD, role management, company-profile view/edit, bulk expired-post closing, dashboard stats
- Production readiness: TypeORM migrations (no more `synchronize` reliance in prod), Joi env validation, consistent error shapes, test coverage on lifecycle/guard logic (12 suites / 107 tests as of Session 25 — unchanged from Session 24, this session's fixes were frontend-only)

Open items (Docker Compose, actual deployment, MFA for admins, background email queueing) are tracked in **[docs/todo.md](docs/todo.md)**.

---

## Known Issues (quick pointer)

Windows-specific dev-environment gotchas (port conflicts, npm workspace hoisting) have all been root-caused and fixed — see **[docs/known-issues.md](docs/known-issues.md)** for the resolved list and a couple of small open notes (e.g. `@types/react-router-dom` v5 leftover, `Company.userId` exposure).
