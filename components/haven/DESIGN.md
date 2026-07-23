---
product: Haven
route: /haven
updated: 2026-07-23
sources:
  - Anthropic frontend-design skill (distinctive identity, anti-template critique)
  - DESIGN.md / anti-slop practice (tokens + bans before build)
  - Haven MVP brief (Pinterest-visual, 6 personalities, curate not design)
---

# Haven DESIGN.md

## Intent

Editorial interiors commerce. Feels like a calm design magazine crossed with a shopping feed, not a SaaS dashboard and not a toy “AI render” gimmick.

**Signature:** the room photograph is the page.

## Palette

| Token | Hex | Role |
|-------|-----|------|
| `--hv-stone` | `#F4F2EE` | Page ground (cool stone, not cream cliché) |
| `--hv-ink` | `#1C1917` | Primary text / UI chrome |
| `--hv-ink-soft` | `#57534E` | Secondary text |
| `--hv-mist` | `#E7E5E4` | Borders / tracks |
| `--hv-paper` | `#FFFcf8` | Elevated surfaces |
| `--hv-sage` | `#5F6F52` | Single accent (CTAs, selected chip) |
| `--hv-sage-soft` | `#E8EDE4` | Accent wash |
| `--hv-oak` | `#A68A64` | Warm photographic bridge (sparingly) |

Dark overlays on photos: `rgba(28, 25, 23, 0.45)` max — never neon.

## Typography

| Role | Family | Notes |
|------|--------|-------|
| Display | `Fraunces` | Soft optical size, high contrast for “Haven” + headlines |
| Body | `Figtree` | Clean geometric sans — not Inter |
| Utility | `Figtree` | Labels, chips, prices — medium weight, tracked slightly |

Scale (approx): display 2.5–3.5rem; section 1.25rem; body 0.9375–1rem; meta 0.75rem.

## Layout

- Max content width ~1200px; room stage can go edge-to-edge on large screens
- 8px spacing rhythm
- Radius: 12px controls, 16–20px media; avoid pill-everything
- First viewport: brand + one line + upload/stage + style chips + one CTA — no stats strip

## Motion

1. Stage / brand fade-up on load (~500ms)
2. Generate: thin progress bar + soft stage crossfade
3. Product cards: short staggered fade (≤120ms steps)

No continuous glow. Honor `prefers-reduced-motion`.

## Components

- **Style chips:** horizontal scroll, selected = sage fill + ink text; unselected = paper + mist border
- **Shopping cards:** image-led, merchant + price, single “Buy” action — not dense product tables
- **Design notes:** short curator bullets, not paragraphs

## Copy voice

Active, specific, designer-like: “We swapped the dark leather sofa for low-profile linen…”  
Never: “Leverage AI to revolutionize your space.”  
Avoid em dashes. Prefer commas, periods, or colons for a calm, editorial tone.
