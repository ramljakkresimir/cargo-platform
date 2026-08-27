# Implemented Features — Sessions 18–19

### Session 18 — 2026-07-14

#### Code review remediation (`CODE_REVIEW.md`, full-repo static review)

A full-repo code review (backend + frontend + docs, static analysis only — no `node_modules` on the review machine) found 3 HIGH, 9 MEDIUM, and 8 LOW findings. H1–H3 and M2 were fixed in the previous session (`a684ac0`, `354bd01`, `76d3e3b`, `b45f8a3`). This session closed every remaining finding except L5, one commit per finding, `npm run build` green before each commit.

**M1 — Post status lifecycle wasn't enforced (`739b992`)**
`UpdateCargoPostDto`/`UpdateVehiclePostDto` accepted the full `PostStatus` enum, so an owner could `PATCH` a post straight to/from `expired` via the API even though the UI and docs only ever exposed active/closed. `CargoPostsService.update()` / `VehiclePostsService.update()` now validate the transition in the service layer: owners may only toggle `active ⇄ closed`; reactivating a closed post is rejected if its date has since passed. Admin's separate `updateCargoPostStatus`/`updateVehiclePostStatus` (direct field assignment, no owner-transition check) is unaffected — expiry remains settable only by the cron/startup sync/admin trigger, per the documented lifecycle.

**M8 — `synchronize: true` was unconditional (`0cce477`)**
`app.module.ts` now gates TypeORM `synchronize` behind `NODE_ENV !== 'production'`. Prerequisite for the deployment TODO; real migration files still needed before an actual production deploy.

**M4 — Hardcoded URLs on both sides (`6f7cd20`)**
Frontend `api.ts` `baseURL` now reads `import.meta.env.VITE_API_URL` (fallback `http://localhost:3000`); backend CORS origin now reads `process.env.CORS_ORIGIN` (fallback `http://localhost:5173`). Added `frontend/.env.example` and a `CORS_ORIGIN` line in `backend/.env.example`.

**M5 — No 401 handling on the frontend (`9a44e15`)**
Added an axios response interceptor in `api.ts`: on a 401 response to a request that *carried* an `Authorization` header (i.e. an authenticated call whose token was rejected — not an anonymous login attempt with bad credentials, which also returns 401 but never had a header), it clears `localStorage` and redirects to `/login`. `LoginPage` reads a `sessionStorage` flag set by the interceptor to show "Vaša sesija je istekla. Prijavite se ponovo."

**M7 — N+1 city queries (`b91b0f0`)**
`CargoPostsService`/`VehiclePostsService` `findOne()` and `findByCompanyId()` issued a manual `citiesService.findById()` per city per row — the code comment claiming "TypeORM object-form relations don't support nested join arrays" was wrong for sibling relations. Replaced with the same `relations: { ... }` object `findAll()` already used. Verified against the running backend: `GET /cargo-posts/:id` and `GET /vehicle-posts/:id` return identical payload shapes.

**L3 — Destination city fetched twice on vehicle-post create (`5621e87`)**
`VehiclePostsService.create()` looked up `dto.destinationCityId` once for the denormalized name and again for route generation. Now fetched once and reused.

**M6 — Multi-step writes weren't transactional (`533c876`)**
`AdminService.deleteUser()`'s cascade (cargo posts → vehicle posts → company → user) now runs inside `this.userRepo.manager.transaction(...)`. `RouteCityService.generateAndSave()` used to delete a post's existing route cities *before* the slow external ORS call — a crash in that window left zero route cities with no way back. It now computes the full new row set first, then deletes-and-inserts in a single transaction. Verified against the running backend with a disposable test user/company (zero orphaned rows after delete) and a real route regeneration (still finds the correct 6-city Mostar→Zagreb route).

**M9 — No token invalidation on password change (`42fdab2`)**
Added a nullable `passwordChangedAt` column on `User`, set in `UsersService.changePassword()`. `JwtStrategy.validate()` now rejects any token whose `iat` claim predates it — free, since the strategy already re-reads the user from the DB on every request. Verified end-to-end: a token obtained before a password change gets `401 "Token invalidated by password change"` immediately after the change; a fresh login with the new password still works. Left `JWT_EXPIRES_IN` at `7d` — this check closes the actual security gap without forcing more frequent re-logins.

**L1 — Docs said RS256, config is HS256 (`37f9ed5`)**
Fixed the tech-stack table in [Architecture](../architecture.md).

**L2 — Unused NestJS scaffold files (`61de0ec`)**
`AppController`/`AppService` were dead code (never registered in `AppModule`). Repurposed as a real `GET /health` endpoint (`{ status, timestamp }`) instead of deleting them — useful for the deployment TODO (load balancer / uptime checks).

**L4 — ILIKE search terms weren't wildcard-escaped (`bba1776`)**
Added `backend/src/common/utils/escape-like.ts` (`escapeLikePattern()`, escapes `%`, `_`, `\`) and applied it everywhere user text hits `ILIKE` — `cargo-posts.service.ts`, `vehicle-posts.service.ts`, `admin.service.ts`, `cities.service.ts`. Verified: `GET /cities?search=%25` (a literal `%`) now returns `[]` instead of every city.

**L6 — No startup validation of required env vars (`0c3ca3c`)**
Added a Joi `validationSchema` to `ConfigModule.forRoot` (`DATABASE_*`, `JWT_SECRET` min 16 chars, `PORT`). Verified: normal `.env` boots fine; an empty `JWT_SECRET` fails immediately at boot with `Config validation error: "JWT_SECRET" is not allowed to be empty` instead of surfacing later at first sign/verify.

**L7 — `routeGeoJson` shipped the full ORS polyline (`d7ad61e`)**
`RouteCityService` now simplifies the stored route geometry with `@turf/simplify` (Douglas-Peucker, ~100 m tolerance) at write time, while still projecting route-cities against the full-precision coordinates (accuracy matters there, size doesn't). Verified: the documented Mostar→Zagreb test route dropped from 4,642 to 364 points with origin/destination endpoints preserved exactly, and the 6-city route-city match is unchanged.

**L8 — Unguarded `JSON.parse` of localStorage user (`ca89cb4`)**
`AuthContext`'s mount effect now wraps the parse in try/catch; on failure it clears both localStorage keys instead of leaving the app blank.

**M3 — No real tests in the repo (`6f58f01`)**
Added focused unit tests (repositories mocked) for the logic most likely to silently regress: `escape-like.spec.ts` (L4), `cargo-posts.service.spec.ts` / `vehicle-posts.service.spec.ts` (M1 transition rules + past-date guards), `admin.service.spec.ts` (self-delete/last-admin guards, transactional cascade), `posts-expiration.service.spec.ts` (the Session 13 local-date-not-UTC boundary, active-only filter, startup sync). Also fixed the broken e2e scaffold rather than deleting it — updated it to hit the new `GET /health` and switched `import request from 'supertest'` to `require('supertest')` (the former resolved to `.default`/`undefined` at runtime under this project's tsconfig, an interop mismatch the review didn't anticipate but that made the test fail differently than predicted). While wiring up the e2e run, discovered `route-city.service.ts`'s `import ... from '@turf/turf'` barrel pulled in `@turf/convex → concaveman` (ESM-only, with its own nested ESM-only `rbush`/`quickselect`) purely as a side effect of the barrel — none of it is used by this file. Switched to importing `@turf/helpers`, `@turf/nearest-point-on-line`, and `@turf/simplify` directly; verified identical behavior at runtime (same 6-city route, same 364-point polyline) before and after the swap. `npx jest`: 6 suites, 31 tests, all passing. `npx jest --config ./test/jest-e2e.json`: 1 suite, 1 test, passing against the live local Postgres.

**L5 — Registration reveals whether an email exists — deliberately left as-is (Session 18), later closed (Session 20).** At the time, the review framed this as a conscious UX/security trade-off rather than a bug (login already used a generic error; only registration's 409 was specific), and no code change was made in Session 18. That trade-off was revisited and reversed in Session 20: registration no longer returns 409 for a duplicate email — it always returns the same generic response, and a duplicate no longer creates a second account. See "Authentication & Security (Session 20)" in [Key Decisions](../key-decisions.md) for the current behavior.

**Verification approach this session:** every fix that touched runtime behavior (not just types) was exercised against the actual running backend and the live local Postgres — registered/logged in test users, changed passwords, hit admin endpoints with hand-signed JWTs, queried Postgres directly before/after — rather than relying on `tsc`/`vite build` alone. Temporary test rows were cleaned up after each check.

---

### Session 19 — 2026-07-24

#### Fix: pre-existing `npm run lint` failures (frontend + backend)

The Session 18 estimate of "32 pre-existing frontend errors" turned out to be stale: `eslint-plugin-react-hooks` had since moved to v7 (the React Compiler ruleset), which added two stricter rule categories on top of the original hook-declaration-order and `no-explicit-any` issues. Backend `npm run lint` (a separate command, `-w backend`) was also failing — not counted in the original 32 at all — and needed its own fix.

**Frontend:**
- `react-hooks/immutability` (a function referenced before its declaration) — fixed by reordering, same shape as the originally-documented issue: `CargoListPage`, `CargoDetailPage`, `VehicleDetailPage`, `MyPostsPage`, `CompanyProfilePage`.
- `react-hooks/set-state-in-effect` (new in v7) — for genuine derived-state effects (`Navbar` closing the mobile menu on route change, `ProfilePage` pre-filling its form from `user`, `AuthContext` restoring the session from `localStorage`), rewrote to React's own recommended pattern: adjust state during render by comparing against a tracked "previous value," instead of a `useEffect`. This also simplified `AuthContext` — the token/user are now read synchronously via `useState` lazy initializers, so the old mount-effect-plus-`isLoading` dance is gone entirely (no behavior change: `ProtectedRoute`/`AdminRoute` still see `isLoading`, it's just always `false` now since the session is already known by first render). For genuine data-fetching effects (every list/detail page's "fetch on mount or filter change"), added a scoped `// eslint-disable-next-line react-hooks/set-state-in-effect` with a one-line rationale — this is a legitimate, unavoidable pattern the rule doesn't distinguish from the derived-state anti-pattern it's meant to catch.
- `no-explicit-any` — replaced with real types: `Record<string, string | number>` for query params, `Parameters<typeof service.create>[0]` for create payloads, `axios.isAxiosError()` for narrowing caught errors instead of `err: any`.
- `react-refresh/only-export-components` (`AuthContext.tsx` exporting the `useAuth` hook alongside the `AuthProvider` component) — suppressed inline rather than splitting `useAuth` into its own file, since that would mean touching all 10 importers for a one-line hook.

**Backend:** root cause was `@Request() req: any` in every controller needing `req.user` (no typed augmentation existed for it), plus jest mocks typed `any`. Added `backend/src/auth/types/authenticated-request.ts` (`AuthenticatedRequest extends Request { user: User }`), used across `cargo-posts`, `vehicle-posts`, `companies`, `users`, `admin` controllers and `RolesGuard`. Typed jest mock repos precisely (e.g. `{ findOne: jest.Mock; save: jest.Mock; create: jest.Mock }` cast `as unknown as Repository<T>` at the constructor call) instead of `any` in all four `*.service.spec.ts` files. Smaller fixes: `openroute.service.ts`'s axios response now typed (`OrsDirectionsResponse` interface) instead of relying on implicit `any`; `auth.module.ts`'s `expiresIn` cast changed from `as any` to `as StringValue` (the real type `@nestjs/jwt` expects, from the `ms` package); error handling changed from `catch (err: any)` to `catch (err)` + `err instanceof Error ? err.message : String(err)` throughout. `test/app.e2e-spec.ts`'s `const request = require('supertest')` (the Session 18 fix for supertest's CJS/ESM interop mismatch) became `import request = require('supertest')` — same runtime behavior, but keeps supertest's real types instead of `any`; this tripped `@typescript-eslint/no-require-imports` in turn, so `eslint.config.mjs` now sets `allowAsImport: true` for that rule (the option that exists specifically for this pattern).

**Verified:** `npm run lint` exits 0 for both workspaces (13 pre-existing `no-unsafe-argument` warnings remain in backend spec files and are non-blocking — they're jest's own `{...} as any` DTO casts in test fixtures, not application code). `tsc -b` + `vite build` clean, `nest build` clean, all 31 backend unit tests and the e2e test pass unchanged.

#### Feature: Production TypeORM migrations

- `backend/src/entities.ts` — the entity list is now defined once and imported by both `app.module.ts` (runtime connection) and the new `backend/src/data-source.ts` (CLI-only `DataSource` export), so they can't drift apart.
- `backend/src/data-source.ts` — loads `.env` via `dotenv` (added as an explicit `backend/package.json` dependency rather than relying on it being hoisted transitively through `@nestjs/config`, given this project's documented history of workspace-hoisting bugs — see [Known Issues](../known-issues.md)).
- npm scripts (root and `backend/`): `migration:create`, `migration:generate`, `migration:run`, `migration:revert`, `migration:show`.
- `backend/src/migrations/<timestamp>-InitialSchema.ts` — the baseline migration. Generated by pointing `migration:generate` at a genuinely empty temporary database (not the dev DB, which already matches the entities via `synchronize` — that would produce an empty diff), then deleted. Verified correctness end-to-end rather than trusting the generated file blindly: applied it to a second temporary database, confirmed `migration:generate` against that database afterward reports "No changes in database schema were found," and confirmed `migration:revert` cleanly drops everything it created. Both temporary databases were dropped after verification.
- Bootstrapped the real local `cargo_app` dev database onto the migration system (standard practice when introducing migrations to a `synchronize`-built database): created the `migrations` tracking table and inserted a row marking `InitialSchema` as already applied, so `migration:run` against it correctly reports "No migrations are pending" instead of failing on `relation "cities" already exists`. Existing data (5 users, etc.) was untouched — confirmed by row count before/after.
- `synchronize` remains gated to non-production (Session 18) and `migrationsRun` was deliberately left unset — running migrations is an explicit `npm run migration:run` step (e.g. as part of a deploy script), not something that happens silently on every backend boot.

**Going forward:** schema changes are edit an entity → `npm run migration:generate -- src/migrations/DescriptiveName` → `npm run migration:run`. No more hand-written migration SQL needed for normal changes.
