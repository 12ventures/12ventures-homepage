# Haven PRODUCT.md

## One-liner

Shop curated room looks with pins — or (rarely) restyle your own photo with AI.

## Product model

Two modes:

1. **Curated room sets (default, free)** — Finished room image + shoppable hotspots + products. No AI cost. **Use demo room** → `GET /demo-room`.
2. **Custom generate (credits / rare)** — Upload room → `POST /jobs` → styled image + products + hotspots.

A room set is the shoppable look: `imageUrl`, `hotspots[]` (x/y 0–100%), `products`, `tags[]`, `styleId`.

**Stage rule:** set CSS `aspect-ratio` from `aspectRatio` (or width/height). Prefer 16:9. Do **not** `object-fit: cover` into a different ratio or pins drift.

## Suggested /haven IA

Primary flow (same for both entry points):

1. **Choose photo** — upload → pick style → Generate → AI job (`POST /uploads` + `/jobs`)  
2. **Use demo room** — same UI: load preset from `GET /demo-room` → pick style → Generate → reveal a curated room set for that style (`GET /room-sets?styleId=` / fallback `/demo-room`). No AI job.

Out of scope (stubs): chat-with-room, Good/Better/Best, auth, swipe quiz. Browse-by-cards can come later.

## Style map (UI → internal brands — do not expose brands as primary UI)

| Style | Inspired by (internal) |
|-------|------------------------|
| Organic Modern | Lulu & Georgia, Jenni Kayne, Amber Interiors |
| Modern | CB2, Four Hands |
| Scandinavian | Article, West Elm, DWR |
| Traditional | Pottery Barn, RH, Arhaus |
| Luxury | Minotti, B&B Italia |
| Eclectic | Anthropologie, Jonathan Adler |

## API seam

`HavenClient` in `api/havenClient.ts` → `HttpHavenClient` by default.

Base: `{VITE_MLKCH_API_URL}/twelve-ventures/haven`  
(same Twelve Ventures host as MLKCH; local `http://localhost:8000/api/v1`).

Envelope: `{ success, message, data }` — use `data`.

### Consumer

- `GET /room-sets?styleId=&tag=` → curated looks with images  
- `GET /room-sets/{id}` → set + products  
- `GET /demo-room` → featured (or first) set detail; 404 if none  
- `GET /styles` → style chips  
- `POST /uploads` · `POST /jobs` · `GET /jobs/{id}` — paid generate path  

Set `VITE_HAVEN_USE_MOCK=true` for the offline mock client.

### Admin (`/haven/admin`)

1. Seed styles (`POST /admin/styles/seed`)  
2. Import products + fix images (required for generate)  
3. Create room set with `autoGenerate: true` → poll until ready → feature  

Aspect ratio is always `16:9`.  
One-click: `POST /admin/room-sets/auto` `{ styleId }` — LLM curates products/label then generates.  
Manual create still accepts productIds + `autoGenerate`. Response: `{ roomSet, generateJob? }`.  
Poll `GET /admin/room-sets/{id}` or `GET /admin/room-set-jobs/{jobId}` (~2s).  
Regenerate: `POST /admin/room-sets/{id}/generate`.  
Manual image/hotspot endpoints remain advanced overrides only.

## Smoke checklist

1. Seed styles  
2. Import products with images  
3. Admin: create room set → upload image → place hotspots → `featured: true`  
4. Consumer: Use demo room / browse — pins line up on 16:9 stage  
5. Optional: Restyle my room still works via upload + jobs  
