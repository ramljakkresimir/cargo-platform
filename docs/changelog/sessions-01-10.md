# Implemented Features — Sessions 1–10

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
- [x] Fixed duplicate frontend ports (5173 + 5174) — see [Known Issues](../known-issues.md)
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

Full root-cause details for the Session 5 and Session 8 fixes live in [Known Issues](../known-issues.md).

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
