# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are small transport companies and owner-drivers in Bosnia and Herzegovina and Croatia. They come to the app in two modes: as a company that needs cargo transported (posting a cargo listing), or as a transport company/owner-driver with available vehicle capacity (posting a vehicle listing) looking for cargo to fill it. Browsing cargo/vehicle listings is public (no login); creating, editing, or managing a company profile and posts requires an account. A small admin population (marketplace operator staff) manages users and moderates posts through a separate admin area.

## Product Purpose

CargoConnect BiH is a logistics marketplace that connects companies with cargo to move to transport companies/drivers with free capacity, for the Bosnia and Herzegovina + Croatia road-freight market. Success is a fast, low-friction match: a cargo owner or a driver can post a listing, search/filter the other side, and make direct contact — without needing to learn transport-management software.

## Positioning

CargoConnect is explicitly a **connection platform, not a transport management system**. It is scoped as a focused MVP for the local market, inspired by TIMOCOM but deliberately simpler. Its meaningfully different mechanism is route-aware corridor matching: vehicle posts are matched not only on origin/destination city but on cities that fall along the vehicle's actual real-world driving route (computed via OpenRouteService + turf.js projection against a normalized city list), so a driver going from Mostar to Zagreb also surfaces for cargo waiting in Split or Karlovac along the way — matching most competitors do only via manual text search. Every new feature is judged by whether it helps users find transport or cargo faster, easier, or with more trust; features that increase marketplace liquidity (better matching, easier search, notifications, trust signals) take priority over infrastructure work unless infrastructure blocks production. Simplicity is preferred over enterprise complexity.

## Operating Context

Core workflows: register/login → create a company profile → post a cargo listing (route, date, cargo type, weight, price) or a vehicle listing (origin, optional destination, vehicle type, capacity, available-from date) → browse/search the other side with city and route filters → view a detail page (including a Leaflet route map and route-city chips for vehicle posts) → contact directly outside the app → close or let the post expire. Posts auto-expire past their date (daily cron + startup self-heal) and never appear in public browse once past-dated or expired. Owners manage everything from a "Moje objave" (My Posts) page; the whole product UI is in Croatian. Admin staff work through a separate `/admin` area (stats, user role/deletion management, cargo/vehicle post moderation, route-regeneration tooling) gated by an `admin` role.

## Capabilities and Constraints

- Two post types only: cargo posts and vehicle posts, each with a fixed lifecycle `active → closed` (owner-controlled) or `active → expired` (system-controlled only, never owner-settable).
- Route/city data is normalized (a seeded `cities` table for BA + HR) with autocomplete; free-text legacy location fields are kept only for backward compatibility, not as a primary input.
- Route-aware vehicle search depends on an external routing provider (OpenRouteService); when unavailable, matching degrades to direct origin/destination only — this must never block post creation.
- No in-app payments, contracts, messaging, or fleet/dispatch management — contact happens outside the platform (this is a deliberate scope boundary tied to the "connection platform, not TMS" positioning, not a temporary gap).
- Public browse/search requires no login (kept for low friction and SEO); creating/managing posts and company profile requires JWT auth.
- Two-tier roles only: `user` and `admin`. No intermediate permission levels.
- Terminology is Croatian-first in the UI: "Trebam prijevoz" (I need transport), "Imam vozilo" (I have a vehicle), "Pretraga" (Search), "Objavi" (Post), "Moje objave" (My Posts).

## Brand Commitments

- Product name: **CargoConnect** (repo/docs also use "CargoConnect BiH").
- UI language is Croatian throughout, including the admin area (deliberate full-localization choice made in Session 17, not partial).
- An existing visual system from the Session 17 redesign is in place: a calm, BlaBlaCar-clean, non-technical-user-friendly direction — solid backgrounds, 1–1.5px borders instead of rest-state shadows, one blue primary accent for "transport"/vehicle actions and one teal secondary accent for "cargo" actions, restrained 8/9/14/16px radii, no glassmorphism/gradients/glow. Tokens live as CSS variables in `frontend/src/index.css`. This is incumbent visual authority to preserve/extend, not to redesign by default.

## Evidence on Hand

- Full working product: 17 frontend routes (public browse/detail, auth, company profile, create/edit posts, My Posts, Profile, 4 admin pages, home page) backed by a complete NestJS API — this is a real, running MVP, not a concept.
- 49 seeded real cities across BA + HR with coordinates, used for autocomplete and route corridor matching.
- No real customer testimonials, logos, press, or case studies exist yet — future work must not fabricate them.
- No production deployment yet (local dev only, migrations exist but nothing is deployed) — do not assume a live production URL or real end-user traffic/analytics exist.

## Product Principles

1. Every feature must help someone find transport or cargo faster, easier, or with more trust — liquidity over infrastructure, unless infrastructure blocks production.
2. Stay a connector, not a TMS: resist scope creep into fleet management, invoicing, dispatch, or in-app payments.
3. Low friction wins: public browse without login, simple two-status-transition lifecycle, autocomplete over free text.
4. Route-aware matching (real driving corridors, not just endpoint cities) is the product's actual differentiator and should be extended/highlighted before other features compete for attention.
5. Simplicity over enterprise complexity, always — the target user is a small operator or owner-driver, not a logistics department.
