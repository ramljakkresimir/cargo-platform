# Development Workflow (Monorepo)

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
└── frontend/             ← React workspace
    ├── package.json     ← frontend-specific dependencies
    └── node_modules/    ← frontend-only packages
```

### Root scripts
| Command              | What it does                                      |
|----------------------|-----------------------------------------------------|
| `npm install`        | Install ALL packages for backend + frontend       |
| `npm run dev`        | Start backend AND frontend together (colored log) |
| `npm run backend`    | Start only the NestJS backend                     |
| `npm run frontend`   | Start only the React frontend                     |
| `npm run build`      | Build both backend and frontend for production    |
| `npm run migration:generate` | Diff entities vs. DB, write a new migration file (`-- src/migrations/Name`) |
| `npm run migration:run`      | Apply all pending migrations                       |
| `npm run migration:revert`   | Roll back the most recently applied migration      |
| `npm run migration:show`     | List migrations and whether each is applied        |
| `npm run migration:create`   | Scaffold an empty migration file (no DB diff)       |

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
