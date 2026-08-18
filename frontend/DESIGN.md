---
name: CargoConnect
description: Calm, border-led B2B logistics marketplace UI for non-technical transport operators in Bosnia & Herzegovina and Croatia.
colors:
  calm-paper: "oklch(97.5% 0.004 95)"
  surface-white: "#ffffff"
  border-hairline: "oklch(90% 0.006 95)"
  border-strong: "oklch(88% 0.006 95)"
  border-dashed: "oklch(85% 0.006 95)"
  ink-primary: "oklch(18% 0.01 95)"
  ink-secondary: "oklch(46% 0.012 95)"
  ink-muted: "oklch(60% 0.01 95)"
  route-blue: "oklch(51% 0.16 258)"
  route-blue-hover: "oklch(45% 0.16 258)"
  route-blue-soft: "oklch(95% 0.03 258)"
  cargo-teal: "oklch(45% 0.09 195)"
  cargo-teal-hover: "oklch(39% 0.09 195)"
  cargo-teal-soft: "oklch(94% 0.04 195)"
  chip-neutral-bg: "oklch(96% 0.01 95)"
  chip-neutral-text: "oklch(38% 0.012 95)"
  success: "#16a34a"
  success-bg: "#dcfce7"
  success-border: "#bbf7d0"
  danger: "#dc2626"
  danger-hover: "#b91c1c"
  danger-bg: "#fef2f2"
  danger-border: "#fecaca"
  warning-bg: "#fef9c3"
  warning-text: "#a16207"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "9px"
  lg: "14px"
  xl: "16px"
  pill: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.route-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.route-blue-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-teal:
    backgroundColor: "{colors.cargo-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-teal-hover:
    backgroundColor: "{colors.cargo-teal-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "9px 19px"
  button-secondary-hover:
    backgroundColor: "{colors.chip-neutral-bg}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "9px 19px"
  button-danger:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "9px 19px"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "40px"
---

# Design System: CargoConnect

## Overview

**Creative North Star: "The Calm Ledger"**

CargoConnect reads like a trustworthy paper record, not a dashboard trying to impress you: flat surfaces, hairline borders instead of resting shadows, generous but not loose whitespace, and a strict two-accent vocabulary (Route Blue for transport, Cargo Teal for cargo) that never bleeds outside its lane. The system was built for a non-technical B2B user — small transport companies and owner-drivers in Bosnia & Herzegovina and Croatia — who needs to scan a route, a date, and a price in seconds, not admire the interface. Density is moderate: public list/detail pages breathe with card layouts and 20–24px padding; admin screens compress into dense, bordered tables because operators there are scanning many rows, not browsing.

The system deliberately rejects glassmorphism, gradients (with one narrow exception — the home hero's near-invisible paper-to-bg wash), glow, heavy drop shadows, and decorative motion. Depth is communicated through borders and subtle background-tint shifts, not elevation. Where a shadow does appear, it is a near-invisible resting cue (`--shadow-card`) or a deliberate hover response — never a default surface treatment.

**Key Characteristics:**
- Flat, hairline-bordered surfaces; shadow is earned on hover, not given at rest.
- Exactly two accents — Route Blue (transport/vehicle) and Cargo Teal (cargo) — each with a hover and a "soft" tint step, never mixed on the same action.
- One typeface family throughout (system sans stack); hierarchy comes from size/weight, not font-switching.
- Restrained, consistent radius scale (8/9/14/16px) — nothing sharp, nothing pill-shaped except true pills (status badges, chips, the user-menu trigger).
- Croatian-first copy; UI chrome (labels, buttons, empty states) is never left in English.

## Colors

The palette is a near-neutral warm-gray paper base with exactly two saturated accents, each scoped to a domain meaning rather than decoration.

### Primary
- **Route Blue** (`oklch(51% 0.16 258)`): the transport/vehicle accent. Primary buttons on vehicle-flow actions, active nav state, links, focus rings, the origin/first-step markers in route UI. Also the app's single default focus-ring color regardless of context.

### Secondary
- **Cargo Teal** (`oklch(45% 0.09 195)`): the cargo accent. Primary buttons on cargo-flow actions ("Objavi teret"), cargo icon badges, cargo-card accents. Never used for focus rings or links — those stay Route Blue even on cargo screens, so the two accents never compete for the same job.

### Neutral
- **Calm Paper** (`oklch(97.5% 0.004 95)`): page background (`--color-bg`).
- **Surface White** (`#ffffff`): card, form, table, and dropdown surfaces (`--color-surface`).
- **Border Hairline** (`oklch(90% 0.006 95)`): the default 1px card/table/navbar border (`--color-border`).
- **Border Strong** (`oklch(88% 0.006 95)`): input borders, secondary-button borders, mobile toggle border.
- **Border Dashed** (`oklch(85% 0.006 95)`): empty-state dashed border only.
- **Ink Primary** (`oklch(18% 0.01 95)`): headings and primary text (`--color-text-primary`).
- **Ink Secondary** (`oklch(46% 0.012 95)`): supporting copy, subtitles, meta text (`--color-text-secondary`).
- **Ink Muted** (`oklch(60% 0.01 95)`): placeholders, disabled text, timestamps, empty-state copy (`--color-text-muted`).

### Semantic
- **Success** (`#16a34a` on `#dcfce7`, border `#bbf7d0`): active status badge, success alerts, route-match banners.
- **Danger** (`#dc2626` on `#fef2f2`, border `#fecaca`; hover `#b91c1c`): destructive actions, error alerts, field errors.
- **Warning** (text `#a16207` on `#fef9c3`): expired status badge only.

### Named Rules
**The Two-Accent Rule.** Only Route Blue and Cargo Teal ever act as a saturated accent. A new feature that needs "a third color" should reach for a neutral or semantic tone (success/danger/warning) before inventing a new hue — the whole visual identity depends on the accent count staying at two.

**The Domain-Locked Accent Rule.** Blue means transport/vehicle, teal means cargo. Never swap them for a single screen's sake (e.g. a teal primary button on a vehicle-post form) — the color is how a scanning user tells the two flows apart across the whole app, including icon badges and nav dropdown item colors.

## Typography

**Body Font:** system sans stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`) — no custom webfont is loaded anywhere in the project.

**Character:** A single, neutral system stack carrying the entire hierarchy through size and weight alone. This is a deliberate "get out of the way" choice consistent with the Calm Ledger metaphor — the typeface should never be the thing a user notices.

### Hierarchy
- **Display** (700, 44px / 30px on mobile ≤640px, line-height ~1.15, letter-spacing -0.02em): the home hero headline only. The one place type is allowed to be loud.
- **Headline** (700, 26px, letter-spacing -0.01em): page `<h1>` titles across every page.
- **Title** (700, 18px for `<h2>`; 700, 15.5px for `<h3>` as a smaller step of the same role): section and card headings (form-card headers, dashboard card titles, detail-card headings).
- **Body** (400, 15px, line-height 1.6): default running text, the global `body` baseline.
- **Label** (700, 11–13px, uppercase, letter-spacing 0.04–0.06em): field labels, table column headers, form section dividers ("RUTA", "DETALJI TERETA"). Always uppercase, always `--color-text-muted` or `--color-text-secondary`, never used for anything a user needs to read at length.

### Named Rules
**The One Voice Rule.** The entire app uses one font family. A future request for a "display font" or "brand typeface" is a deviation from the established system and should be confirmed explicitly before introducing a second family.

## Layout

Three fixed-width container patterns, chosen by page density rather than a fluid grid: `.page-container` (1200px, browse/list/admin pages), `.page-container-narrow` (920px, detail pages), `.page-container-form` (680px, single-form pages like create/edit/profile). All three center with `margin: 0 auto` and share the responsive padding step (32px 24px desktop → 20px 16px 48px at ≤640px).

Card-based collections (`.result-list`, dashboard grid, post cards) use `flex-direction: column` with a consistent 12–16px gap rather than a CSS grid, except the dashboard action grid and filter grid, which use `repeat(auto-fit/auto-fill, minmax(...))` to reflow responsively without manual breakpoints. Admin pages are the deliberate exception to card-based layout: they keep `.data-table`/`.table-wrapper` because operators there scan many rows at once — do not convert admin tables to cards.

Two responsive breakpoints govern the whole system: **860px** (navbar collapses to a hamburger + mobile drawer; login link hides) and **640px** (forms/filters stack to one column, hero and route-map shrink, page padding tightens). There is no intermediate tablet breakpoint.

## Elevation & Depth

The system is **flat by default; borders carry the resting state, shadows are a response to state or explicit emphasis.** Most surfaces (`.form-card`, `.dashboard-card`, `.detail-card`, `.result-card`, `.post-card`, `.filter-card`, `.data-table`) carry only a 1px `--color-border` hairline and no shadow at all at rest. A small number of "elevated" surfaces (`.auth-card`, `.cta-card`) carry a near-invisible resting shadow (`--shadow-card`) alongside their border — this is the one deliberate exception, reserved for surfaces that need to feel slightly lifted off the page (auth, the home hero's two big choice cards). Dropdowns and the mobile drawer use a heavier `--shadow-dropdown` because they are genuinely floating above content, not sitting on the page.

### Shadow Vocabulary
- **Card (resting)** (`0 1px 2px oklch(0% 0 0 / 0.04)`): auth card, home hero CTA cards at rest. Not used on ordinary content cards.
- **Hover — Blue** (`0 8px 20px oklch(51% 0.16 258 / 0.12)`): hover state on the "Trebam prijevoz" home CTA card.
- **Hover — Teal** (`0 8px 20px oklch(45% 0.09 195 / 0.12)`): hover state on the "Imam vozilo" home CTA card.
- **Dropdown** (`0 12px 28px oklch(0% 0 0 / 0.12), 0 2px 6px oklch(0% 0 0 / 0.06)`): nav dropdown panels, city autocomplete dropdown, mobile drawer.

### Named Rules
**The Border-First Rule.** A new content card gets a 1px `--color-border` border and no shadow, full stop. Reach for `--shadow-card` only for genuinely elevated single-purpose surfaces (auth, hero choice cards), and for `--shadow-dropdown` only for floating/overlay panels. Never add a resting shadow to a list card, table, or form card just for visual weight.

## Shapes

Four radius steps plus a true pill, applied by role rather than by component size: **8px** (`--radius-sm`) for the tightest interactive controls — inputs, small buttons, nav items, pagination buttons. **9px** (`--radius-md`) for standard buttons and dropdown menu items — just enough more than `sm` to read as "clickable action" vs. "input field." **14px** (`--radius-lg`) for content cards, form cards, table containers, dropdown panels — the system's default "container" radius. **16px** (`--radius-xl`) reserved for the home hero's large CTA cards and their icon tiles, the single most prominent surfaces in the app. **Pill** (`9999px`) for status badges, the "matches route" chip, the user-menu trigger, and icon-circle step numbers — anything meant to read as a token or a person, not a container.

Borders are 1–1.5px throughout (never 2px+ except the 2.5px focus-visible outline). No component uses a border on more than one side selectively — borders are either whole-perimeter or a single divider rule (`border-top`/`border-bottom` on section dividers, table rows, drawer items).

## Components

### Buttons
- **Shape:** `--radius-md` (9px) for all standard buttons; `--radius-sm` (8px) for the compact `.btn-primary-small` variant used inline in tables/cards.
- **Primary (transport):** Route Blue background, white text, `10px 20px` padding, 14px/600 label. Hover darkens to Route Blue Hover; disabled fades to a desaturated blue tint — no opacity trick, a genuinely lighter blue.
- **Primary Teal (cargo):** identical shape/padding to Primary, Cargo Teal background instead. The two primary variants are never mixed on the same screen for the same action type.
- **Secondary:** white background, 1.5px `--color-border-strong` border, `--color-text-primary`-adjacent text. Hover fills with a barely-there neutral tint (`oklch(96% 0.005 95)`), never a border-color change alone.
- **Danger (outline) / Danger Solid:** outline variant (white bg, danger-colored border+text) is the default for destructive actions inline with other buttons, so it doesn't visually out-compete Edit/Close; the solid danger fill is reserved for confirmation-dialog "yes, delete" actions.
- **Link:** no background/border, `--color-text-secondary`, darkens to `--color-text-primary` on hover. Used for "back" links and lightweight inline actions.

### Chips
- **Neutral chip:** `--color-chip-bg` background, `--color-chip-text` text, `--radius-sm`, used for type tags (cargo type, vehicle type) on result cards.
- **Match chip (pill):** success-green background/text, `--radius-pill`, used only for "Odgovara traženoj ruti" (matches route) — the one chip that is a positive signal rather than a neutral tag.
- **Route-city chip (pill):** neutral by default, switches to a Route-Blue-soft background + blue text + blue-tinted border when it represents a route endpoint (origin/destination), so the eye finds the two endpoints instantly in a row of intermediate cities.

### Cards / Containers
- **Corner Style:** `--radius-lg` (14px) for nearly every card type; `--radius-xl` (16px) reserved for home hero CTA cards.
- **Background:** `--color-surface` (white) on `--color-bg` (calm paper) page background — the card-vs-page contrast is the only "elevation" cue most surfaces get.
- **Shadow Strategy:** none at rest except auth/hero cards (see Elevation & Depth); hover shadow only on the two home hero CTA cards.
- **Border:** 1px (`.detail-card`, `.form-card`, etc.) or 1.5px (`.cta-card`) `--color-border`.
- **Internal Padding:** 18–28px depending on density — post/result cards run tighter (18–22px), form/detail/dashboard cards run looser (24–28px).

### Inputs / Fields
- **Style:** white background, 1px `--color-border-strong` border, `--radius-sm` (8px), 40px minimum height, 10px/12px padding.
- **Focus:** border shifts to Route Blue plus a soft 3px Route-Blue-tinted glow (`box-shadow: 0 0 0 3px oklch(51% 0.16 258 / 0.12)`) — the same blue used for the global `:focus-visible` outline, so focus always reads the same regardless of control type.
- **Disabled:** background steps to a barely-different paper tone, text mutes to `--color-text-muted`.
- **Error:** field-level error text in danger red, 12.5px, directly under the field — no red border on the input itself.

### Navigation
- **Style:** sticky top navbar, white surface, 68px fixed height, 1px bottom border. Nav items are 14px/500, `--radius-sm`, transparent by default; the active route gets a permanent Route-Blue-soft background + blue text + weight 600 — the same "soft accent fill" treatment used for active states everywhere else in the system (not just navigation).
- **Dropdowns (Pretraga / Objavi / user menu):** float in a white `--radius-lg` panel with `--shadow-dropdown`, each item showing a colored icon tile (blue or teal per domain) next to a title/description pair — this two-line item pattern is a signature of the nav dropdowns specifically and should not be reused for simple single-line menus.
- **Mobile:** navbar center collapses under 860px into a hamburger; the mobile drawer reuses the same active-state soft-fill convention and expands Pretraga/Objavi as an indented inline sub-list rather than a floating panel.

### Status Badge (signature component)
A small pill (`--radius-pill`) with a semantic background/text pair and no border: active = success green, closed = neutral chip gray, expired = warning amber. This is the one place in the system where a status is communicated by color alone (no icon), and the three states are the only three that should ever exist — do not add a fourth ad-hoc status color without updating this component.

## Do's and Don'ts

### Do:
- **Do** border every card/table/panel with 1px `--color-border` and skip the shadow, unless it's one of the named exceptions (auth card, hero CTA cards, dropdowns).
- **Do** keep every accent use domain-locked: Route Blue for transport/vehicle, Cargo Teal for cargo, never swapped for visual variety.
- **Do** use the `--radius-*` scale by role (sm=control, md=button, lg=container, xl=hero-only, pill=token/status) rather than picking a radius by eye.
- **Do** write all user-facing UI copy in Croatian, including admin screens — this was a deliberate full-localization decision, not a partial one.
- **Do** use the soft-accent-fill pattern (`{accent}-soft` background + `{accent}` text) for "active/selected" states across nav items, dropdown icon tiles, and route-endpoint chips — it's the system's one repeated way of saying "this is the current/important one."

### Don't:
- **Don't** introduce a third saturated accent color. Reach for a neutral or a semantic (success/danger/warning) tone first.
- **Don't** add gradients, glassmorphism, glow, or heavy drop shadows anywhere — the one sanctioned gradient is the home hero's near-invisible paper wash, not a pattern to extend.
- **Don't** give a list/table/form card a resting shadow "for polish." Borders carry rest state in this system; shadow is earned by hover or by being a genuinely floating/overlay surface.
- **Don't** reach for a second typeface for "brand personality" — the one-voice system-sans stack is deliberate; hierarchy comes from size/weight only.
- **Don't** convert the admin data tables to card layouts to match the public pages — density there is intentional and serves a different (scanning-many-rows) job.
