# CargoConnect BiH — Development Journal

## Product Philosophy

CargoConnect is a connection platform, not a transport management system.

Every new feature must help users find transport or cargo faster, easier, or with more trust.

Simplicity is preferred over enterprise complexity.

The primary target users are small transport companies and owner-drivers in Bosnia and Herzegovina and Croatia.

Features that increase marketplace liquidity — better matching, easier search, notifications, and trust — take priority over infrastructure improvements unless they block production.

---

## Project Overview

A full-stack logistics marketplace for the Bosnia and Herzegovina market.  
Connects companies that need cargo transported with transport companies and drivers that have available vehicle capacity.  
Inspired by TIMOCOM but scoped as a focused MVP for the local market.

---

## Technology Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 19 + TypeScript + Vite        |
| Backend      | NestJS 11 + TypeScript              |
| Database     | PostgreSQL (via TypeORM 1.0)        |
| Auth         | JWT (HS256 via @nestjs/jwt)         |
| HTTP client  | Axios                               |
| Routing      | React Router v7                     |
| DB GUI       | pgAdmin                             |
| Monorepo     | npm workspaces + concurrently       |

---

## Architecture

```
cargo-platform/
├── backend/                  NestJS API (port 3000)
│   └── src/
│       ├── auth/             Register, login, JWT strategy, guard
│       │   ├── decorators/   @Roles() decorator
│       │   └── guards/       JwtAuthGuard, RolesGuard
│       ├── users/            User entity + service
│       ├── companies/        Company profile CRUD
│       ├── cargo-posts/      Cargo post CRUD + search
│       ├── vehicle-posts/    Vehicle post CRUD + search
│       ├── admin/            Admin CRUD for users/posts (role-protected)
│       │   └── dto/          AdminUsersQueryDto, AdminPostsQueryDto, UpdateUserRoleDto, UpdatePostStatusDto
│       ├── cities/           City entity, CitiesService, CitiesController (GET /cities)
│       │   └── dto/          FilterCitiesDto
│       ├── routing/          Route-city generation module
│       │   ├── vehicle-post-route-city.entity.ts   Join table: which cities a vehicle route passes through
│       │   ├── openroute.service.ts                OpenRouteService API client (driving-hgv)
│       │   ├── routing.service.ts                  Abstraction over routing providers
│       │   ├── route-city.service.ts               Projection + persistence + route-aware search helper
│       │   └── routing.module.ts                   Exports RouteCityService, RoutingService
│       ├── posts-expiration/ PostsExpirationService — daily cron + manual trigger
│       ├── common/
│       │   ├── enums/        Shared PostStatus enum
│       │   ├── dto/          Shared PaginationDto
│       │   └── filters/      GlobalExceptionFilter (consistent error shapes)
│       ├── app.module.ts     Root module wiring (includes ScheduleModule.forRoot())
│       └── main.ts           Bootstrap, CORS, ValidationPipe with exceptionFactory
│
└── frontend/                 Vite + React app (port 5173)
    └── src/
        ├── context/          AuthContext (JWT + user state)
        ├── services/         Axios API clients per resource (+ admin.service)
        ├── components/       Navbar (+ NavDropdown), ProtectedRoute, AdminRoute, CityAutocomplete, Icons, StatusBadge, EmptyState, RouteMap
        ├── constants/        postTypes.ts — shared Croatian cargo/vehicle type label maps
        ├── pages/            HomePage + 12 regular pages + 4 admin pages
        │   └── admin/        AdminDashboardPage, AdminUsersPage, AdminCargoPostsPage, AdminVehiclePostsPage
        ├── services/         Axios API clients (+ cities.service.ts added)
        ├── utils/            errorUtils.ts — extractErrorMessage / extractFieldErrors helpers
        └── types/            Shared TypeScript interfaces (City added, CargoPost/VehiclePost updated)
```

---

## Database Schema

TypeORM `synchronize: true` auto-creates/updates all tables in development.  
**Switch to migrations before any production deployment.**

### users
| Column       | Type      | Notes                      |
|--------------|-----------|----------------------------|
| id           | uuid (PK) | auto-generated             |
| email        | varchar   | unique                     |
| passwordHash | varchar   | bcrypt, never returned     |
| firstName    | varchar   |                            |
| lastName     | varchar   |                            |
| phone        | varchar   | nullable                   |
| role         | varchar   | default: 'user'            |
| createdAt    | timestamp |                            |
| updatedAt    | timestamp |                            |

### companies
| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | uuid (PK) |                                |
| userId      | uuid (FK) | → users.id, unique             |
| companyName | varchar   |                                |
| companyType | varchar   | transport / freight_forwarder / manufacturer / trader / other |
| country     | varchar   |                                |
| city        | varchar   |                                |
| address     | varchar   | nullable                       |
| taxNumber   | varchar   | nullable (ID broj)             |
| phone       | varchar   | nullable                       |
| email       | varchar   | nullable                       |
| description | text      | nullable                       |
| createdAt   | timestamp |                                |
| updatedAt   | timestamp |                                |

### cities
| Column    | Type      | Notes                                   |
|-----------|-----------|-----------------------------------------|
| id        | uuid (PK) | auto-generated                          |
| name      | varchar   |                                         |
| country   | varchar   | `BA`, `HR`, etc.                        |
| region    | varchar   | nullable                                |
| latitude  | float     |                                         |
| longitude | float     |                                         |
| createdAt | timestamp |                                         |
| updatedAt | timestamp |                                         |

Unique constraint on `(name, country)`. Seeded via `npm run seed:cities`.

### cargo_posts
| Column              | Type      | Notes                                  |
|---------------------|-----------|----------------------------------------|
| id                  | uuid (PK) |                                        |
| companyId           | uuid (FK) | → companies.id                         |
| loadingCityId       | uuid (FK) | → cities.id, nullable                  |
| unloadingCityId     | uuid (FK) | → cities.id, nullable                  |
| loadingLocation     | varchar   | nullable — legacy/denormalized copy    |
| unloadingLocation   | varchar   | nullable — legacy/denormalized copy    |
| loadingDate         | date      |                                        |
| cargoType           | varchar   | nullable                               |
| weight              | float     | nullable, in tonnes                    |
| dimensions          | varchar   | nullable (e.g. "3x2x2m")              |
| requiredVehicleType | varchar   | nullable                               |
| price               | float     | nullable, in EUR                       |
| note                | text      | nullable                               |
| status              | varchar   | active / closed / expired              |
| createdAt           | timestamp |                                        |
| updatedAt           | timestamp |                                        |

### vehicle_posts
| Column                | Type      | Notes                                  |
|-----------------------|-----------|----------------------------------------|
| id                    | uuid (PK) |                                        |
| companyId             | uuid (FK) | → companies.id                         |
| originCityId          | uuid (FK) | → cities.id, nullable                  |
| destinationCityId     | uuid (FK) | → cities.id, nullable                  |
| availableLocation     | varchar   | nullable — legacy/denormalized copy    |
| destinationPreference | varchar   | nullable — legacy/denormalized copy    |
| availableFromDate     | date      |                                        |
| vehicleType           | varchar   | truck / van / semi_truck / etc.        |
| capacity              | float     | nullable, in tonnes                    |
| note                  | text      | nullable                               |
| status                | varchar   | active / closed / expired              |
| routeGeoJson          | jsonb     | nullable — `[{lat,lng}]` driving route from ORS |
| createdAt             | timestamp |                                        |
| updatedAt             | timestamp |                                        |

### vehicle_post_route_cities
| Column                | Type      | Notes                                       |
|-----------------------|-----------|---------------------------------------------|
| id                    | uuid (PK) |                                             |
| vehiclePostId         | uuid (FK) | → vehicle_posts.id, ON DELETE CASCADE       |
| cityId                | uuid (FK) | → cities.id                                 |
| orderIndex            | int       | position along the route (0 = first city)   |
| distanceFromStartKm   | float     | km along route from origin to this city     |
| distanceFromRouteKm   | float     | perpendicular distance from city to route   |
| createdAt             | timestamp |                                             |
| updatedAt             | timestamp |                                             |

Unique constraint on `(vehiclePostId, cityId)`. Indexes on `(vehiclePostId, orderIndex)` and `cityId`.  
Populated automatically when a vehicle post is created or updated (if origin/dest changed).  
Generated via OpenRouteService driving-hgv route + @turf/turf nearest-point projection.  
Fallback (when ORS API unavailable): only origin + destination are saved.

---

## API Endpoints

All endpoints return JSON. Protected endpoints require:  
`Authorization: Bearer <jwt_token>`

### Cities (public)
| Method | Path     | Description                                  |
|--------|----------|----------------------------------------------|
| GET    | /cities  | Search cities — params: `search`, `country`, `limit` (max 50, default 20) |

Response: JSON array of `{ id, name, country, region, latitude, longitude }`.  
Seed: `npm run seed:cities` — idempotent, uses name + country uniqueness. Seeded with 49 cities (BA + HR).

### Auth (public)
| Method | Path             | Description          |
|--------|------------------|----------------------|
| POST   | /auth/register   | Create account       |
| POST   | /auth/login      | Login, get JWT token |

### Companies (protected)
| Method | Path           | Description                  |
|--------|----------------|------------------------------|
| GET    | /companies/me  | Get my company profile       |
| POST   | /companies     | Create company profile       |
| PATCH  | /companies/me  | Update company profile       |

### Cargo Posts
| Method | Path             | Auth?    | Description            |
|--------|------------------|----------|------------------------|
| GET    | /cargo-posts     | No       | List + filter posts    |
| GET    | /cargo-posts/my  | Required | My company's posts     |
| GET    | /cargo-posts/:id | No       | Get single post        |
| POST   | /cargo-posts     | Required | Create post            |
| PATCH  | /cargo-posts/:id | Required | Update (owner only)    |
| DELETE | /cargo-posts/:id | Required | Delete (owner only)    |

**Cargo filter query params:** `loadingCityId`, `unloadingCityId` (preferred), or legacy text `loadingLocation`, `unloadingLocation`; also `loadingDate`, `cargoType`, `requiredVehicleType`  
**Create/Update body:** `loadingCityId` (uuid, required on create), `unloadingCityId` (uuid, required on create), plus optional fields  
**Pagination params:** `page` (default: 1), `limit` (default: 10) — response shape: `{ data, total, page, limit, totalPages }`  
**Note:** `/my` route must remain before `/:id` in the controller to avoid route conflict.

### Vehicle Posts
| Method | Path                | Auth?    | Description            |
|--------|---------------------|----------|------------------------|
| GET    | /vehicle-posts      | No       | List + filter posts    |
| GET    | /vehicle-posts/my   | Required | My company's posts     |
| GET    | /vehicle-posts/:id  | No       | Get single post        |
| POST   | /vehicle-posts      | Required | Create post            |
| PATCH  | /vehicle-posts/:id  | Required | Update (owner only)    |
| DELETE | /vehicle-posts/:id  | Required | Delete (owner only)    |

**Vehicle filter query params:** `originCityId`, `destinationCityId` (preferred), or legacy text `availableLocation`, `destinationPreference`; also `availableFromDate`, `vehicleType`  
**Create/Update body:** `originCityId` (uuid, required on create), `destinationCityId` (uuid, optional), plus optional fields  
**Pagination params:** `page` (default: 1), `limit` (default: 10) — same response shape as cargo posts.  
**Route-aware search:** When both `originCityId` AND `destinationCityId` are provided, the search uses `vehicle_post_route_cities` to find vehicles whose routes pass through both cities in order (originIndex < destinationIndex). Falls back to direct FK filter if no route cities exist for the post.  
**`GET /vehicle-posts/:id` response** includes `routeCities: VehiclePostRouteCity[]` sorted by `orderIndex`.

### Users (protected)
| Method | Path                      | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | /users/me                 | Get current user's profile          |
| PATCH  | /users/me                 | Update firstName, lastName, phone   |
| PATCH  | /users/change-password    | Change password (requires currentPassword + newPassword) |

`passwordHash` is always stripped from responses via `@Exclude()` + `ClassSerializerInterceptor`.

### Admin (protected — admin role required)
All `/admin/*` endpoints require `Authorization: Bearer <token>` where the token belongs to a user with `role: "admin"`. Non-admins receive HTTP 403.

| Method | Path                              | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | /admin/stats                      | Dashboard counts (users, posts, actives) |
| GET    | /admin/users                      | Paginated user list (search, page, limit)|
| PATCH  | /admin/users/:id/role             | Change user role ("user" or "admin")     |
| DELETE | /admin/users/:id                  | Delete user + cascade (posts, company)   |
| GET    | /admin/cargo-posts                | Paginated cargo posts (search, status, page, limit) |
| PATCH  | /admin/cargo-posts/:id/status     | Change cargo post status                 |
| DELETE | /admin/cargo-posts/:id            | Delete cargo post                        |
| GET    | /admin/vehicle-posts              | Paginated vehicle posts (search, status, page, limit) |
| PATCH  | /admin/vehicle-posts/:id/status   | Change vehicle post status               |
| DELETE | /admin/vehicle-posts/:id          | Delete vehicle post                      |
| POST   | /admin/posts/expire-old                         | Manually trigger post expiration job       |
| POST   | /admin/vehicle-posts/:id/regenerate-route-cities | Re-run route city generation for a post  |

**Admin safety rules:**
- Admin cannot delete their own account → 403
- Admin cannot remove their own admin role if they are the only admin → 400
- Deleting a user cascades: cargo posts → vehicle posts → company → user (no orphaned records)

---

## Frontend Pages

| Route                  | Component              | Auth?  | Description             |
|------------------------|------------------------|--------|-------------------------|
| /                      | HomePage               | No     | Landing page — dual-path hero ("Trebam prijevoz" / "Imam vozilo") + 3-step explainer *(Session 17, was a redirect to /cargo)* |
| /login                 | LoginPage              | No     | Sign-in form            |
| /register              | RegisterPage           | No     | Registration form       |
| /cargo                 | CargoListPage          | No     | Browse + filter cargo   |
| /cargo/:id             | CargoDetailPage        | No     | Cargo post details + inline edit (owner only) |
| /vehicles              | VehicleListPage        | No     | Browse + filter vehicles|
| /vehicles/:id          | VehicleDetailPage      | No     | Vehicle post details + inline edit (owner only) |
| /dashboard             | DashboardPage          | Yes    | User home + quick links |
| /company               | CompanyProfilePage     | Yes    | Create/edit company     |
| /cargo/new             | CreateCargoPostPage    | Yes    | Post new cargo          |
| /vehicles/new          | CreateVehiclePostPage  | Yes    | Post available vehicle  |
| /my-posts              | MyPostsPage            | Yes    | All user's posts with view/edit/close/delete |
| /profile               | ProfilePage            | Yes    | Edit personal info + change password   |
| /admin                 | AdminDashboardPage     | Admin  | Stats overview + quick links to admin sections |
| /admin/users           | AdminUsersPage         | Admin  | List, search, change role, delete users |
| /admin/cargo-posts     | AdminCargoPostsPage    | Admin  | List, search, filter, change status, delete cargo posts |
| /admin/vehicle-posts   | AdminVehiclePostsPage  | Admin  | List, search, filter, change status, delete vehicle posts |

**Admin routes** are wrapped in `<AdminRoute>` which:
- Redirects to `/login` if not authenticated
- Shows a "Pristup odbijen" (Access Denied) message if authenticated but not admin (role ≠ "admin")
- Renders the page if authenticated admin

---

## Environment Variables

**backend/.env**
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<your_password>
DATABASE_NAME=cargo_app

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

PORT=3000

# Frontend origin allowed to make CORS requests to this API
CORS_ORIGIN=http://localhost:5173

# Routing — get a free key at https://openrouteservice.org/dev/#/signup
OPENROUTESERVICE_API_KEY=
ROUTING_PROVIDER=openrouteservice
ROUTE_CITY_MAX_DISTANCE_KM=15
```

**frontend/.env** *(optional — defaults to `http://localhost:3000` if unset)*
```
VITE_API_URL=http://localhost:3000
```

*(Session 18: `CORS_ORIGIN` and `VITE_API_URL` added so the app can be deployed without editing source; `JWT_SECRET`, `DATABASE_HOST/USER/PASSWORD/NAME` are now validated at backend startup via Joi — a missing or too-short value fails fast instead of surfacing later at first sign/verify.)*

---

## Development Workflow (Monorepo)

The project is configured as an **npm workspace monorepo**. You install everything once from
the root and start both servers with a single command.

### Project structure (monorepo view)
```
cargo-platform/          ← root workspace
├── package.json         ← workspace config + scripts (added session 2)
├── package-lock.json    ← single lock file for all packages
├── node_modules/        ← hoisted shared packages + workspace symlinks
├── backend/             ← NestJS workspace
│   ├── package.json     ← backend-specific dependencies
│   └── node_modules/    ← backend-only packages (not hoistable)
└── frontend/            ← React workspace
    ├── package.json     ← frontend-specific dependencies
    └── node_modules/    ← frontend-only packages
```

### Root scripts
| Command              | What it does                                      |
|----------------------|---------------------------------------------------|
| `npm install`        | Install ALL packages for backend + frontend       |
| `npm run dev`        | Start backend AND frontend together (colored log) |
| `npm run backend`    | Start only the NestJS backend                     |
| `npm run frontend`   | Start only the React frontend                     |
| `npm run build`      | Build both backend and frontend for production    |

### How `npm run dev` works
`concurrently` runs two processes in parallel:
- **[BACKEND]** `npm run start:dev -w backend` → NestJS in watch mode (blue label)
- **[FRONTEND]** `npm run dev -w frontend` → Vite dev server (green label)

If either process crashes with a non-zero exit code, both stop (`--kill-others-on-fail`).  
Each log line is prefixed so you can tell at a glance which service produced it.

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or via Docker)
- pgAdmin (optional, for database GUI)

### 1. Create the Database
In pgAdmin (or psql), create a new database:
```sql
CREATE DATABASE cargo_app;
```
The tables are created automatically by TypeORM on first backend start.

### 2. Install all dependencies (one command)
```bash
# Run this from the root cargo-platform/ folder
npm install
```
This installs backend packages, frontend packages, and `concurrently` — all at once.

### 3. Start everything
```bash
npm run dev
```
You will see color-coded output:
```
[BACKEND] [Nest] LOG Bootstrap...
[FRONTEND] VITE v6.x  ready in 300ms
[BACKEND] [Nest] LOG Application is running on: http://localhost:3000
[FRONTEND] ➜  Local:   http://localhost:5173/
```

Press **Ctrl+C** once to stop both servers.

### Run only one service
```bash
npm run backend    # only NestJS
npm run frontend   # only Vite
```

---

## Key Decisions and Reasoning

### TypeORM with `synchronize: true`
In development, TypeORM automatically creates and updates database tables based on the entity definitions. This means you don't need to write SQL migrations manually. **For production, set `synchronize: false` and generate proper migration files.**

### Why TypeORM over Prisma?
TypeORM integrates natively with NestJS using decorators on entity classes. Entities serve both as database schema definitions and as TypeScript classes. Prisma is also excellent but requires a separate schema file and generated client. TypeORM's decorator approach is more cohesive with NestJS's style.

### JWT Authentication
Passwords are hashed with bcrypt (cost factor 10) before storing. JWT tokens are signed with HS256 using the `JWT_SECRET` from .env and expire after 7 days. The token is stored in `localStorage` in the frontend.

### Public Browse, Protected Post
Anyone can browse cargo/vehicle posts without logging in (good for SEO and low friction). Creating, editing, or deleting posts requires a valid JWT. Ownership is enforced in the service layer by comparing `companyId`.

### PostStatus Enum
Stored as a `varchar` column rather than a PostgreSQL ENUM type, because PostgreSQL ENUM types require DDL to add new values. Using `varchar` + TypeScript enum gives us type safety without schema migration pain.

### tsconfig changes
The original `"module": "nodenext"` was changed to `"module": "commonjs"` in the backend because several older NestJS/Passport packages do not provide proper ESM exports. CommonJS is the safe, well-tested choice for NestJS backends.

### Monorepo: npm workspaces + concurrently
**npm workspaces** (built into npm 7+) are declared in the root `package.json` via `"workspaces": ["backend", "frontend"]`. This means:
- One `npm install` at the root satisfies all packages for both apps
- Shared packages are hoisted to root `node_modules`, reducing disk usage
- npm creates symlinks `node_modules/backend` → `../backend` and `node_modules/frontend` → `../frontend`
- The root `package-lock.json` covers all workspaces

**concurrently** runs multiple shell commands in parallel from a single process. It was chosen because:
- Supports colored, named log prefixes (BACKEND/FRONTEND) — easy to distinguish logs
- `--kill-others-on-fail` stops both servers if one crashes, preventing zombie processes
- Zero configuration beyond a package.json script
- No external service needed (unlike PM2, Docker Compose, or Foreman)

---

## Known Issues / Notes

- `@types/react-router-dom` v5 is installed alongside react-router-dom v7. They should not conflict due to `skipLibCheck: true`, but ideally remove `@types/react-router-dom` with `npm uninstall @types/react-router-dom` in the frontend folder.
- `frontend/tsconfig.app.json` must stay comment-free plain JSON. Vite's internal tsconfig loader uses a strict JSON parser (not TypeScript's JSONC parser), so `/* block comments */` or duplicate keys will cause a startup error. *(Fixed session 3.)*
- TypeORM `float` columns (weight, price, capacity) return JS numbers directly. If you ever need exact decimal precision (e.g. invoicing), switch to `{ type: 'numeric', precision: 10, scale: 2 }` with a transformer.
- Post status auto-expiry: implemented via `PostsExpirationService` (daily cron at midnight). `expired` status is set only by the cron job or admin manual trigger — never by the owner's edit form (which only exposes active/closed).
- The `userId` field on the `Company` entity is also exposed in API responses. This is fine for an MVP but could be hidden in a production API.

### Resolved: npm workspaces hoisting conflict breaks backend after `@nestjs/schedule` install — Session 10

**Symptom:** After `npm install @nestjs/schedule -w backend`, the backend started but immediately threw:
```
[PackageLoader] No driver (HTTP) has been selected. In order to take advantage of the default driver,
please, ensure to install the "@nestjs/platform-express" package.
```
After fixing that, a follow-up error:
```
[PackageLoader] The "class-validator" package is missing.
```

**Root cause:** Installing `@nestjs/schedule` caused npm to re-evaluate workspace package hoisting. Because `@nestjs/schedule` has peer dependencies on `@nestjs/common` and `@nestjs/core`, npm hoisted all three to `root/node_modules/@nestjs/`. However, `@nestjs/platform-express`, `class-validator`, and `class-transformer` — which have no such peer-dep trigger — remained only in `backend/node_modules/`.

When Node.js loads `root/node_modules/@nestjs/core/`, the module resolution for `require('@nestjs/platform-express')` searches upward from `root/node_modules/@nestjs/core/` — it cannot reach `backend/node_modules/` because that is a sibling path, not an ancestor. The result is a runtime "missing package" error even though the package is technically installed.

**Fix applied:**
- Added `@nestjs/platform-express`, `class-validator`, and `class-transformer` as `devDependencies` of the **root** `package.json`. This forces npm to hoist them to `root/node_modules/` alongside the other `@nestjs/*` packages.
- No version changes — the same `^11.0.1` / `^0.15.1` / `^0.5.1` ranges as in `backend/package.json`.
- After `npm install`, all four NestJS runtime packages (`common`, `core`, `platform-express`, `schedule`) and both class packages are at root level; backend-only tooling (`@nestjs/cli`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, etc.) stays in `backend/node_modules/`.

**Why this is the correct pattern:** In npm workspaces, packages hoisted to root are resolved from all workspaces. Adding a package to root `devDependencies` is the standard way to "hint" npm to always hoist it — equivalent to Yarn's `nohoist` inverse. These packages are not used by the root workspace directly; they live there only to satisfy module resolution for the other packages that npm chose to hoist.

### Resolved: "Port 5173 is already in use" on repeated `npm run dev` — Session 8

**Symptom:** `npm run dev` frequently fails with `Error: Port 5173 is already in use` even after the previous session appeared to have stopped.

**Root cause — two compounding issues on Windows:**

1. **Async race in tree-kill**: `concurrently` uses the `tree-kill` library to kill child processes on shutdown. On Windows, `tree-kill` runs `taskkill /pid <pid> /T /F` via `exec()` — which is **asynchronous**. When Ctrl+C arrives, `concurrently`'s own Node.js process also receives the signal and begins its own shutdown. Because the `exec()` call is non-blocking, `concurrently` can exit before `taskkill` ever actually runs, abandoning the kill attempt silently.

2. **Terminal close doesn't propagate to deep grandchildren**: When a terminal window is closed (VS Code "Kill Terminal", X button, etc.), Windows sends `CTRL_CLOSE_EVENT` to console-attached processes. However, killing the console host does not guarantee all grandchildren receive or survive long enough to handle it. The Vite node process sits **4 levels deep** in the process chain:
   ```
   npm run dev
   └── cmd.exe /s /c concurrently ...
       └── concurrently (node)
           └── cmd.exe /s /c "npm run dev -w frontend"
               └── npm (node)
                   └── cmd.exe /s /c "vite"
                       └── vite (node)  ← holds port 5173
   ```
   Intermediate `cmd.exe /s /c` wrappers inserted by Windows npm can die without propagating the signal downward, leaving Vite alive as a headless orphan process.

`strictPort: true` (added Session 5) was the right call — it makes the orphan problem visible immediately with a clear error rather than silently stealing port 5174.

**Fix applied:**
- `scripts/kill-ports.js`: Node.js script (no extra npm packages) that finds and kills any process listening on ports 3000 and 5173 before startup. On Windows uses `netstat -ano | findstr` + `taskkill /T /F /PID` (which kills the entire process tree). On Unix uses `lsof -ti :<port> | xargs kill -9`.
- `package.json`: added `"predev": "node scripts/kill-ports.js"`. npm automatically runs `predev` before `dev` — no manual steps required.

**How it works in practice:**
```
$ npm run dev
> predev: node scripts/kill-ports.js
[predev] Killed stale process tree (PID 14412) on port 5173   ← stale orphan cleaned
[predev] Killed stale process tree (PID 17844) on port 3000   ← stale orphan cleaned
> dev: concurrently ... "npm run start:dev -w backend" "npm run dev -w frontend"
[BACKEND] ...
[FRONTEND] VITE v8.x  ready in 700ms
```
When ports are already free (normal case), the script exits silently and `npm run dev` proceeds immediately.

### Resolved: Frontend available on two ports (5173 and 5174) — Session 5

**Symptom:** The frontend was reachable on both `http://localhost:5173` and `http://localhost:5174` simultaneously, even when only one `npm run dev` was running. The backend CORS config had both ports as a workaround, causing CORS errors whenever the second port wasn't expected.

**Root cause:** `vite.config.ts` had no `server.port` configured. Vite defaults to 5173, but silently auto-increments to the next available port (5174) if 5173 is already occupied. When a previous `npm run dev` session was not fully cleaned up (Node process lingered on 5173), the next `npm run dev` spawned a new Vite instance on 5174. Both processes were alive simultaneously, making both ports reachable.

**Fix applied:**
- `frontend/vite.config.ts`: added `server: { port: 5173, strictPort: true }`. The `strictPort: true` flag makes Vite exit immediately with `Error: Port 5173 is already in use` rather than silently picking 5174. This surfaces the lingering-process problem instead of hiding it.
- `backend/src/main.ts`: removed `http://localhost:5174` from the CORS `origin` list; it was a bandage for the silent port-increment behavior. Only `http://localhost:5173` remains.

**Canonical ports:**
| Service  | Port |
|----------|------|
| Backend  | 3000 |
| Frontend | 5173 |

---

## Implemented Features

### Session 1 — 2026-06-12

- [x] User registration and login with JWT
- [x] Password hashing with bcrypt
- [x] Company profile create/read/update
- [x] Cargo post CRUD with ownership check
- [x] Vehicle post CRUD with ownership check
- [x] Search/filter for cargo posts (5 filters)
- [x] Search/filter for vehicle posts (4 filters)
- [x] Full React frontend with 10 pages
- [x] Protected routes in React
- [x] Persistent login via localStorage
- [x] Clean professional UI

### Session 2 — 2026-06-12
- [x] npm workspaces monorepo (single `npm install` from root)
- [x] `npm run dev` starts both backend and frontend together
- [x] concurrently with colored log prefixes (BACKEND=blue, FRONTEND=green)
- [x] Separate `npm run backend` and `npm run frontend` scripts
- [x] `npm run build` builds both workspaces

### Session 3 — 2026-06-12
- [x] Fixed `frontend/tsconfig.app.json` — duplicate `"verbatimModuleSyntax"` key and block comments caused a JSON parse error in Vite's tsconfig loader; file rewritten as clean, comment-free JSON

### Session 4 — 2026-06-15

#### Feature: Edit Cargo / Vehicle Posts
- [x] Inline edit form on `CargoDetailPage` — owner sees "Edit Post" button; clicking toggles the detail view into a pre-filled form
- [x] Inline edit form on `VehicleDetailPage` — same pattern
- [x] Edit form includes a Status field (active / closed) so owners can close posts from the UI
- [x] On save, the detail view refreshes with the updated data in place (no navigation)
- [x] Non-owners never see the Edit button (ownership check via `post.company.userId === user.id`)
- [x] Navigating from My Posts "Edit" action deep-links into the detail page with edit form pre-opened (via React Router `location.state`)

#### Feature: My Posts Page (`/my-posts`)
- [x] Two sections: My Cargo Posts and My Vehicle Posts
- [x] Each section loads independently with its own loading/error/empty state
- [x] Table shows the required columns per spec (route/location, date, status, created date)
- [x] View / Edit / Delete inline actions per row
- [x] Delete removes the row immediately from local state without a full refetch
- [x] "Edit" in My Posts navigates to the detail page with `state.startEditing = true`, which auto-opens the edit form
- [x] Quick-link buttons ("+ Post Cargo", "+ Post Vehicle") in the page header
- [x] "My Posts" link added to Navbar (visible when logged in)
- [x] "My Posts" card added to DashboardPage

#### Backend changes
- [x] `GET /cargo-posts/my` — returns all posts for the logged-in user's company (all statuses, ordered by newest first)
- [x] `GET /vehicle-posts/my` — same for vehicle posts
- [x] Both endpoints require JWT auth; ownership is enforced by looking up the user's company via `CompaniesService.findByUserId`
- [x] New routes are registered **before** `/:id` in both controllers to avoid route shadowing

### Session 5 — 2026-06-15
- [x] Fixed duplicate frontend ports (5173 + 5174) — see "Known Issues / Resolved" section above
- [x] `frontend/vite.config.ts`: added `server.port = 5173` and `server.strictPort = true`
- [x] `backend/src/main.ts`: CORS now allows only `http://localhost:5173` (removed 5174 workaround)

### Session 7 — 2026-06-15

#### Feature: Pagination for Post Lists
- [x] Shared `PaginationDto` in `backend/src/common/dto/pagination.dto.ts` extended by both filter DTOs
- [x] `GET /cargo-posts` and `GET /vehicle-posts` now accept `page` and `limit` query params
- [x] Both list endpoints return `{ data, total, page, limit, totalPages }` instead of a bare array
- [x] Pagination uses TypeORM QueryBuilder `skip` / `take` + `getManyAndCount()`
- [x] `CargoListPage` and `VehicleListPage` rewritten with two-state filter pattern:
  - `filters` (live form state) and `activeFilters` (committed on Search button)
  - `useEffect([activeFilters, page])` so filter changes always reset to page 1
  - Previous/Next buttons rendered only when `totalPages > 1`
- [x] `PaginatedResult<T>` generic interface added to `frontend/src/types/index.ts`
- [x] `.pagination` CSS added to `frontend/src/index.css`

#### Feature: User Profile Page (`/profile`)
- [x] `GET /users/me` — returns current user's profile (passwordHash excluded)
- [x] `PATCH /users/me` — updates firstName, lastName, phone
- [x] `PATCH /users/change-password` — verifies currentPassword with bcrypt, sets new hash
- [x] `UsersController` created with all three endpoints (all protected by `JwtAuthGuard`)
- [x] `UpdateProfileDto` and `ChangePasswordDto` added with class-validator decorators
- [x] `ProfilePage` at `/profile` — two independent sections:
  - Personal Information form (firstName, lastName, phone; email is read-only display)
  - Change Password form (currentPassword, newPassword, confirmPassword with client-side match check)
- [x] After successful profile update, `login(token, updatedUser)` is called to refresh AuthContext so Navbar name updates immediately without re-login
- [x] Wrong current password returns HTTP 400 with `"Current password is incorrect"` message
- [x] "Profile" link added to Navbar; "My Profile" card added to DashboardPage

### Session 8 — 2026-06-15

#### Fix: Stale port 5173 error on repeated `npm run dev`
- [x] Investigated full Windows process tree created by concurrently + npm workspaces
- [x] Confirmed root cause: async race in `tree-kill` and terminal-close not propagating to deep grandchild processes
- [x] `scripts/kill-ports.js`: cross-platform Node.js script using `netstat` + `taskkill /T /F` (Windows) and `lsof` + `kill -9` (Unix) to clear ports 3000 and 5173 before startup
- [x] `package.json`: `"predev"` script added — runs automatically before every `npm run dev` via npm lifecycle hooks, no manual steps
- [x] Verified fix with three back-to-back start/stop cycles; predev correctly killed orphaned Vite and NestJS processes each time

### Session 9 — 2026-06-16

#### Feature: Admin Panel
- [x] `backend/src/auth/decorators/roles.decorator.ts` — `@Roles(...roles)` decorator using `SetMetadata`
- [x] `backend/src/auth/guards/roles.guard.ts` — `RolesGuard` reads `@Roles()` metadata and throws 403 if user lacks the required role
- [x] All admin endpoints under `GET|PATCH|DELETE /admin/*` protected by both `JwtAuthGuard` and `RolesGuard` with `@Roles('admin')`
- [x] `backend/src/admin/admin.module.ts` + `admin.service.ts` + `admin.controller.ts` — full CRUD for users, cargo posts, vehicle posts
- [x] `GET /admin/stats` returns total and active counts for users, cargo posts, vehicle posts
- [x] `GET /admin/users` — paginated list searchable by email, firstName, lastName, phone; `passwordHash` never exposed
- [x] `PATCH /admin/users/:id/role` — change any user's role; prevents removing own admin role if last admin
- [x] `DELETE /admin/users/:id` — cascade delete (cargo posts → vehicle posts → company → user); prevents self-deletion
- [x] `GET /admin/cargo-posts` / `GET /admin/vehicle-posts` — paginated, searchable by location/company name, filterable by status
- [x] `PATCH /admin/cargo-posts/:id/status` / `PATCH /admin/vehicle-posts/:id/status` — change status
- [x] `DELETE /admin/cargo-posts/:id` / `DELETE /admin/vehicle-posts/:id` — delete post
- [x] `frontend/src/components/AdminRoute.tsx` — shows "Access Denied" for non-admins, redirects unauthenticated to `/login`
- [x] `frontend/src/pages/admin/AdminDashboardPage.tsx` — stat cards + quick links
- [x] `frontend/src/pages/admin/AdminUsersPage.tsx` — search, paginate, change role, delete (with confirm dialog)
- [x] `frontend/src/pages/admin/AdminCargoPostsPage.tsx` — search, status filter, paginate, inline status change, delete; links to public detail page
- [x] `frontend/src/pages/admin/AdminVehiclePostsPage.tsx` — same pattern for vehicle posts
- [x] `frontend/src/services/admin.service.ts` — Axios calls for all 10 admin endpoints
- [x] Navbar shows "Admin" link (amber color) only when `user.role === 'admin'`
- [x] `User` TypeScript interface updated to include optional `createdAt` / `updatedAt` fields
- [x] Admin routes added to `App.tsx`; `AppModule` updated to import `AdminModule`

**How to create the first admin user:**  
Since there is no public registration endpoint for admins, promote a user via SQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
After that, re-login so the frontend receives `role: "admin"` in the login response.

#### Feature: Consistent API Error Messages
- [x] `backend/src/common/filters/http-exception.filter.ts` — `GlobalExceptionFilter` normalises every error response to `{ statusCode, message, errors?, path, timestamp }`
- [x] `ValidationPipe` in `main.ts` now uses `exceptionFactory` to produce field-specific errors:
  ```json
  { "statusCode": 400, "message": "Validation failed", "errors": [{ "field": "email", "messages": ["Please provide a valid email address"] }], "path": "/auth/register", "timestamp": "..." }
  ```
- [x] `frontend/src/utils/errorUtils.ts` — `extractErrorMessage(err, fallback)` flattens either the `errors[]` array or `message` string; `extractFieldErrors(err)` returns a `Record<field, message>` for per-field UI display
- [x] All frontend form pages updated to use `extractErrorMessage`:
  - RegisterPage, LoginPage, ProfilePage (profile + password), CompanyProfilePage, CreateCargoPostPage, CreateVehiclePostPage, CargoDetailPage (edit), VehicleDetailPage (edit)
- [x] Validated end-to-end: submitting blank registration form now returns `"Please provide a valid email address. Password must be at least 6 characters long."` instead of generic `"Registration failed"`

### Session 10 — 2026-06-16

#### Feature: Mark Post as Closed from the UI
- [x] `CargoDetailPage`: "Close Post" button visible to owner when `post.status === 'active'` and not in edit mode; uses confirm dialog; PATCHes `{ status: 'closed' }` and updates state in place
- [x] `VehicleDetailPage`: identical pattern
- [x] `MyPostsPage`: inline "Close" action (orange, no navigation) for active rows in both cargo and vehicle tables; updates the row in local state via `.map()` on success
- [x] Non-owners never see Close/Edit controls; backend ownership enforcement unchanged
- [x] Status lifecycle: `active` → `closed` (owner-initiated) | `active` → `expired` (cron/admin only) — these are the only valid transitions from `active`

#### Feature: Scheduled Task to Auto-Expire Old Posts
- [x] `backend/src/posts-expiration/posts-expiration.service.ts` — `PostsExpirationService` with:
  - `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` scheduled job that runs daily at 00:00
  - `expireOldPosts()` public method (reused by admin manual endpoint): bulk-updates cargo posts where `loadingDate < today AND status = 'active'` and vehicle posts where `availableFromDate < today AND status = 'active'` → sets status to `expired`; uses TypeORM QueryBuilder `update().set().where().execute()` for efficient bulk updates
  - Returns `{ cargoPostsExpired, vehiclePostsExpired, message }`
  - Logs run timestamp and counts on every scheduled execution
- [x] `backend/src/posts-expiration/posts-expiration.module.ts` — module wrapping the service, exports it for AdminModule
- [x] `backend/src/app.module.ts` — added `ScheduleModule.forRoot()` (required for cron to activate) and `PostsExpirationModule`
- [x] `backend/src/admin/admin.module.ts` — imports `PostsExpirationModule`
- [x] `backend/src/admin/admin.controller.ts` — added `POST /admin/posts/expire-old` route that calls `postsExpirationService.expireOldPosts()` and returns the count result
- [x] Date boundary: `< today` (strict) so posts dated today are never auto-expired; posts from yesterday and earlier are eligible

#### Fix: npm workspaces hoisting conflict after `@nestjs/schedule` install
- [x] Root cause diagnosed: `@nestjs/schedule` install caused `@nestjs/common` and `@nestjs/core` to be hoisted to root, while `@nestjs/platform-express`, `class-validator`, `class-transformer` remained in `backend/node_modules/`; `@nestjs/core` at root can't find sibling packages in backend
- [x] Fix: added `@nestjs/platform-express`, `class-validator`, `class-transformer` as root `devDependencies` so npm hoists them alongside the other `@nestjs/*` packages
- [x] Verified: fresh `npm install` + backend startup shows "Nest application successfully started" with no PackageLoader errors

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

---

## Git Workflow

### Repository
- Remote: `https://github.com/ramljakkresimir/cargo-platform.git`
- Default branch: `master`

### Commit History (Session 6 — 2026-06-15)

All commits were created in a single session from scratch (no prior git history). Files were grouped by feature and committed in dependency order so the log reads as a project narrative.

| Hash | Commit |
|------|--------|
| `c437095` | `chore(monorepo): configure npm workspaces with concurrent startup scripts` |
| `3819540` | `feat(auth): implement JWT authentication and user registration` |
| `d29e916` | `feat(company): add company profile management` |
| `ae90f20` | `feat(cargo): implement cargo post CRUD with search and owner-scoped listing` |
| `14f49c3` | `feat(vehicle): implement vehicle post CRUD with search and owner-scoped listing` |
| `9b8938f` | `feat(frontend): scaffold React app with auth context, routing, and API services` |
| `8500091` | `feat(frontend): add all application pages including My Posts and inline editing` |
| `b1ff3ad` | `fix(vite): pin frontend port to 5173 and enable strictPort` |
| `ab73659` | `fix(cors): restrict CORS to canonical frontend origin and add backend bootstrap` |
| `457be9a` | `docs(project): add CLAUDE.md development journal` |

### Notes
- `backend/.git` (an empty nested git repo accidentally created by NestJS scaffold) was removed before first commit so backend source is tracked by the root repo.
- Sub-package lock files (`backend/package-lock.json`, `frontend/package-lock.json`) are gitignored; only the root `package-lock.json` is committed (canonical for npm workspaces).
- `.claude/` (Claude Code internal state) is gitignored.
- `backend/.env` is gitignored via `backend/.gitignore`; committed `backend/.env.example` instead.

---

## Role-Based Access Control

The app uses a simple two-tier role system stored in the `users.role` column:

| Role    | Access                                                  |
|---------|---------------------------------------------------------|
| `user`  | Standard user — can browse posts, manage own posts/company/profile |
| `admin` | All `user` access + full access to `/admin/*` endpoints |

**Guards used:**
- `JwtAuthGuard` — verifies the JWT and populates `req.user` from the database
- `RolesGuard` + `@Roles('admin')` — checks `req.user.role` after JWT validation

**Frontend detection:** the login response always includes `role` in the user object, stored in `localStorage`. `AdminRoute` and the Navbar Admin link check `user.role === 'admin'`.

---

## API Error Response Format

All errors from the backend follow a consistent shape (enforced by `GlobalExceptionFilter`):

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "messages": ["Please provide a valid email address"] },
    { "field": "password", "messages": ["Password must be at least 6 characters long"] }
  ],
  "path": "/auth/register",
  "timestamp": "2026-06-16T12:00:00.000Z"
}
```

`errors` is only present for validation failures. For other errors (401, 403, 404, 409, 500) only `statusCode`, `message`, `path`, and `timestamp` are returned.

The frontend `extractErrorMessage(err, fallback)` utility in `frontend/src/utils/errorUtils.ts` handles both shapes — it joins all field messages if `errors` is present, otherwise falls back to `message`.

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

**Root cause:** `PostsExpirationService.expireOldPosts()` — the only code path that ever writes `status = 'expired'` to the database — was wired up solely to `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` and the manual `POST /admin/posts/expire-old` endpoint. Neither fires unless the backend process happens to be running at the exact moment midnight ticks over (server local time). In this dev environment the backend is restarted frequently (see `predev` / kill-ports workflow in "Known Issues"), so it is often *not* running through midnight, and the scheduled tick is simply skipped — there is no catch-up/backlog mechanism in `@nestjs/schedule`.

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
- [x] Deliberately skipped the optional "recent cargo/vehicles preview" — spec marked it optional and the page is meant to stay short; can be added later without touching anything else

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

**Known limitation:** `npm run lint` still fails with the pre-existing 32 errors described above — fixing them would mean reordering hook declarations across files this redesign didn't otherwise need to touch (`AdminUsersPage.tsx`, `AdminCargoPostsPage.tsx`, `AdminVehiclePostsPage.tsx`, `VehicleListPage.tsx`, plus a few `services/`/`utils/` files), which was out of scope for a visual redesign task. Flagged here so a future session can decide whether to fix it as its own cleanup.

---

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
Fixed the tech-stack table in this file.

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

**L5 — Registration reveals whether an email exists — deliberately left as-is.** The review itself frames this as a conscious UX/security trade-off rather than a bug (login already uses a generic error; only registration's 409 is specific). No code change; noting the decision here as the review suggested.

**Verification approach this session:** every fix that touched runtime behavior (not just types) was exercised against the actual running backend and the live local Postgres — registered/logged in test users, changed passwords, hit admin endpoints with hand-signed JWTs, queried Postgres directly before/after — rather than relying on `tsc`/`vite build` alone. Temporary test rows were cleaned up after each check.

---

## TODO / Next Steps

- [x] Mark post as closed from the UI — "Close Post" button on detail pages + inline "Close" in My Posts
- [x] Scheduled task to auto-expire posts past their date — daily cron at midnight via `@nestjs/schedule`
- [x] Fix expiration timezone bug — was using UTC date; now uses local date components
- [x] Normalized city data with autocomplete (Phase 1) — cities table, seed, CityAutocomplete component
- [x] Route matching / corridor search (Phase 2) — ORS driving route + turf projection, route-aware vehicle search
- [x] Route map visualization (Phase 3) — Leaflet map on VehicleDetailPage with polyline + markers
- [x] Prevent and hide past-dated posts — create/update validation + public listing date filter
- [x] Fix post expiration consistency — startup sync in `PostsExpirationService` so the DB self-heals on every backend start, not just at midnight
- [x] Full frontend visual redesign + Croatian localization — new home page, simplified nav with Pretraga/Objavi dropdown menus, card-based list/detail pages, restyled forms/dashboard/My Posts/Admin
- [x] Code review remediation (Session 18) — all HIGH/MEDIUM findings and 7 of 8 LOW findings from `CODE_REVIEW.md` fixed; L5 (email enumeration on registration) deliberately left as a documented trade-off; `npm run lint`'s pre-existing 32 errors are a separate, still-open item below
- [ ] Fix pre-existing `npm run lint` failures (32 errors, confirmed present on master before the Session 17 redesign — hook-declaration-order and `no-explicit-any` issues, mostly in Admin list pages and `utils/errorUtils.ts`)
- [ ] Email validation / verification on registration
- [ ] Docker Compose setup for easy local start
- [ ] Production migrations (TypeORM migration files) — `synchronize` is now gated off in production (Session 18); migrations are the remaining piece
- [ ] Deploy to a VPS or cloud provider
- [ ] Admin: ability to view/edit a single user's company profile
- [ ] Admin: bulk-action on posts (e.g. close all expired)
- [ ] Optional home page "recent cargo/vehicles" preview — deliberately skipped in Session 17 to keep the landing page short
