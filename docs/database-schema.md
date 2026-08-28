# Database Schema

TypeORM `synchronize: true` auto-creates/updates all tables in development (gated off in production, Session 18).
A baseline migration matching this schema exists since Session 19 — see "TypeORM with `synchronize: true`" in [Key Decisions](key-decisions.md) for the migration workflow.

### users
| Column                        | Type      | Notes                      |
|-------------------------------|-----------|----------------------------|
| id                            | uuid (PK) | auto-generated             |
| email                         | varchar   | unique                     |
| passwordHash                  | varchar   | bcrypt, never returned     |
| firstName                     | varchar   |                            |
| lastName                      | varchar   |                            |
| phone                         | varchar   | nullable                   |
| role                          | varchar   | default: 'user'            |
| passwordChangedAt             | timestamp | nullable — set on password change/reset; any JWT with an earlier `iat` is rejected (Session 18, M9) |
| emailVerified                 | boolean   | default: false. Login is blocked until true (Session 20). Existing rows were backfilled to `true` by the migration that introduced this column — see Session 20 |
| emailVerificationTokenHash    | varchar   | nullable — SHA-256 hash of the active verification token; raw token is never stored |
| emailVerificationExpiresAt    | timestamp | nullable                   |
| emailVerificationLastSentAt   | timestamp | nullable — drives the resend cooldown |
| passwordResetTokenHash        | varchar   | nullable — SHA-256 hash of the active reset token; raw token is never stored |
| passwordResetExpiresAt        | timestamp | nullable                   |
| passwordResetLastSentAt       | timestamp | nullable — drives the forgot-password resend cooldown |
| failedLoginAttempts           | int       | default: 0. Drives the login CAPTCHA escalation (Session 20); reset to 0 on successful login or password reset. Never used for lockout |
| lastFailedLoginAt             | timestamp | nullable                   |
| createdAt                     | timestamp |                            |
| updatedAt                     | timestamp |                            |

`passwordHash`, `emailVerificationTokenHash`, `emailVerificationExpiresAt`, `emailVerificationLastSentAt`, `passwordResetTokenHash`, `passwordResetExpiresAt`, `passwordResetLastSentAt`, `failedLoginAttempts`, and `lastFailedLoginAt` are all `@Exclude()`d from API responses.

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
| routeGeoJson        | jsonb     | nullable — `[{lat,lng}]` driving route from ORS between loadingCity/unloadingCity (Session 26). No cities-on-route table for cargo — that matching tooling is vehicle-specific |
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

### city_distances *(Session 22)*
| Column     | Type      | Notes                                                    |
|------------|-----------|-------------------------------------------------------------|
| id         | uuid (PK) |                                                           |
| cityAId    | uuid (FK) | → cities.id — the lexicographically smaller of the pair  |
| cityBId    | uuid (FK) | → cities.id — the lexicographically larger of the pair   |
| distanceKm | float     | road distance, rounded to the nearest 10 km               |
| createdAt  | timestamp |                                                           |

Unique constraint on `(cityAId, cityBId)`. Indexes on both FK columns.
Cache for the "~ X km" distance shown on vehicle/cargo search result cards — see `CityDistanceService` in [Key Decisions](key-decisions.md). Rows are only ever inserted, never updated (a cached distance for a city pair never changes).

### conversations *(Session 23)*
| Column        | Type      | Notes                                                              |
|---------------|-----------|-----------------------------------------------------------------------|
| id            | uuid (PK) |                                                                     |
| userAId       | uuid (FK) | → users.id — always the lexicographically smaller of the pair      |
| userBId       | uuid (FK) | → users.id — always the lexicographically larger of the pair       |
| cargoPostId   | uuid (FK) | → cargo_posts.id, nullable, `ON DELETE SET NULL`                   |
| vehiclePostId | uuid (FK) | → vehicle_posts.id, nullable, `ON DELETE SET NULL`                 |
| lastMessageAt | timestamp | nullable — denormalized for ordering the conversation list          |
| createdAt     | timestamp |                                                                     |
| updatedAt     | timestamp |                                                                     |

Unique constraint on `(userAId, userBId)` — **one thread per pair of users**, regardless of which listing (if any) started it or how many different listings they later discuss. `cargoPostId`/`vehiclePostId` are display context only; deleting the listing later never deletes or breaks the conversation.

### messages *(Session 23)*
| Column         | Type      | Notes                                              |
|----------------|-----------|--------------------------------------------------------|
| id             | uuid (PK) |                                                     |
| conversationId | uuid (FK) | → conversations.id, `ON DELETE CASCADE`             |
| senderId       | uuid (FK) | → users.id                                         |
| content        | text      | 1–2000 chars, trimmed server-side                   |
| readAt         | timestamp | nullable — null means unread                        |
| createdAt      | timestamp |                                                     |

Index on `conversationId`. See "In-app messaging (Session 23)" in [Key Decisions](key-decisions.md) for the full design and the `AdminService.deleteUser()` cascade fix this table required.

### ratings *(Session 24)*
| Column        | Type      | Notes                                                              |
|---------------|-----------|-----------------------------------------------------------------------|
| id            | uuid (PK) |                                                                     |
| raterId       | uuid (FK) | → users.id, `ON DELETE CASCADE` — the user who gave the rating      |
| ratedUserId   | uuid (FK) | → users.id, `ON DELETE CASCADE` — the user being rated              |
| score         | smallint  | 1–5                                                                 |
| cargoPostId   | uuid (FK) | → cargo_posts.id, nullable, `ON DELETE SET NULL`                   |
| vehiclePostId | uuid (FK) | → vehicle_posts.id, nullable, `ON DELETE SET NULL`                 |
| createdAt     | timestamp |                                                                     |
| updatedAt     | timestamp |                                                                     |

Unique constraint on `(raterId, ratedUserId)` — **one rating per rater→ratedUser pair**; rating the same person again updates this row rather than inserting a new one. `cargoPostId`/`vehiclePostId` are display context only (which listing prompted the rating), exactly like `conversations`. Unlike `conversations.userAId`/`userBId` (deliberately `NO ACTION` to avoid a stray cascade through a shared row affecting a third user), both user FKs here are `CASCADE` — a `Rating` row has no such transitive-deletion risk, so deleting a user automatically removes every rating they gave or received with no extra code in `AdminService.deleteUser()`. The average/count shown in the UI is always computed on read (`AVG`/`COUNT` over this table, batched for search cards) — there is no denormalized average column anywhere. See "User Ratings (Session 24)" in [Key Decisions](key-decisions.md).
