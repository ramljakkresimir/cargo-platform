# TODO / Next Steps

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
- [x] Fix pre-existing `npm run lint` failures (Session 19) — both frontend and backend now exit 0; frontend also picked up two new rule categories from an `eslint-plugin-react-hooks` v7 upgrade beyond the originally-documented 32
- [x] Email validation / verification on registration (Session 20) — mandatory email verification before login, SHA-256-hashed single-use tokens, configurable expiry, resend with cooldown; existing users backfilled as verified
- [ ] Docker Compose setup for easy local start
- [x] Production migrations (TypeORM migration files) — Session 19: shared `entities.ts`, CLI `data-source.ts`, `migration:generate`/`run`/`revert`/`show` scripts, baseline `InitialSchema` migration generated and verified against a throwaway DB, dev DB bootstrapped onto the migration table
- [x] Password reset flow (Session 20) — forgot/reset-password endpoints, same single-use SHA-256-hashed-token design as email verification, resets invalidate existing JWTs via the Session-18 `passwordChangedAt` mechanism
- [x] Bot protection on auth forms (Session 20) — Cloudflare Turnstile, server-side verification, mandatory on registration, adaptive on login after repeated failures, mandatory on resend/forgot-password
- [x] Rate limiting on auth endpoints (Session 20) — per-route configurable IP throttles on all six `/auth/*` endpoints, plus account-based cooldowns/CAPTCHA-escalation; no permanent lockout
- [x] Close registration email-enumeration gap (Session 20) — reverses the Session 18 L5 "deliberately left as-is" decision; registration/resend/forgot-password now all return generic, non-enumerating responses
- [ ] Deploy to a VPS or cloud provider — production deploy now additionally requires `TURNSTILE_SECRET_KEY` and `SMTP_*` to be set (Joi fails startup otherwise) and `trust proxy` to be reviewed once a reverse proxy/load balancer is chosen
- [ ] MFA/TOTP for Admin accounts — recommended in Session 20 as a follow-up; not implemented
- [ ] Background email queueing — worth considering if registration/reset volume grows enough that the synchronous send-in-request-path becomes a bottleneck; not needed at current scale
- [x] Admin: ability to view/edit a single user's company profile (Session 21) — `AdminUserCompanyPage`, reuses `CompaniesService`
- [x] Admin: bulk-action on posts — "close all expired" (Session 21) — bulk-closes both cargo and vehicle posts in `status: 'expired'`
- [x] Optional home page "recent cargo/vehicles" preview (Session 21) — 3 recent cargo + 3 recent vehicle listings, reuses the existing paginated endpoints with `limit=3`
- [x] Redesigned search/listing pages — Vehicles & Cargo (Session 22) — shared `components/search/` kit, quick-filter chips with date-range backend support, cached road-distance API (`POST /cities/distances`), `CompanyAvatar` placeholder, full responsive spec (desktop/tablet/mobile)
- [x] In-app chat/messaging on listings — "Razgovori" (Session 23) — `messaging/` module (`conversations`/`messages` tables, one thread per user pair), `ChatContext`/`ChatDrawer` with 4s polling, navbar unread badge, `/conversations` list page, "Kontakt" buttons wired on cards + detail pages; also fixed a real `AdminService.deleteUser()` FK-ordering bug this feature exposed

See [Session Changelog](changelog/README.md) for the full implementation detail behind each entry.
