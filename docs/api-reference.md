# API Endpoints

All endpoints return JSON. Protected endpoints require:
`Authorization: Bearer <jwt_token>`

### Cities (public)
| Method | Path             | Description                                  |
|--------|------------------|----------------------------------------------|
| GET    | /cities          | Search cities — params: `search`, `country`, `limit` (max 50, default 20) |
| POST   | /cities/distances | Body: `{ pairs: [{ fromCityId, toCityId }] }` (1–50 pairs) — batched road-distance lookup, cached per city pair *(Session 22)* |

Response (`GET /cities`): JSON array of `{ id, name, country, region, latitude, longitude }`.
Response (`POST /cities/distances`): `{ results: [{ fromCityId, toCityId, distanceKm }] }` — `distanceKm` is `null` (never `0` or a fallback number) whenever the pair can't be resolved (same city, unknown city id, or the routing provider failed).
Seed: `npm run seed:cities` — idempotent, uses name + country uniqueness. Seeded with 49 cities (BA + HR).

### Auth (public)
| Method | Path                        | Description                                              |
|--------|-----------------------------|--------------------------------------------------------------|
| POST   | /auth/register              | Create account (unverified) — requires `captchaToken`    |
| POST   | /auth/login                 | Login, get JWT token — rejects unverified accounts (403); requires `captchaToken` once an account has enough recent failed attempts (see Session 20) |
| POST   | /auth/verify-email           | Body: `{ token }` — marks the account verified            |
| POST   | /auth/resend-verification    | Body: `{ email, captchaToken }` — generic response regardless of account state |
| POST   | /auth/forgot-password        | Body: `{ email, captchaToken }` — generic response regardless of account state |
| POST   | /auth/reset-password          | Body: `{ token, newPassword }` — single-use, invalidates existing sessions |

**Registration is deliberately non-enumerating (Session 20):** every request returns the same generic message whether or not the email is already registered. A duplicate email does not create a second account — the existing account is emailed a notice instead. `resend-verification` and `forgot-password` are generic in the same way. See "Authentication & Security (Session 20)" in [Key Decisions](key-decisions.md) for the full design.

All six endpoints are rate-limited per IP (see `RATE_LIMIT_*` env vars in [Environment Variables](environment-variables.md)); register/login/verify-email/resend-verification/forgot-password/reset-password all sit on their own configurable throttle rather than the app-wide default.

### Companies (protected)
| Method | Path           | Description                  |
|--------|----------------|-------------------------------|
| GET    | /companies/me  | Get my company profile       |
| POST   | /companies     | Create company profile       |
| PATCH  | /companies/me  | Update company profile       |

### Cargo Posts
| Method | Path             | Auth?    | Description            |
|--------|------------------|----------|-------------------------|
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
**Route geometry:** create/update fetches a driving route between `loadingCity`/`unloadingCity` via the same `RoutingService`/ORS integration vehicle posts use, and stores it on `routeGeoJson: {lat,lng}[] | null` (regenerated when either city changes; `null` if ORS is unavailable). No cities-on-route table — that matching feature stays vehicle-only *(Session 26)*.

### Vehicle Posts
| Method | Path                | Auth?    | Description            |
|--------|---------------------|----------|-------------------------|
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
|--------|---------------------------|--------------------------------------|
| GET    | /users/me                 | Get current user's profile          |
| PATCH  | /users/me                 | Update firstName, lastName, phone   |
| PATCH  | /users/change-password    | Change password (requires currentPassword + newPassword) |

`passwordHash` is always stripped from responses via `@Exclude()` + `ClassSerializerInterceptor`.

### Conversations (protected) *(Session 23)*
| Method | Path                          | Description |
|--------|-------------------------------|--------------|
| GET    | /conversations                | List the current user's threads, most recent activity first |
| GET    | /conversations/unread-count   | `{ count }` — total unread messages, for the navbar badge |
| POST   | /conversations                | Body: `{ recipientUserId, cargoPostId?, vehiclePostId? }` — find-or-create the thread with that user (the "Kontakt"/"Pošalji poruku" flow); 400 if `recipientUserId` is the caller |
| GET    | /conversations/:id/messages   | Full message history; also marks the other participant's messages read (no separate mark-read endpoint) |
| POST   | /conversations/:id/messages   | Body: `{ content }` (1–2000 chars) — send a message |

403 if the caller isn't one of the conversation's two participants; 404 if the conversation doesn't exist. See "In-app messaging (Session 23)" in [Key Decisions](key-decisions.md) for the full design, including why it's one thread per user pair rather than one per listing.

### Ratings *(Session 24)*
| Method | Path                          | Auth?    | Description |
|--------|-------------------------------|----------|--------------|
| POST   | /ratings                      | Required | Body: `{ ratedUserId, score, cargoPostId?, vehiclePostId? }` — submit a rating, or update the caller's existing rating for that user (one rating per rater→ratedUser pair; re-rating updates in place). 400 if `ratedUserId` is the caller |
| POST   | /ratings/summaries            | No       | Body: `{ userIds: string[] }` (1–100) — batched average+count lookup for a page of search result cards |
| GET    | /ratings/user/:userId/summary | No       | `{ userId, average, count }` for a single user |
| GET    | /ratings/user/:userId/mine    | Required | The caller's existing rating for `:userId`, or `null` — used to pre-fill the rating picker |

Response shape for both summary endpoints: `average` is `null` (never `0`) when `count` is `0` — the frontend shows "Još nema ocjena" instead of an empty/misleading star row in that case, the same convention `distanceKm: null` uses for unresolvable city pairs. `POST /ratings/summaries` always returns one entry per requested id, including ids with zero ratings. See "User Ratings (Session 24)" in [Key Decisions](key-decisions.md) for the full design, including why the average is computed on read rather than denormalized.

### Admin (protected — admin role required)
All `/admin/*` endpoints require `Authorization: Bearer <token>` where the token belongs to a user with `role: "admin"`. Non-admins receive HTTP 403.

| Method | Path                              | Description                              |
|--------|-----------------------------------|-------------------------------------------|
| GET    | /admin/stats                      | Dashboard counts (users, posts, actives) |
| GET    | /admin/posts/expired-count        | Preview count of expired cargo/vehicle posts, for the bulk "close all expired" confirmation *(Session 21)* |
| POST   | /admin/posts/close-expired        | Bulk-close every post with `status: 'expired'` (both cargo and vehicle) *(Session 21)* |
| GET    | /admin/users                      | Paginated user list (search, page, limit)|
| PATCH  | /admin/users/:id/role             | Change user role ("user" or "admin")     |
| DELETE | /admin/users/:id                  | Delete user + cascade (posts, company)   |
| GET    | /admin/users/:id                  | Single user by id (used by the company-profile page for header context) *(Session 21)* |
| GET    | /admin/users/:id/company           | View a user's company profile *(Session 21)* |
| PATCH  | /admin/users/:id/company           | Edit a user's company profile — same fields/validation as `PATCH /companies/me` *(Session 21)* |
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
- Deleting a user cascades: cargo posts → vehicle posts → company → **conversations (Session 23)** → user (no orphaned records; conversations must be deleted before the user row since `userAId`/`userBId` are deliberately `ON DELETE NO ACTION`, not `CASCADE` — see "In-app messaging (Session 23)" in [Key Decisions](key-decisions.md))
- `GET /admin/users/:id/company` and `PATCH /admin/users/:id/company` return 404 `"User not found"` if the user id doesn't exist, and 404 `"Company profile not found..."` (the same message `CompaniesService` already uses for `/companies/me`) if the user exists but never created a company profile — the two cases are distinguishable by message *(Session 21)*
- `POST /admin/posts/close-expired` only ever touches rows where `status = 'expired'` (already-active or already-closed posts are untouched) and is idempotent — running it again after all expired posts are closed affects 0 rows *(Session 21)*

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
