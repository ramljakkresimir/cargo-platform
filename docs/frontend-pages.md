# Frontend Pages

| Route                  | Component              | Auth?  | Description             |
|------------------------|------------------------|--------|--------------------------|
| /                      | HomePage               | No     | Landing page — dual-path hero ("Trebam prijevoz" / "Imam vozilo") + 3-step explainer *(Session 17, was a redirect to /cargo)* |
| /login                 | LoginPage              | No     | Sign-in form — shows a CAPTCHA widget once the backend requests one, an unverified-account notice with inline resend, and a "Zaboravili ste lozinku?" link *(Session 20)* |
| /register              | RegisterPage           | No     | Registration form — always requires solving a Turnstile CAPTCHA *(Session 20)* |
| /verify-email          | VerifyEmailPage        | No     | Consumes `?token=` from the verification email link *(Session 20)* |
| /forgot-password       | ForgotPasswordPage     | No     | Request a password reset link (CAPTCHA required) *(Session 20)* |
| /reset-password        | ResetPasswordPage      | No     | Consumes `?token=` from the reset email link, sets a new password *(Session 20)* |
| /cargo                 | CargoListPage          | No     | Browse + filter cargo — card-based search UI, each card shows the poster's rating *(Session 22, ratings Session 24)* |
| /cargo/:id             | CargoDetailPage        | No     | Cargo post details + inline edit (owner only); route-headline header, sticky map/contact/rating layout via shared `components/detail/` kit *(Session 24 ratings, redesigned Session 26)* |
| /vehicles              | VehicleListPage        | No     | Browse + filter vehicles — shares the same search UI kit as CargoListPage, cards show the poster's rating *(Session 22, ratings Session 24)* |
| /vehicles/:id          | VehicleDetailPage      | No     | Vehicle post details + inline edit (owner only); route-headline header, sticky map/contact/rating layout via shared `components/detail/` kit *(Session 24 ratings, redesigned Session 26)* |
| /dashboard             | DashboardPage          | Yes    | User home + quick links |
| /company               | CompanyProfilePage     | Yes    | Create/edit company     |
| /cargo/new             | CreateCargoPostPage    | Yes    | Post new cargo          |
| /vehicles/new          | CreateVehiclePostPage  | Yes    | Post available vehicle  |
| /my-posts              | MyPostsPage            | Yes    | All user's posts with view/edit/close/delete |
| /profile               | ProfilePage            | Yes    | Edit personal info + change password; header shows the user's name and average rating *(Session 24)* |
| /conversations         | ConversationsPage      | Yes    | List of past conversations; clicking one opens the chat drawer *(Session 23)* |
| /admin                 | AdminDashboardPage     | Admin  | Stats overview + quick links to admin sections |
| /admin/users           | AdminUsersPage         | Admin  | List, search, change role, delete users |
| /admin/users/:id/company | AdminUserCompanyPage | Admin  | View and edit a single user's company profile *(Session 21)* |
| /admin/cargo-posts     | AdminCargoPostsPage    | Admin  | List, search, filter, change status, delete cargo posts |
| /admin/vehicle-posts   | AdminVehiclePostsPage  | Admin  | List, search, filter, change status, delete vehicle posts |

**Admin routes** are wrapped in `<AdminRoute>` which:
- Redirects to `/login` if not authenticated
- Shows a "Pristup odbijen" (Access Denied) message if authenticated but not admin (role ≠ "admin")
- Renders the page if authenticated admin

---

## Role-Based Access Control

The app uses a simple two-tier role system stored in the `users.role` column:

| Role    | Access                                                  |
|---------|-----------------------------------------------------------|
| `user`  | Standard user — can browse posts, manage own posts/company/profile |
| `admin` | All `user` access + full access to `/admin/*` endpoints |

**Guards used:**
- `JwtAuthGuard` — verifies the JWT and populates `req.user` from the database
- `RolesGuard` + `@Roles('admin')` — checks `req.user.role` after JWT validation

**Frontend detection:** the login response always includes `role` in the user object, stored in `localStorage`. `AdminRoute` and the Navbar Admin link check `user.role === 'admin'`.

**Unaffected by Session 20:** the role system, both guards, and the Admin role's permissions were not modified when email verification/CAPTCHA/rate limiting were added. `RolesGuard`, `roles.decorator.ts`, and `admin.*` were not touched; `admin.service.spec.ts` was not touched and still passes. Both pre-existing admin accounts were backfilled `emailVerified: true` by the Session 20 migration, so admin login is unaffected by the new verification gate.
