# Architecture & Technology

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
│       ├── auth/             Register, login, email verification, password reset, JWT strategy, guard
│       │   ├── decorators/   @Roles() decorator
│       │   ├── dto/          Register/Login/VerifyEmail/ResendVerification/ForgotPassword/ResetPassword DTOs
│       │   └── guards/       JwtAuthGuard, RolesGuard
│       ├── users/            User entity (+ email-verification / password-reset / failed-login columns) + service
│       ├── companies/        Company profile CRUD
│       ├── cargo-posts/      Cargo post CRUD + search
│       ├── vehicle-posts/    Vehicle post CRUD + search
│       ├── admin/            Admin CRUD for users/posts (role-protected)
│       │   └── dto/          AdminUsersQueryDto, AdminPostsQueryDto, UpdateUserRoleDto, UpdatePostStatusDto
│       ├── cities/           City entity, CitiesService, CitiesController (GET /cities, POST /cities/distances)
│       │   └── dto/          FilterCitiesDto, CityDistancePairsDto
│       ├── routing/          Route-city generation module + city-pair distance cache
│       │   ├── vehicle-post-route-city.entity.ts   Join table: which cities a vehicle route passes through
│       │   ├── openroute.service.ts                OpenRouteService API client (driving-hgv)
│       │   ├── routing.service.ts                  Abstraction over routing providers
│       │   ├── route-city.service.ts               Projection + persistence + route-aware search helper
│       │   ├── city-distance.entity.ts             Cached road-distance lookup between a city pair (Session 22)
│       │   ├── city-distance.service.ts            Batched, cached, order-insensitive distance resolver (Session 22)
│       │   └── routing.module.ts                   Exports RouteCityService, RoutingService, CityDistanceService
│       ├── posts-expiration/ PostsExpirationService — daily cron + manual trigger
│       ├── messaging/         In-app chat — Conversation/Message entities, ConversationsService/Controller (Session 23)
│       ├── common/
│       │   ├── enums/        Shared PostStatus enum
│       │   ├── dto/          Shared PaginationDto
│       │   ├── captcha/      CaptchaService — server-side Cloudflare Turnstile verification
│       │   ├── mail/         MailService — nodemailer, console-log fallback in development only
│       │   ├── guards/       LoggingThrottlerGuard — logs rate-limit triggers
│       │   ├── validators/   IsNotCommonPassword — common-password denylist validator
│       │   ├── utils/        token.util.ts — secure random token generation + SHA-256 hashing
│       │   └── filters/      GlobalExceptionFilter (consistent error shapes)
│       ├── app.module.ts     Root module wiring (includes ScheduleModule.forRoot())
│       └── main.ts           Bootstrap, CORS, ValidationPipe with exceptionFactory
│
└── frontend/                 Vite + React app (port 5173)
    └── src/
        ├── context/          AuthContext (JWT + user state), ChatContext (open conversation + unread badge, Session 23)
        ├── services/         Axios API clients per resource (+ admin.service, cities.service with getDistances, conversations.service Session 23)
        ├── components/       Navbar (+ NavDropdown), ProtectedRoute, AdminRoute, CityAutocomplete, Icons, StatusBadge, EmptyState, RouteMap, Turnstile, CompanyAvatar (Session 22)
        │   ├── search/       Shared vehicles/cargo search-page kit (Session 22) — SearchPageHeader, SearchFilterBar, SearchResultsBar, ResultCard, types.ts
        │   └── chat/         ChatDrawer — slide-in chat window, opened via ChatContext (Session 23)
        ├── hooks/             useCityDistances — batches+caches "~ X km" lookups for a page of result cards (Session 22)
        ├── constants/        postTypes.ts — shared Croatian cargo/vehicle type label maps
        ├── pages/            HomePage (+ recent listings preview, Session 21) + ConversationsPage (Session 23) + 15 regular pages (incl. VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage) + 5 admin pages
        │   └── admin/        AdminDashboardPage, AdminUsersPage, AdminUserCompanyPage, AdminCargoPostsPage, AdminVehiclePostsPage
        ├── utils/            errorUtils.ts — extractErrorMessage / extractFieldErrors helpers; dateUtils.ts — local-date helpers + formatPostedAt (Session 22)
        └── types/            Shared TypeScript interfaces (City added, CargoPost/VehiclePost updated; Conversation/ChatMessage added Session 23)
```
