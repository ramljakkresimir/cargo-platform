# Session Changelog

Detailed, session-by-session implementation history. Each file covers a contiguous range of sessions in chronological order.

- [Sessions 1–10](sessions-01-10.md) — initial MVP, monorepo setup, My Posts, pagination, profile page, admin panel, post-closing, auto-expiry cron
- [Sessions 11–17](sessions-11-17.md) — normalized cities + autocomplete, route-city corridor matching, route map visualization, past-date validation, expiration self-heal, full visual redesign + Croatian localization
- [Sessions 18–19](sessions-18-19.md) — full code-review remediation (HIGH/MEDIUM/LOW findings), lint cleanup, production TypeORM migrations
- [Sessions 20–23](sessions-20-23.md) — email verification/password reset/CAPTCHA/rate limiting, admin company-profile + bulk-close-expired + home page preview, redesigned search/listing pages with city-distance cache, in-app chat/messaging
- [Session 24](sessions-24.md) — user ratings (1–5 stars), reusable star display/picker components, shown on profile, listing detail pages, and search result cards
- [Session 25](sessions-25.md) — fixed a star-fill rendering bug (flex-shrink squish caused a smeared tint instead of a clean split) and replaced the button-gated rating form with an always-visible, immediately-submitting inline star input

See [TODO / Next Steps](../todo.md) for the current open/closed feature checklist.
