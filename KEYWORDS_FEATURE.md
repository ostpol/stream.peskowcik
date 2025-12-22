# Keywords Management Feature

## Overview

The keywords used in `isSorbianEpisode()` are now manageable via the backend. This allows administrators to add, edit, and delete keywords without code changes.

## Implementation

### Database Schema

Added a new `keywords` table:
```sql
CREATE TABLE keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### API Endpoints

- `GET /api/keywords` - Get all keywords
- `POST /api/keywords` - Create a new keyword
- `GET /api/keywords/:id` - Get a single keyword
- `PATCH /api/keywords/:id` - Update a keyword
- `DELETE /api/keywords/:id` - Delete a keyword

### Code Changes

1. **`lib/db.ts`**: Added `Keyword` interface and `keywords` table creation
2. **`lib/keywords.ts`**: New module for keyword CRUD operations
3. **`lib/api-client.ts`**: Updated `isSorbianEpisode()` to accept optional keywords array
4. **`lib/episodes.ts`**: Updated `syncEpisodesFromAPI()` to fetch keywords from database
5. **`app/api/keywords/route.ts`**: API routes for keyword management
6. **`app/admin/page.tsx`**: Added keyword management UI with tabs

### Admin Interface

The admin panel now has two tabs:
- **Episoden**: Manage episodes (existing functionality)
- **Schlüsselwörter**: Manage keywords (new functionality)

In the keywords tab, you can:
- View all keywords
- Add new keywords
- Edit existing keywords
- Delete keywords

### Default Keywords

The default keywords from the original Python code are automatically seeded:
- sorbisch
- obersorbisch
- niedersorbisch
- peskowcik
- pěskowčik
- gestörte angelfreuden
- gestoerte angelfreuden
- suwa
- spewaca
- mróčele
- mrocele
- jablucina
- jabłucina
- liska
- sroka

### Seeding

Keywords are automatically seeded when you run:
```bash
npm run db:seed
```

Or seed keywords separately:
```bash
npm run db:seed-keywords
```

### Backward Compatibility

The `isSorbianEpisode()` function maintains backward compatibility:
- If no keywords are provided, it falls back to the hardcoded default list
- This ensures the function works even if the database is not available

### Usage

When syncing episodes from the API, the system:
1. Fetches all keywords from the database
2. Passes them to `isSorbianEpisode()` for filtering
3. Uses the database keywords instead of hardcoded values

This means any changes to keywords in the admin panel will immediately affect episode detection on the next sync.

