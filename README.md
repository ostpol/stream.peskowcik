# Stream Pěskowčik

Stream Sorbian-language episodes of **Unser Sandmännchen** in a modern Next.js web app. The project pulls data from the ARD Mediathek API, enriches it with local overrides, and presents a searchable, filterable library with an admin dashboard for curation.

## Highlights

- **Episode streaming** with MP4 and HLS playback (HLS.js fallback)
- **Search + filters** for title/description, language, and date range
- **Language detection** (Obersorbisch/Niedersorbisch) with manual overrides
- **Admin dashboard** for overrides, search terms, and blacklist entries
- **RSS feed** for sharing available episodes
- **SQLite-backed storage** for admin data and API cache

## Tech Stack

- **Next.js 14** (App Router, React, TypeScript)
- **Tailwind CSS** for UI styling
- **better-sqlite3** for persistence
- **Axios** for API calls
- **HLS.js** for streaming support

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

To bootstrap the first admin user, set these variables before starting the app:

```
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD=your-password
```

If a user already exists, these variables are ignored.

## Admin Dashboard

Visit `/admin` to manage:

- Episode metadata overrides (title, description, language, availability)
- Search terms used for ARD Mediathek queries
- Blacklist rules (by title or URL)

Authentication is handled via a secure, server-side session cookie.

## Data & Caching

- SQLite database lives in `data/episodes.db` (created on first run).
- ARD Mediathek API responses are cached for 24 hours to reduce load.

## Project Structure

```
app/
  api/                 # API routes (episodes, admin, RSS)
  admin/               # Admin dashboard
  page.tsx             # Home page
components/            # UI components
lib/                   # Data + API utilities
public/                # Static assets
```

## Scripts

- `npm run dev` – start the development server
- `npm run build` – build for production
- `npm run start` – run the production server
- `npm run lint` – lint the codebase

## License

Apache License 2.0
