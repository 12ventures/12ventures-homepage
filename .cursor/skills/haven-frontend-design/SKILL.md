---
name: haven-frontend-design
description: >-
  Design and implement Haven UI, the AI-native shopping and inspiration
  engine for interiors. Use when building or polishing Haven pages, room
  staging, style chips, product rails, or visual commerce flows at /haven.
---

# Haven Frontend Design

Grounded in Anthropic `frontend-design`, anti-slop DESIGN.md practice, and Haven’s product brief: **curate, don’t design**. Pinterest-visual, commerce-backed.

## When this skill applies

Any UI work under `components/haven/`, route `/haven`, or copy about room styling / product shopping for Haven.

## Process (do this every time)

1. Read [`components/haven/DESIGN.md`](../../../components/haven/DESIGN.md) and [`PRODUCT.md`](../../../components/haven/PRODUCT.md).
2. State the screen’s **one job** before coding.
3. Self-critique against the bans below; revise if it looks like generic AI UI.
4. Build from tokens in `haven.css`. Do not invent one-off palettes.
5. Prefer mock data behind `HavenClient` seams; never hardwire fake network calls into presentational components.

## Product UX rules

- People want “make my room look like Amber Interiors / show me options / where do I buy,” not “AI interior design.”
- Prompt framing in UI copy: **Transform this room into [Style] using furniture inspired by…** Never “Generate a design.”
- Avoid em dashes in product copy. Prefer commas, periods, or colons.
- Almost entirely visual: large room image first, scrollable style chips, shopping cards. Very little text.
- Expose **6 style personalities** only. Brand clusters stay internal.
- Week‑1 flow: Upload → Style → Styled room → Design decisions → Products / Buy.
- Week‑2/3 stubs may show hotspots / chat affordances but must not pretend they work.

## Hard bans (AI slop)

- Fonts: Inter, Roboto, Open Sans, Arial, system-ui as the display voice
- Looks: purple-on-white / purple-indigo gradients; warm cream `#F4F1EA` + terracotta + serif cluster; broadsheet hairline newspaper layouts
- Chrome: glassmorphism soup, multi-layer neon glow, pill-stat strips in the hero, three identical feature cards as the composition
- Dashboard aesthetics on this product (KPI grids, dense tables as the first viewport)
- Eyebrow-label + marketing fluff as primary UI (“Operational clarity…”)

## Required quality floor

- One composition in the first viewport (room stage + chips + one CTA)
- Brand “Haven” is a hero-level signal, not only nav text
- Mobile + desktop; keyboard focus visible; `prefers-reduced-motion` respected
- 2–3 intentional motions max per screen (entrance, generate progress, product reveal)

## Signature

Photographic room as the thesis. Everything else is quiet scaffolding for curation and purchase.

## Image-as-surface (never forget)

When a control’s job is choosing/showing a look and it has a photo, **the image is the card**:
- Photo fills the tile; label overlays (scrim), not caption under a shared border
- Selection rings the photo edge — never a box around image+text stacked
- Same rule for admin style picker, room-set cards, product tiles

See `.cursor/rules/image-as-surface.mdc` and `DESIGN.md` → Components.
