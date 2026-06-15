# CargoConnect BiH — Development Journal

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
| Auth         | JWT (RS256 via @nestjs/jwt)         |
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
│       ├── users/            User entity + service
│       ├── companies/        Company profile CRUD
│       ├── cargo-posts/      Cargo post CRUD + search
│       ├── vehicle-posts/    Vehicle post CRUD + search
│       ├── common/enums/     Shared PostStatus enum
│       ├── app.module.ts     Root module wiring
│       └── main.ts           Bootstrap, CORS, validation pipe
│
└── frontend/                 Vite + React app (port 5173)
    └── src/
        ├── context/          AuthContext (JWT + user state)
        ├── services/         Axios API clients per resource
        ├── components/       Navbar, ProtectedRoute
        ├── pages/            10 pages (see list below)
        └── types/            Shared TypeScript interfaces
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

### cargo_posts
| Column              | Type      | Notes                     |
|---------------------|-----------|---------------------------|
| id                  | uuid (PK) |                           |
| companyId           | uuid (FK) | → companies.id            |
| loadingLocation     | varchar   |                           |
| unloadingLocation   | varchar   |                           |
| loadingDate         | date      |                           |
| cargoType           | varchar   | nullable                  |
| weight              | float     | nullable, in tonnes       |
| dimensions          | varchar   | nullable (e.g. "3x2x2m") |
| requiredVehicleType | varchar   | nullable                  |
| price               | float     | nullable, in EUR          |
| note                | text      | nullable                  |
| status              | varchar   | active / closed / expired |
| createdAt           | timestamp |                           |
| updatedAt           | timestamp |                           |

### vehicle_posts
| Column                | Type      | Notes                     |
|-----------------------|-----------|---------------------------|
| id                    | uuid (PK) |                           |
| companyId             | uuid (FK) | → companies.id            |
| availableLocation     | varchar   |                           |
| availableFromDate     | date      |                           |
| vehicleType           | varchar   | truck / van / semi_truck / etc. |
| capacity              | float     | nullable, in tonnes       |
| destinationPreference | varchar   | nullable                  |
| note                  | text      | nullable                  |
| status                | varchar   | active / closed / expired |
| createdAt             | timestamp |                           |
| updatedAt             | timestamp |                           |

---

## API Endpoints

All endpoints return JSON. Protected endpoints require:  
`Authorization: Bearer <jwt_token>`

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

**Cargo filter query params:** `loadingLocation`, `unloadingLocation`, `loadingDate`, `cargoType`, `requiredVehicleType`  
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

**Vehicle filter query params:** `availableLocation`, `availableFromDate`, `vehicleType`, `destinationPreference`

---

## Frontend Pages

| Route           | Component              | Auth? | Description             |
|-----------------|------------------------|-------|-------------------------|
| /login          | LoginPage              | No    | Sign-in form            |
| /register       | RegisterPage           | No    | Registration form       |
| /cargo          | CargoListPage          | No    | Browse + filter cargo   |
| /cargo/:id      | CargoDetailPage        | No    | Cargo post details + inline edit (owner only) |
| /vehicles       | VehicleListPage        | No    | Browse + filter vehicles|
| /vehicles/:id   | VehicleDetailPage      | No    | Vehicle post details + inline edit (owner only) |
| /dashboard      | DashboardPage          | Yes   | User home + quick links |
| /company        | CompanyProfilePage     | Yes   | Create/edit company     |
| /cargo/new      | CreateCargoPostPage    | Yes   | Post new cargo          |
| /vehicles/new   | CreateVehiclePostPage  | Yes   | Post available vehicle  |
| /my-posts       | MyPostsPage            | Yes   | All user's posts with view/edit/delete |

---

## Environment Variables

**backend/.env**
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=pikaso
DATABASE_NAME=cargo_app

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

PORT=3000
```

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
- Post status is not automatically set to `expired` based on date — this would require a scheduled task (cron job) to be added later.
- The `userId` field on the `Company` entity is also exposed in API responses. This is fine for an MVP but could be hidden in a production API.

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

---

## TODO / Next Steps

- [ ] Mark post as closed/expired from the UI — partially done; the edit form includes a Status field (active/closed); auto-expiry by date still needs a backend cron job
- [ ] Pagination for post lists
- [ ] User profile page (change password, update personal info)
- [ ] Email validation / verification on registration
- [ ] Scheduled task to auto-expire posts past their date
- [ ] Better error messages from the API (validation error details)
- [ ] Admin panel (manage users, posts)
- [ ] Docker Compose setup for easy local start
- [ ] Production migrations (TypeORM migration files)
- [ ] Deploy to a VPS or cloud provider
