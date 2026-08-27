# Known Issues / Notes

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
