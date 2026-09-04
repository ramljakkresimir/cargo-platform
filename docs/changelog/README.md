# Session Changelog

Detailed, session-by-session implementation history. Each file covers a contiguous range of sessions in chronological order.

- [Sessions 1–10](sessions-01-10.md) — initial MVP, monorepo setup, My Posts, pagination, profile page, admin panel, post-closing, auto-expiry cron
- [Sessions 11–17](sessions-11-17.md) — normalized cities + autocomplete, route-city corridor matching, route map visualization, past-date validation, expiration self-heal, full visual redesign + Croatian localization
- [Sessions 18–19](sessions-18-19.md) — full code-review remediation (HIGH/MEDIUM/LOW findings), lint cleanup, production TypeORM migrations
- [Sessions 20–23](sessions-20-23.md) — email verification/password reset/CAPTCHA/rate limiting, admin company-profile + bulk-close-expired + home page preview, redesigned search/listing pages with city-distance cache, in-app chat/messaging
- [Session 24](sessions-24.md) — user ratings (1–5 stars), reusable star display/picker components, shown on profile, listing detail pages, and search result cards
- [Session 25](sessions-25.md) — fixed a star-fill rendering bug (flex-shrink squish caused a smeared tint instead of a clean split) and replaced the button-gated rating form with an always-visible, immediately-submitting inline star input
- [Session 26](sessions-26.md) — redesigned vehicle/cargo detail pages around a shared `components/detail/` kit (route-headline header, fact tiles, sticky map/contact/rating layout, cities stepper, masked-contact reveal, mobile sticky action bar); added real driving-route geometry for cargo posts; fixed a pre-existing mobile dropdown-positioning bug the redesign's reuse of `NavDropdown` exposed
- [Session 27](sessions-27.md) — redesigned the home page "how it works" section from two Claude Design handoffs (desktop 3-column mockups + dotted connectors; a separate vertical-timeline design for tablet/mobile at the project's existing 1024px breakpoint); fixed the connector geometry to span exact card-to-card edges via `calc()`; fixed a pre-existing hero left-edge misalignment against the rest of the page

See [TODO / Next Steps](../todo.md) for the current open/closed feature checklist.
