# AI 2 Production — DESIGN.md

Working product name. 12 VENTURES is quiet chrome (eyebrow / footer), not the hero.

## One job

Get a founder with a working prototype to **request a production-readiness assessment**.

Every section either raises conviction or handles an objection. If it does neither, cut it.

## Category

Production engineering for AI-built and vibe-coded software. Not "AI development."
Not "clean up AI slop" (that's the commodity framing a competitor already owns).
The wedge: the customer already built it with AI. We make it production-ready.

"AI 2 Production" is the branded methodology (Assess → Stabilize → Harden → Deploy),
not just a service name.

## Persuasion arc

1. Hero — category instantly obvious, who it is for, primary CTA ("Start the conversation")
2. Why 12 VENTURES — team track record first (collective, not individual bios), so
   credibility lands before the argument
3. Pain — building got easy, production did not; headline + lede left, symptom quotes
   as the right-hand visual weight
4. Case — anonymized extreme, with the critical-issue count called out (16 of 33)
5. What we fix — parked for now
6. Offer + deliverable (one section, "foundation")
7. Point / transformation — from "it works" to "we can build on it"
8. How we work — Assess → Stabilize → Harden → Deploy (+ optional ongoing support)
9. Close + intake form

Cut for focus: standalone Fit section and FAQ. Aggressive fit-qualification and
objection-handling can come back as a follow-up page or the sales call itself; the
v1 goal is fewer, denser sections that build one continuous argument.

## Visual signature

- **Photography carries the metaphor** (facade vs structure). UI chrome is quiet.
- **Assessment preview is built in code**, not a fake screenshot.
- Stills: cool tungsten + concrete, muted, editorial. No text in pixels.
- One accent: warm copper `#C4A484` on near-black `#0B0C0E` / paper `#F3EEE6`.
- Display: `Fraunces` (or Georgia fallback). Body: system UI. Labels: `ui-monospace`.

## Anti-slop bans

- Inter, Roboto, Open Sans, Arial, system-ui as the *display* voice
- Purple-on-white / indigo glow / glassmorphism soup
- Pill-stat hero strips
- Three identical icon feature cards as the composition
- Stock smiling founders, laptop mockups, neon AI brains
- Dashboard screenshot collage
- Invented logos, customer names, or numbers

## Image-as-surface

Hero and case stills are full-bleed surfaces. Type sits on a scrim. Selection/frames ring the photo edge, not a card around image+caption.

## Copy rules

- Literal above the fold: `[Product] is [category] for [audience].`
- Prefer commas and periods over em dashes.
- Proof slots only: anonymized case, method, 12 VENTURES. No fake stats.
- No public price. Price scoped after intake.
- Do not name Noci.

## Locked v1 inputs

- **Name:** AI 2 Production
- **Route:** `/ai-2-production`
- **Headline:** You built it with AI. We make it production-ready.
- **CTA:** Start the conversation (nav, hero, and close all point at the same intake
  form; no separate "Request an assessment" wording anymore).
- **Intake:** Snapskill `demo-booking` API with `source_url` for this page. Fields:
  name, work email, company, built with (Cursor / Claude Code / Lovable / Replit /
  Bolt / Other), GitHub URL (optional), what's blocking production. No repo-access
  checkbox gate — access is scoped after the first call, not required to submit.
- **Assets:** `public/ai2p/*` — see ASSETS.md
