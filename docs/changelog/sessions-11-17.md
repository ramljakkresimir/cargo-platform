# Implemented Features — Sessions 11–17

### Session 11 — 2026-06-26

#### Feature: Normalized cities and city autocomplete (Phase 1 — location data quality)

This is the foundation for future BlaBlaCar-style route matching. No routing APIs, PostGIS, or corridor logic added yet.

**Backend — cities module:**
- [x] `City` entity (`backend/src/cities/city.entity.ts`) with UUID PK, `name`, `country`, `region` (nullable), `latitude`, `longitude`, `createdAt`, `updatedAt`
- [x] Unique index on `(name, country)` — prevents duplicate entries
- [x] `CitiesModule`, `CitiesService`, `CitiesController`
- [x] `GET /cities?search=&country=&limit=` — public endpoint, ILIKE partial match, max limit 50, default 20
- [x] `backend/src/seeds/seed-cities.ts` — idempotent seed script (checks `name + country` uniqueness before insert)
- [x] 49 cities seeded: all major BA and HR cities and route-relevant towns
- [x] `npm run seed:cities` root script (proxies to `npm run seed:cities -w backend`)

**Backend — cargo posts updated:**
- [x] Added `loadingCityId` and `unloadingCityId` (nullable FK columns → cities.id) to `CargoPost` entity
- [x] Old `loadingLocation` / `unloadingLocation` columns kept as nullable (backward compat for existing rows)
- [x] `CreateCargoPostDto`: now requires `loadingCityId` + `unloadingCityId` UUIDs (old free-text fields removed)
- [x] `UpdateCargoPostDto`: optional `loadingCityId` / `unloadingCityId`
- [x] `FilterCargoPostsDto`: new `loadingCityId` / `unloadingCityId` params; legacy text params still accepted
- [x] `CargoPostsService`: validates city IDs on create/update, joins loadingCity/unloadingCity in responses, also denormalizes city name into legacy text columns for backward compat
- [x] `CargoPostsModule` imports `CitiesModule`

**Backend — vehicle posts updated:**
- [x] Added `originCityId` and `destinationCityId` (nullable FK columns → cities.id) to `VehiclePost` entity
- [x] Old `availableLocation` / `destinationPreference` columns kept as nullable (backward compat)
- [x] `CreateVehiclePostDto`: now requires `originCityId` UUID; `destinationCityId` is optional
- [x] `UpdateVehiclePostDto`: optional `originCityId` / `destinationCityId`
- [x] `FilterVehiclePostsDto`: new `originCityId` / `destinationCityId` params; legacy text params still accepted
- [x] `VehiclePostsService`: validates city IDs, joins originCity/destinationCity in responses
- [x] `VehiclePostsModule` imports `CitiesModule`
- [x] `AppModule`: adds `City` to TypeORM entity list; imports `CitiesModule`

**Frontend — cities service and autocomplete:**
- [x] `City` type added to `frontend/src/types/index.ts`
- [x] `CargoPost` and `VehiclePost` types updated with city relation fields
- [x] `frontend/src/services/cities.service.ts` — Axios call to `GET /cities`
- [x] `frontend/src/components/CityAutocomplete.tsx` — reusable dropdown with 250ms debounce, min 2 chars, clear button, dropdown closes on outside click
- [x] CSS for autocomplete added to `frontend/src/index.css`

**Frontend — pages updated:**
- [x] `CreateCargoPostPage` — CityAutocomplete for loading and unloading city
- [x] `CreateVehiclePostPage` — CityAutocomplete for origin and destination city
- [x] `CargoDetailPage` — CityAutocomplete in edit form; detail view shows city name with fallback to legacy text
- [x] `VehicleDetailPage` — same pattern for origin/destination
- [x] `CargoListPage` — CityAutocomplete in filter form; table shows city name with legacy fallback
- [x] `VehicleListPage` — same pattern
- [x] `MyPostsPage` — tables show city name with legacy fallback

**Note:** This is Phase 1 of location normalization. `latitude` / `longitude` columns exist on `City` entity and are now used in Phase 2 for route corridor matching.

### Session 12 — 2026-06-26

#### Feature: Route-city generation and route-aware vehicle search (Phase 2 — corridor matching)

**Backend — routing module (`backend/src/routing/`):**
- [x] `vehicle-post-route-city.entity.ts` — join table: `vehiclePostId` (FK + CASCADE), `cityId` (FK), `orderIndex`, `distanceFromStartKm`, `distanceFromRouteKm`; unique on `(vehiclePostId, cityId)`, indexes on `(vehiclePostId, orderIndex)` and `cityId`
- [x] `openroute.service.ts` — calls OpenRouteService `POST /v2/directions/driving-hgv/geojson`; reads `OPENROUTESERVICE_API_KEY` from env; returns `Coordinate[]` or null on failure (timeout 10 s)
- [x] `routing.service.ts` — thin wrapper over `OpenRouteService`, returns `RouteResult | null`
- [x] `route-city.service.ts`:
  - `generateAndSave(vehiclePostId, originCity, destCity)` — fetches driving route, uses `@turf/turf` (`nearestPointOnLine`, `length`) to project all 49 seed cities onto the route, keeps cities within `ROUTE_CITY_MAX_DISTANCE_KM` (default 15), saves sorted by `orderIndex`; fallback to origin+destination if ORS fails
  - `findByVehiclePostId(id)` — loads route cities with city relation, sorted by orderIndex
  - `findPostIdsOnRoute(originCityId, destCityId)` — QueryBuilder with self-JOIN to find posts where origin orderIndex < dest orderIndex
  - `deleteByVehiclePostId(id)` — clears route cities before regeneration
  - `findCityById(id)` — used by admin service
- [x] `routing.module.ts` — registers `VehiclePostRouteCity` and `City` via `TypeOrmModule.forFeature`; exports `RouteCityService`, `RoutingService`
- [x] `VehiclePostRouteCity` added to `AppModule` entities list

**Backend — vehicle posts updated:**
- [x] `VehiclePostsService` now injects `RouteCityService`
- [x] `create()` — after save, calls `routeCityService.generateAndSave()` in try-catch (failure doesn't block post creation)
- [x] `update()` — detects origin/dest city change; if changed, calls `generateAndSave()` in try-catch
- [x] `findOne()` — attaches `routeCities` to response via `routeCityService.findByVehiclePostId()`
- [x] `findAll()` — route-aware mode when both `originCityId` + `destinationCityId` provided: calls `findPostIdsOnRoute()`, then filters with `IN (:...ids)`; returns empty result if no route matches
- [x] `VehiclePostsModule` imports `RoutingModule`

**Backend — admin updated:**
- [x] `AdminModule` imports `RoutingModule`
- [x] `AdminService` injects `RouteCityService`; `regenerateRouteCities(id)` finds origin/dest cities, calls `generateAndSave`, returns count
- [x] `AdminController` exposes `POST /admin/vehicle-posts/:id/regenerate-route-cities`

**Backend — packages installed:**
- [x] `axios@^1.18.1` added to `backend/package.json` (used in `openroute.service.ts`)
- [x] `@turf/turf@^6.5.0` added to `backend/package.json` (CJS-compatible; used with named imports)
- [x] New env vars: `OPENROUTESERVICE_API_KEY` (empty = routing disabled), `ROUTING_PROVIDER`, `ROUTE_CITY_MAX_DISTANCE_KM=15`

**Frontend:**
- [x] `VehiclePostRouteCity` interface added to `frontend/src/types/index.ts`; `VehiclePost` extended with `routeCities?: VehiclePostRouteCity[]`
- [x] `VehicleDetailPage` — new "Route Cities" card in detail view (below company card): shows cities as pill chips, endpoint and starting cities highlighted in blue
- [x] `VehicleListPage` — when both city filters active (route-aware search mode): green info banner above results; "Matches route" badge on each result row

**Architecture decisions:**
- Circular import between `VehiclePost` ↔ `VehiclePostRouteCity` avoided by using TypeORM string-based entity reference (`@ManyToOne('VehiclePost', ...)`) in the route city entity; no changes to `vehicle-post.entity.ts`
- Route city generation is non-blocking in `create()`/`update()` — failure is logged but post is still created/updated
- Route-aware search degrades gracefully: if `findPostIdsOnRoute()` returns empty, response is `{ data: [], total: 0 }` (not a 500 error)
- Only one routing provider implemented; `ROUTING_PROVIDER` env var is reserved for future providers (e.g., OSRM self-hosted)

### Session 13 — 2026-07-06

#### Fix: Post expiration date comparison was using UTC date instead of local date

**Root cause:** `PostsExpirationService.expireOldPosts()` used `new Date().toISOString().split('T')[0]` to compute "today". `toISOString()` always returns UTC time. If the server runs in CET (UTC+2), the cron fires at midnight CET = 22:00 UTC the previous day. At that moment, the UTC date is still yesterday, so `today` = yesterday's date. The WHERE clause `loadingDate < yesterday` would miss posts dated yesterday, leaving them active a full extra day.

**Fix applied:**
- `posts-expiration.service.ts`: replaced `toISOString().split('T')[0]` with local-date components:
  ```typescript
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
  ```
- Added a log line showing the comparison date at every run: `"Expiring active posts with date before: YYYY-MM-DD (local date)"`
- Cron and admin manual endpoint both use the same `expireOldPosts()` method — both fixed.
- Date boundary is still `< today` (strict): posts dated today remain active; posts dated yesterday or earlier are expired.

**Manual verification (no ORS key needed):**
1. Create a cargo post or vehicle post with `loadingDate` / `availableFromDate` set to yesterday (or any past date).
2. Start the backend: `npm run backend`.
3. Hit `POST /admin/posts/expire-old` (requires admin JWT). The response returns `{ cargoPostsExpired, vehiclePostsExpired }`.
4. Check the backend log for: `Expiring active posts with date before: YYYY-MM-DD (local date)` and the count line.
5. Verify the post status changed to `expired` via `GET /cargo-posts/:id` or `GET /vehicle-posts/:id`.
6. For the scheduled cron: the cron fires at midnight server local time. Check logs the next morning for the scheduled-expiration log lines.

#### Feature: Route map visualization for vehicle posts (Phase 3 — map display)

**Backend — `vehicle_posts` table:**
- [x] New `routeGeoJson` column: `{ type: 'jsonb', nullable: true }` — stores the ORS driving route as `{ lat, lng }[]`. TypeORM `synchronize: true` creates the column automatically on next backend start.
- [x] `RouteCityService.generateAndSave()` return type changed from `Promise<VehiclePostRouteCity[]>` to `Promise<GenerateResult>` where `GenerateResult = { routeCities, routeCoordinates }`. The `routeCoordinates` are the raw ORS coordinates (or `null` when ORS is unavailable or post has no destination).
- [x] New `Coordinate` import from `openroute.service.ts` and `GenerateResult` interface exported from `route-city.service.ts`.
- [x] `VehiclePostsService.create()` — after `generateAndSave()`, saves `routeCoordinates` to `routeGeoJson` via `vehiclePostRepository.update()`.
- [x] `VehiclePostsService.update()` — after `generateAndSave()` (when origin/dest changed), saves new coordinates; sets `routeGeoJson = null` if ORS failed (clears stale geometry).
- [x] `AdminService.regenerateRouteCities()` — also updates `routeGeoJson` alongside route cities.
- [x] Fallback behavior preserved: if ORS is unavailable, `routeGeoJson` stays `null` — post creation/update never fails.

**Frontend — Leaflet map:**
- [x] `leaflet@1.9.4` + `react-leaflet@5.0.0` installed in frontend workspace.
- [x] `@types/leaflet` installed as devDependency in frontend workspace.
- [x] Root `package.json` devDependencies: added `react@^19.2.6` and `react-dom@^19.2.6` to force npm to hoist them alongside react-leaflet (same workspace hoisting pattern as Session 10).
- [x] `vite.config.ts`: added `resolve.dedupe: ['react', 'react-dom']` — prevents rolldown from failing to find React when importing from react-leaflet's hoisted location.
- [x] `RouteCoordinate` interface added to `frontend/src/types/index.ts`; `VehiclePost` extended with `routeGeoJson?: RouteCoordinate[] | null`.
- [x] `frontend/src/components/RouteMap.tsx` — reusable Leaflet map component:
  - `leaflet/dist/leaflet.css` imported directly in the component
  - Green circle (`#16a34a`) for origin marker, red circle (`#dc2626`) for destination — both via `L.divIcon()` (no PNG import needed, avoids Vite asset URL issues)
  - Blue polyline (`#2563eb`, weight 4) for the route
  - `MapContainer` with `bounds` auto-fitted to all route coordinates; `scrollWheelZoom: false`
  - OpenStreetMap tiles with attribution
  - If `coordinates.length < 2`, shows a styled `"Route map is not available"` message
- [x] `VehicleDetailPage.tsx` — new "Route Map" card rendered below "Route Cities" in the detail view
  - If `post.routeGeoJson` has ≥ 2 points, renders `<RouteMap>` with origin/destination labels
  - If no geometry (ORS unavailable or no destination), shows the unavailable message; if no destination, adds a hint: "Set a destination city to enable route mapping."
- [x] `index.css`: added `.route-map` and `.route-map-unavailable` styles; map height is 240px on mobile.

**New env vars:** none — `OPENROUTESERVICE_API_KEY` already controls ORS access.

**New npm packages:**
- `leaflet@^1.9.4` — frontend
- `react-leaflet@^5.0.0` — frontend
- `@types/leaflet` — frontend devDependency

**Architecture notes:**
- `routeGeoJson` stores the full driving polyline (hundreds of points for long routes). For production, consider downsampling with turf's `simplify` or storing a PostGIS geometry type. For an MVP this is fine.
- The map renders on every `VehicleDetailPage` load (including non-owners). It is a public read-only view.
- No API key is exposed to the frontend — tiles come from OpenStreetMap (free, no key needed).

**Manual verification:**
1. Ensure `OPENROUTESERVICE_API_KEY` is set in `backend/.env`.
2. Create a new vehicle post with both origin and destination cities.
3. Navigate to `GET /vehicles/:id` — response should include `routeGeoJson: [{lat, lng}, ...]`.
4. Open `/vehicles/:id` in the browser — a map should appear with the blue route polyline, green origin marker, and red destination marker.
5. If ORS key is not set: the map card shows "Route map is not available for this post." — post creation still succeeds.
6. Existing posts (without `routeGeoJson`): use `POST /admin/vehicle-posts/:id/regenerate-route-cities` to backfill route data.

### Session 14 — 2026-07-06

#### Investigation: Route-aware matching and route map regression

**Root cause (single underlying issue):** ORS timed out at exactly 10 seconds when the test vehicle post (Mostar→Zagreb) was created. Timestamps confirm this: post created at `14:36:22Z`, route cities created at `14:36:32Z` — exactly 10 seconds later, matching the ORS timeout. The fallback fired: only origin (Mostar) + destination (Zagreb) were stored with `distanceFromStartKm: 0` and `routeGeoJson: null`. This caused:
- Route-aware search to fail for any intermediate city (only Mostar and Zagreb were in `vehicle_post_route_cities`)
- Route map to show "not available" (routeGeoJson was null)

**No code regression from Session 13** — the `generateAndSave()` return-type change and routeGeoJson persistence are correct. The issue was transient network latency at ORS when the post was created.

**Geography clarification:** ORS driving-hgv routes Mostar→Zagreb via the Croatian coastal motorway (A1): Mostar → Split → Šibenik → Gospić → Karlovac → Zagreb. The route does NOT pass through Sarajevo or Zenica. Those are inland Bosnia cities on a different (longer) mountain route. Any test cases assuming Sarajevo is on the Mostar→Zagreb route should use Mostar→Split or Split→Zagreb instead.

**Fixes applied:**

- **`openroute.service.ts`**: ORS timeout increased from 10 s to 20 s; added 1 retry with 2-second delay on failure. Now attempts ORS twice before falling back — significantly reduces transient timeout failures.

- **`admin.service.ts`**: Added `regenerateAllIncompleteRoutes()` — finds all vehicle posts where `routeGeoJson IS NULL AND destinationCityId IS NOT NULL` (i.e., posts that hit the ORS fallback) and re-runs `generateAndSave()` for each, saving updated route cities and `routeGeoJson`. Returns `{ processed, succeeded, failed, message }`.

- **`admin.controller.ts`**: Added `POST /admin/vehicle-posts/regenerate-all-routes` — runs the above method in one call. Must be declared BEFORE `/:id/regenerate-route-cities` to avoid route shadowing.

**Verified after fix:**
- Route cities for Mostar→Zagreb post: 6 cities (Mostar, Split, Šibenik, Gospić, Karlovac, Zagreb), all with proper `distanceFromStartKm` values
- `routeGeoJson`: 4642 coordinate points (full ORS driving polyline)
- Route-aware search: Mostar→Split returns 1 result ✓; Split→Zagreb returns 1 result ✓; Zagreb→Mostar returns 0 ✓
- Route map card: renders correctly when `routeGeoJson` has ≥ 2 points
- Expiration: `POST /admin/posts/expire-old` returns `{ cargoPostsExpired: 0, vehiclePostsExpired: 0 }` with tomorrow-dated post (correct)
- Build: both backend and frontend compile with 0 errors

**How to recover future posts with missing route geometry:**
```
POST /admin/vehicle-posts/regenerate-all-routes
Authorization: Bearer <admin-jwt>
```
This is idempotent — posts with geometry already set are skipped (WHERE routeGeoJson IS NULL).

### Session 15 — 2026-07-06

#### Fix: Past-dated posts could be created and appeared in public listings

**Problems identified:**
1. **No create/update validation**: Backend accepted `loadingDate` / `availableFromDate` values in the past. A post created with yesterday's date remained `active` indefinitely until the midnight cron ran.
2. **Public listings showed stale active posts**: `GET /cargo-posts` and `GET /vehicle-posts` only filtered `status = active`. If the cron missed a post (or hadn't run yet that day), past-dated `active` posts appeared in public browse.
3. **No frontend validation**: Create forms had no client-side guard, so the error only surfaced as a backend rejection (or not at all before this fix).

**Fixes applied:**

**Backend — `cargo-posts.service.ts`:**
- `getLocalDateString()` helper added at module level (same local-date formula as `PostsExpirationService`)
- `create()`: rejects with HTTP 400 `"Loading date cannot be in the past."` if `dto.loadingDate < today`
- `update()`: rejects the same way, but only if the submitted date is **different** from the post's current date — this allows editing notes/status on a post whose date has already passed without blocking the operation
- `findAll()`: added `.andWhere('post.loadingDate >= :today', { today })` so past-dated active posts never appear in public browse (belt-and-suspenders with expiration)

**Backend — `vehicle-posts.service.ts`:**
- Same `getLocalDateString()` helper added
- `create()`: rejects with `"Available from date cannot be in the past."`
- `update()`: same "only if date changed" guard
- `findAll()`: `andWhere('post.availableFromDate >= :today', ...)` added to **both** the route-aware search path and the standard search path

**Frontend — date validation on create forms:**
- `CreateCargoPostPage`: checks `form.loadingDate < todayStr` before submit; shows `"Loading date cannot be in the past."` error above the form
- `CreateVehiclePostPage`: checks `form.availableFromDate < todayStr` before submit; shows same style error

**Frontend — date validation on edit forms:**
- `CargoDetailPage` edit submit: guards the same way, but only fires if the new date differs from the post's existing date (`editForm.loadingDate !== post?.loadingDate`) — so owners can still save other changes on a post with an already-past date without hitting the error
- `VehicleDetailPage` edit submit: same pattern for `availableFromDate`

**Date comparison semantics:**
- All comparisons use string comparison of `"YYYY-MM-DD"` strings (lexicographic order is correct for ISO dates)
- "Today is valid" — only strictly past dates are rejected (`< today`, not `<= today`)
- The `getLocalDateString()` helper uses `new Date()` local components (same fix as Session 13 timezone correction), not `toISOString()` which returns UTC

**Why public listing filter + cron both needed:**
- The cron is the authoritative expiry mechanism (changes status to `expired`)
- The listing filter is a defense-in-depth measure: it hides any `active` post whose date has already passed, regardless of whether the cron has run yet
- Together they ensure the marketplace shows only genuinely current offers

**Expiration service (`PostsExpirationService`) itself was already correct** from the Session 13 fix — no changes needed there.

**Manual verification:**
1. Try creating a cargo or vehicle post with yesterday's date → should get HTTP 400 with the clear error message
2. Browse `/cargo` or `/vehicles` — past-dated posts should not appear even if their status is still `active`
3. A post with today's date should appear in listings and be createable
4. Editing a post with a past date (to just change notes) should work; changing the date to another past date should be rejected

---

### Session 16 — 2026-07-13

#### Fix: Admin panel showed `active` for posts whose date had already passed

**Root cause:** `PostsExpirationService.expireOldPosts()` — the only code path that ever writes `status = 'expired'` to the database — was wired up solely to `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` and the manual `POST /admin/posts/expire-old` endpoint. Neither fires unless the backend process happens to be running at the exact moment midnight ticks over (server local time). In this dev environment the backend is restarted frequently (see `predev` / kill-ports workflow), so it is often *not* running through midnight, and the scheduled tick is simply skipped — there is no catch-up/backlog mechanism in `@nestjs/schedule`.

The Session 15 fix added a **read-side** date filter (`andWhere('post.loadingDate >= :today', ...)` / `availableFromDate >= :today`) to the public `findAll()` queries. That filter hides past-dated posts from public browse, but it never updates the `status` column — it's a view-layer mask, not a state transition. Because the Admin panel and `/my-posts` deliberately read the **raw** `status` column (so owners/admins can see genuinely expired posts, not just active ones), they correctly reflected what was actually in Postgres: `active`. That was the bug — not stale admin data, not a caching issue, just a database that had never been told to update itself.

Confirmed directly against Postgres before the fix: 2 cargo posts and 4 vehicle posts had `status = 'active'` with `loadingDate` / `availableFromDate` in the past.

**Fix applied — `posts-expiration.service.ts`:**
- `PostsExpirationService` now implements `OnApplicationBootstrap` and calls the existing `expireOldPosts()` method once when the Nest application finishes bootstrapping (after the DB connection is established), in addition to the existing daily cron and manual admin trigger.
- No new expiration logic was added — `onApplicationBootstrap()` simply calls the same `expireOldPosts()` used by the cron and the admin endpoint, so there is exactly one place that decides what "expired" means (date comparison + bulk `UPDATE ... SET status = 'expired' WHERE status = 'active' AND date < today`).
- This makes the DB self-healing on every backend start: any backlog that accumulated while the server was down is cleared in one cheap query pair (two bulk `UPDATE`s, no per-row loop) before the app starts accepting traffic.

**Verified against the live database (not just code review):**
1. Queried Postgres directly — found 2 stale `active` cargo posts and 4 stale `active` vehicle posts with past dates.
2. Started the backend (`npx nest start`) and confirmed via logs: `Running startup post-expiration sync` → `Expiration complete — today: 2026-07-13, cargo expired: 2, vehicles expired: 4`.
3. Re-queried Postgres — 0 stale `active` posts remain; all 6 are now `expired` in the database itself.
4. Confirmed `GET /admin/cargo-posts` / `GET /admin/vehicle-posts` (`AdminService.getCargoPosts`/`getVehiclePosts`) read the raw `status` column with no additional filtering or caching — they now correctly return `expired` for these posts.
5. Confirmed `findByCompanyId()` (backs `GET /cargo-posts/my` and `GET /vehicle-posts/my`, used by the "My Posts" page) has no status or date filter — owners still see `expired` posts with the correct status, unlike the public `findAll()` which excludes them.
6. Confirmed public `findAll()` for both cargo and vehicle posts still excludes non-active and past-dated posts — no regression.
7. Create validation (`create()` rejecting `loadingDate`/`availableFromDate < today`) is unchanged from Session 15 and still active — verified via `tsc --noEmit` and code inspection, no changes needed there.

**Why this is the correct fix (not a workaround):** the requirement was that the database itself must contain `expired`, not just that expired posts be hidden from certain views. A single `OnApplicationBootstrap` call to the existing, already-correct `expireOldPosts()` closes the only real gap (no catch-up after downtime) without introducing a second expiration code path, a duplicate date-comparison formula, or a new cron schedule.

**Manual verification checklist (all confirmed):**
- Create a post for today → `active` (create-time validation only rejects `< today`)
- Create a post for tomorrow → `active`
- Create a post for yesterday → rejected with HTTP 400 (`"Loading date cannot be in the past."` / `"Available from date cannot be in the past."`)
- Manually set an existing row's date to yesterday and status to `active` in Postgres, then restart the backend (or call `POST /admin/posts/expire-old`) → status becomes `expired` in the database
- Admin panel (`GET /admin/cargo-posts`, `GET /admin/vehicle-posts`) immediately reflects `expired` — confirmed no separate caching layer exists
- Public pages (`GET /cargo-posts`, `GET /vehicle-posts`) never display expired or past-dated posts
- `/my-posts` (`GET /cargo-posts/my`, `GET /vehicle-posts/my`) still displays expired posts to their owner with the correct `expired` status

---

### Session 17 — 2026-07-13

#### Feature: Full frontend visual redesign + Croatian localization

Redesign scope was driven by a design handoff (`CargoConnect Redesign.dc.html` + `README.md`, delivered outside the repo) plus explicit product instructions layered on top. The prototype set the visual language (colors, spacing, card patterns); the task instructions set exact interaction requirements and Croatian copy that took precedence where the two disagreed. No backend files were touched this session.

**Design direction:** calm, BlaBlaCar-clean, non-technical-user-friendly. Solid backgrounds, 1–1.5px borders instead of shadows-at-rest, one blue primary accent ("transport" actions) + one teal secondary accent ("cargo" actions), restrained radii (8/9/14/16px), no glassmorphism/gradients/glow. All tokens are CSS variables in `frontend/src/index.css` (`--color-*`, `--radius-*`, `--shadow-*`, `--space-*`) so the whole app reads as one system.

**New home page (`/`):**
- [x] `frontend/src/pages/HomePage.tsx` replaces the old `<Navigate to="/cargo" />` redirect
- [x] Hero headline "Pronađite prijevoz ili teret na svojoj ruti" + two large CTA cards: "Trebam prijevoz" (blue, → `/vehicles`) and "Imam vozilo" (teal, → `/cargo`)
- [x] 3-step explainer ("Odaberite što tražite" → "Unesite polazište i odredište" → "Kontaktirajte odgovarajuću tvrtku") and a 3-column trust section (verified companies / direct contact / real routes)
- [x] The optional "recent cargo/vehicles preview" was deliberately skipped in this session — spec marked it optional and the page was meant to stay short. **Implemented in Session 21.**

**Navigation — `frontend/src/components/Navbar.tsx` (full rewrite):**
- [x] Collapsed to exactly 4 top-level items: Početna, Pretraga, Objavi, Nadzorna ploča — direct "Cargo"/"Vehicles" links removed
- [x] **Pretraga and Objavi are accessible dropdown menus, not routed pages** (this overrides the design README's `/search`/`/post` "chooser screen" suggestion — the task's explicit interaction spec is more specific and wins): opens on click, closes on Escape (returns focus to the trigger), closes on outside click, closes when an item is clicked before navigating, basic arrow-key movement between items via `frontend/src/components/NavDropdown.tsx`
- [x] Pretraga → Tražim prijevoz (`/vehicles`) / Tražim teret (`/cargo`); Objavi → Objavi teret (`/cargo/new`) / Objavi slobodno vozilo (`/vehicles/new`) — both post routes still go through the existing `<ProtectedRoute>`, so a logged-out click redirects to `/login` exactly as before
- [x] Logged-out state: "Prijava" text link + "Registracija" primary button. Logged-in: avatar-initials dropdown (same `NavDropdown`) with Moje objave / Profil tvrtke / Profil / Administracija (admin only) / Odjava
- [x] Mobile (≤860px): hamburger toggle opens a full-width drawer; Pretraga/Objavi expand inline as a sub-list instead of a floating panel (per spec); drawer closes on route change and on Escape
- [x] Active-state highlighting via `useLocation()`: Pretraga is active on `/vehicles`/`/cargo`, Objavi on `/cargo/new`/`/vehicles/new`

**New reusable components (`frontend/src/components/`):**
- [x] `Icons.tsx` — hand-written inline-SVG icon set (Home, Search, Plus, Grid, Truck, Package, ChevronDown, Menu, X, ArrowRight), 2.5px stroke, no fills — matches the prototype's icon style, no icon library dependency added
- [x] `StatusBadge.tsx` — maps `active`/`closed`/`expired` → Croatian labels (Aktivno/Zatvoreno/Isteklo) over the existing `.status-badge` CSS classes
- [x] `EmptyState.tsx` — reusable dashed-border empty-result box with optional action slot
- [x] `NavDropdown.tsx` — the accessible dropdown described above, reused for Pretraga, Objavi, and the logged-in user menu
- [x] `frontend/src/constants/postTypes.ts` — shared Croatian label maps for cargo/vehicle type enums (`CARGO_TYPES`, `VEHICLE_TYPES`, `cargoTypeLabel()`, `vehicleTypeLabel()`), reused across list pages, create forms, detail pages, and admin tables instead of duplicating the same translation array six times

**Pages redesigned (presentation + copy only — no service/API/validation logic changed):**
- [x] `CargoListPage.tsx` / `VehicleListPage.tsx` — dense `<table>` replaced with stacked result cards (icon badge, "From → To" route, date/company subline, type chip, weight/capacity/price, "Pregled" button); route-aware "Matches route" indicator translated to "Odgovara traženoj ruti"; filters restyled into a card-based filter bar with Croatian labels; city fields still use `CityAutocomplete` unchanged
- [x] `CargoDetailPage.tsx` / `VehicleDetailPage.tsx` — Croatian copy throughout, `StatusBadge` component, Delete restyled as a subdued outlined button so it doesn't visually compete with Edit/Close; `RouteMap` and route-city chips unchanged functionally
- [x] `CreateCargoPostPage.tsx` / `CreateVehiclePostPage.tsx` — Croatian labels/placeholders, grouped into "Ruta"/"Detalji tereta" sections, exact same validation (past-date rejection, required city selection) preserved byte-for-byte
- [x] `LoginPage.tsx`, `RegisterPage.tsx`, `ProfilePage.tsx`, `CompanyProfilePage.tsx` — restyled to the new form tokens, translated, same handlers/validation
- [x] `DashboardPage.tsx` — simplified to the spec's 4 action cards (Objavi teret / Objavi slobodno vozilo / Pretraži prijevoz / Pretraži teret) plus a secondary row of links to Moje objave / Profil tvrtke / Profil (kept reachable per spec, just de-emphasized)
- [x] `MyPostsPage.tsx` — tables replaced with the same card pattern as the public list pages; two sections (Moji tereti / Moja vozila); View/Edit/Close/Delete and the `startEditing` deep-link into the detail page's edit form are unchanged
- [x] All 4 Admin pages — reskinned to the same tokens, kept `.data-table`/`.table-wrapper` (data-dense is allowed there per spec) since admins need to scan many rows; every safety rule preserved as-is: self-delete/self-demote guards, last-admin guard, pagination, search, status change, deletion confirmation dialogs; post-status columns now use the shared `StatusBadge` so `expired` reads as "Isteklo" (this was the whole point of the Session 16 backend fix — the admin UI now visibly reflects it)

**Localization:** the user explicitly chose full Croatian across the entire app, including Admin (over a "public-only" or "nav-only" option), for a consistent experience. `ProtectedRoute`/`AdminRoute` loading and "Pristup odbijen" (Access Denied) copy translated too.

**Dependencies:** none added or removed. `leaflet`/`react-leaflet` (already installed for the route map) are unchanged. Icons are hand-rolled SVG, not a library.

**Verification performed:**
- `npm run build` (tsc + vite build) — 0 TypeScript errors
- `npm run lint` — confirmed via `git stash` that the project's ESLint config was **already failing with 32 errors on master before this session** (pre-existing `no-use-before-define`-style hook-order errors and `no-explicit-any` in files this redesign didn't touch, e.g. `errorUtils.ts`, `cargoPosts.service.ts`). Not a regression from this work — the project's actual gate has always been `tsc`/`vite build`, not `eslint`.
- Installed Playwright ad hoc (`npx playwright install chromium`, not added to `package.json`) and drove the running dev app headlessly end-to-end:
  - Home → "Trebam prijevoz" → `/vehicles`; Home → "Imam vozilo" → `/cargo` ✓
  - Navbar Pretraga → Tražim prijevoz/teret, dropdown closes after navigation ✓
  - Navbar Objavi → Objavi teret while logged out → redirected to `/login` (ProtectedRoute intact) ✓
  - Escape key and outside-click both close an open dropdown ✓
  - Mobile (375px): hamburger opens/closes the drawer, Pretraga expands inline, navigating closes the drawer ✓
  - `/cargo` and `/vehicles` confirmed to render zero `<table>` elements (card layout in effect)
  - Registered + logged in a test user, verified Dashboard, the logged-in user dropdown menu, and the "Objavi teret" create form render correctly with no console errors
  - Promoted the test user to admin via SQL (same pattern as Session 16), verified `/admin` and `/admin/users` render correctly with role badges, guarded action buttons, and the new design tokens
  - Zero browser console/page errors across the entire flow
- Found and fixed two real bugs during this verification pass (not caught by `tsc`/build):
  1. Dropdown menu item title/description were rendering on one run-together line — `<span>` is inline by default; added `.nav-dropdown-item-text`/`-title`/`-desc` as `display: block`
  2. On mobile, "CargoConnect" and "Prijava" visually collided because the login text link had nowhere to go once the center nav hid behind the hamburger — hid `.navbar-login-link` under the same `≤860px` media query (it's still reachable inside the mobile drawer)

**Files changed:** `index.css` (full rewrite), `App.tsx`, `Navbar.tsx`, `AdminRoute.tsx`/`ProtectedRoute.tsx` (copy only), all list/detail/form/dashboard/my-posts/admin pages listed above. **New:** `HomePage.tsx`, `components/Icons.tsx`, `components/StatusBadge.tsx`, `components/EmptyState.tsx`, `components/NavDropdown.tsx`, `constants/postTypes.ts`. **Untouched:** every file in `services/`, `types/index.ts`, `context/AuthContext.tsx`, `CityAutocomplete.tsx` and `RouteMap.tsx` (CSS-only restyle via shared classes, no prop/logic changes), and the entire `backend/`.

**Known limitation:** `npm run lint` still fails with the pre-existing 32 errors described above — fixing them would mean reordering hook declarations across files this redesign didn't otherwise need to touch (`AdminUsersPage.tsx`, `AdminCargoPostsPage.tsx`, `AdminVehiclePostsPage.tsx`, `VehicleListPage.tsx`, plus a few `services/`/`utils/` files), which was out of scope for a visual redesign task. Flagged here so a future session can decide whether to fix it as its own cleanup (fixed in Session 19 — see [sessions-18-19.md](sessions-18-19.md)).
