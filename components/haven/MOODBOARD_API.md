# Haven Moodboards — Backend API Handoff

Base: `{VITE_MLKCH_API_URL}/twelve-ventures/haven`  
Envelope: `{ success: boolean, message?: string, data: T }`  
Auth: same as other `/admin/*` routes.

## Product rules

- Moodboards are **standalone**.
- Optional link to a room set via `roomSetId`.
- Before a room set exists (Design Myself), link via **`pendingStudioDraftId`** (client UUID).
- On `POST /admin/room-sets/studio` with `studioDraftId`, **claim** moodboards where `pendingStudioDraftId === studioDraftId` → set `roomSetId`, clear pending.
- Unlink clears association; does not delete the board.
- Many moodboards may link to one room set (v1: no primary flag required).

## Endpoints

### List

`GET /admin/moodboards`

Query: `styleId?`, `roomSetId?`, `pendingStudioDraftId?`, `limit?`, `cursor?`

`data`: `{ items: MoodboardCard[], nextCursor?: string | null, hasMore?: boolean }`

### Create

`POST /admin/moodboards`

```json
{
  "name": "Modern Coastal",
  "styleId": "organic_modern",
  "roomSetId": null,
  "pendingStudioDraftId": "uuid-from-studio-session",
  "boardAspectRatio": "4:3",
  "palette": null,
  "items": []
}
```

Rules:

- If `roomSetId` set → store it, clear pending.
- Else if `pendingStudioDraftId` set → store pending.
- Default empty palette: 5 slots `[main, main, contrast, neutral, neutral]` with `hex: null`.

### Get / Patch / Delete

- `GET /admin/moodboards/:id` → full `HavenMoodboard`
- `PATCH /admin/moodboards/:id` → partial update (`name`, `styleId`, `palette`, `items`, `boardAspectRatio`)
- `DELETE /admin/moodboards/:id`

### Link / Unlink

- `POST /admin/moodboards/:id/link` body `{ "roomSetId": "..." }` **or** `{ "pendingStudioDraftId": "..." }`
- `POST /admin/moodboards/:id/unlink` → clear `roomSetId` and `pendingStudioDraftId`

### Assets / colors

- Prefer reuse `POST /uploads` (existing). Items store `uploadId` + `imageUrl`.
- Optional: `POST /admin/moodboards/:id/assets` multipart `file`
- Optional: `POST /admin/moodboards/extract-colors` `{ "imageUrl" }` → `{ "colors": ["#…"] }`

### Room set changes

- `POST /admin/room-sets/studio` — accept optional `studioDraftId`; after insert, claim pending moodboards (idempotent).
- `GET /admin/room-sets/:id/moodboards` — list linked boards  
  **or** embed `moodboardIds` / `moodboards` on room set detail.

## Schemas

```ts
type MoodboardPaletteRole = 'main' | 'contrast' | 'neutral';

type MoodboardPaletteSlot = {
  role: MoodboardPaletteRole;
  hex: string | null; // "#RRGGBB" or null
};

type MoodboardItemLink =
  | { type: 'product'; productId: string }
  | { type: 'url'; url: string };

type MoodboardTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type MoodboardTextAlign = 'left' | 'center' | 'right';

type MoodboardItem =
  | {
      id: string;
      kind: 'image';
      imageUrl: string;
      uploadId?: string | null;
      x: number; // 0–100, top-left
      y: number;
      w: number;
      h: number;
      zIndex: number;
      rotationDeg?: number; // v1 optional, may ignore
      /** @deprecated Item product/url links are not used; link boards to room sets only. */
      link?: MoodboardItemLink | null;
    }
  | {
      id: string;
      kind: 'text';
      text: string; // max 2000; empty allowed
      fontSize: number; // % of board height, default 4
      fontWeight: MoodboardTextWeight; // default "medium"
      textAlign: MoodboardTextAlign; // default "left"
      color: string; // default "#1a1a1a"
      backgroundColor: string | null;
      x: number;
      y: number;
      w: number;
      h: number;
      zIndex: number;
      rotationDeg?: number;
    };

// Cover thumbnails: first image item only (ignore text).
// Max 24 items per board (images + text combined).

type HavenMoodboard = {
  id: string;
  name: string;
  styleId?: string | null;
  roomSetId?: string | null;
  pendingStudioDraftId?: string | null;
  palette: [
    MoodboardPaletteSlot, // main
    MoodboardPaletteSlot, // main
    MoodboardPaletteSlot, // contrast
    MoodboardPaletteSlot, // neutral
    MoodboardPaletteSlot, // neutral
  ];
  palettePosition?: { x: number; y: number }; // % of board; on-canvas chip
  items: MoodboardItem[];
  boardAspectRatio?: string; // "4:3" | "16:9"
  createdAt: string;
  updatedAt: string;
};

type MoodboardCard = {
  id: string;
  name: string;
  styleId?: string | null;
  roomSetId?: string | null;
  pendingStudioDraftId?: string | null;
  coverImageUrl?: string | null;
  palettePreview: string[];
  itemCount: number;
  updatedAt: string;
};
```

## Validation

- Palette length exactly 5 with roles as above.
- Item coords/sizes in 0–100; `w`/`h` ≥ 4.
- Max **24** items per board.
- Image upload size limits consistent with other Haven uploads.

## Claim / race notes

1. Claim on studio create **and** optionally again when generate job completes (safe re-run).
2. Orphan `pendingStudioDraftId` cleanup after N days (suggest 7–14).
3. If Generate fires before moodboard PATCH settles, next claim pass should still attach.
