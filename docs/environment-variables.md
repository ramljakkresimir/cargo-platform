# Environment Variables

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

# Frontend origin allowed to make CORS requests to this API — also used to build the
# verification/reset links sent in emails
CORS_ORIGIN=http://localhost:5173

# Cloudflare Turnstile — server-side CAPTCHA verification (Session 20)
TURNSTILE_SECRET_KEY=

# SMTP — verification / password-reset emails (Session 20)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=CargoConnect <no-reply@cargoconnect.local>

# Email verification / password reset token lifetimes and resend cooldown (Session 20)
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
EMAIL_RESEND_COOLDOWN_SECONDS=60

# Login CAPTCHA escalation — require a CAPTCHA after this many recent failed attempts
# on an account, within this window (Session 20)
LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD=3
LOGIN_CAPTCHA_WINDOW_MINUTES=15

# Per-route rate limits, requests per minute per IP (Session 20)
RATE_LIMIT_DEFAULT_PER_MIN=60
RATE_LIMIT_REGISTER_PER_MIN=5
RATE_LIMIT_LOGIN_PER_MIN=5
RATE_LIMIT_VERIFY_EMAIL_PER_MIN=10
RATE_LIMIT_RESEND_VERIFICATION_PER_MIN=3
RATE_LIMIT_FORGOT_PASSWORD_PER_MIN=3
RATE_LIMIT_RESET_PASSWORD_PER_MIN=5

# Routing — get a free key at https://openrouteservice.org/dev/#/signup
OPENROUTESERVICE_API_KEY=
ROUTING_PROVIDER=openrouteservice
ROUTE_CITY_MAX_DISTANCE_KM=15
```

**frontend/.env** *(optional — defaults to `http://localhost:3000` if unset)*
```
VITE_API_URL=http://localhost:3000

# Cloudflare Turnstile site key (public, safe to expose client-side) — must match the
# backend's TURNSTILE_SECRET_KEY (Session 20)
VITE_TURNSTILE_SITE_KEY=
```

Full lists with inline comments and defaults live in `backend/.env.example` and `frontend/.env.example` — treat those files as the source of truth; this section is a summary.

*(Session 18: `CORS_ORIGIN` and `VITE_API_URL` added so the app can be deployed without editing source; `JWT_SECRET`, `DATABASE_HOST/USER/PASSWORD/NAME` are now validated at backend startup via Joi — a missing or too-short value fails fast instead of surfacing later at first sign/verify.)*

*(Session 20: `TURNSTILE_SECRET_KEY` and `SMTP_HOST`/`SMTP_FROM` are validated the same way — required whenever `NODE_ENV=production`, optional otherwise. `SMTP_PORT` defaults to 587 regardless of environment. See "Authentication & Security (Session 20)" in [Key Decisions](key-decisions.md) for the reasoning.)*
