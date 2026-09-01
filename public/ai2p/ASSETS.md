# AI 2 Production — asset handoff

Drop generated stills into `public/ai2p/` using these exact filenames. Placeholders keep layout stable until then.

Shared look: photographic, cool tungsten + concrete, deep shadow, muted, editorial. **No text, logos, or readable UI in the pixels.**

| File | Ratio | Generate size | Section |
| --- | --- | --- | --- |
| `hero-facade.png` (or `.webp`) | 16:9 | 1920×1080+ | Hero full-bleed |
| `cutaway-foundation.png` | 3:2 | 1800×1200 | Blind-spot section |
| `agents-blindspot.png` | 21:9 | 2520×1080 | Full-width band |
| `case-surface.png` | 4:5 | 1640×2050 | Anonymized case |
| `paper-grain.png` | 1:1 tile | 1024×1024 | How-we-work + preview overlay |
| `og-share.jpg` | 1.91:1 | 1200×630 | Open Graph |

v1 ships with generated PNG stills in this folder. Replace anytime without code changes (keep the filename the page references).

## Prompts

### hero-facade
Editorial architectural photograph of a newly finished commercial storefront at dusk, smooth pale stone facade, large dark glass, looks expensive and complete, shot from across the street slightly below eye level, cinematic widescreen, deep shadows, cool concrete and warm tungsten interior glow leaking through glass, no people, no cars in focus, no signage, no logos, no letters, no neon, photoreal, 35mm, shallow depth, muted filmic color, high detail stone texture. Leave the left 40% a little darker / less busy for type.

### cutaway-foundation
Photoreal architectural cutaway of the same kind of finished commercial facade: left half pristine stone and glass looking complete, right half opened like a construction section drawing in real materials, exposed timber, rebar, uneven wiring, a hairline crack in a load-bearing beam, dust in a shaft of light, no people, no hard hats as the subject, no text, no logos, no blueprint overlay graphics, museum-quality photograph, cool daylight, documentary, 50mm

### agents-blindspot
Wide cinematic still, slightly surreal but photoreal, a long interior corridor of a finished building, ten identical anonymous inspectors in the same plain dark work coat, faces not readable, all examining the polished wall surface with flashlights, none looking down at a large structural crack in the floor at the edge of the frame, empty and quiet, no faces in focus, no brands, no text, cool concrete, single tungsten practical light, editorial photography, 35mm anamorphic feel, muted

### case-surface
Quiet luxury fashion or interiors retail floor, empty of people, beautiful merchandising, warm wood and linen, natural window light, looks like a real store that could launch tomorrow, photoreal editorial, no logos, no readable labels, no faces, no mannequin faces in focus, no screens, no laptops, slightly imperfect dust in light, 50mm, muted earth and stone palette, not stock catalog cheerful

### paper-grain
Seamless tileable fine paper grain and faint concrete dust texture, almost neutral, no pattern, no watermark, no text, high resolution, photographic scan of heavy uncoated paper mixed with micro-scratches, low contrast, usable as an overlay

### og-share
Same as hero-facade, but subject centered for a small thumbnail, storefront filling the frame, dusk, no text, no logo. Export 1200×630 JPEG.
