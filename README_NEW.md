# Stream Peskowcik - Modern Web Version

This is a modern web application for streaming Sorbian-language episodes of "Unser Sandmännchen" (Pěskowčik). It's a port from the original Python/Streamlit application to a Next.js-based web stack with a backend for managing custom episode metadata.

## Features

- 🎬 **Video Streaming**: Stream episodes directly in the browser with support for MP4 and HLS (m3u8) formats
- 📱 **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- 🗄️ **Database Backend**: SQLite database for storing and managing episode metadata
- ✏️ **Admin Panel**: Manage custom episode titles, descriptions, and language settings
- 📡 **RSS Feed**: Generate and download RSS feeds of available episodes
- 🔄 **API Integration**: Automatically fetches episodes from MediathekViewWeb API
- 🌐 **Language Detection**: Automatically detects Obersorbisch vs Niedersorbisch

## Technology Stack

- **Frontend**: Next.js 14+ (React, TypeScript, Tailwind CSS)
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3)
- **Video Player**: Native HTML5 video with HLS.js for HLS streams

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize the database and seed with manual episodes:
```bash
npm run db:seed
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Management

- **Seed database**: `npm run db:seed` - Populates database with manual episodes from the original Python code
- The database file is stored in `data/episodes.db`

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   └── episodes/     # Episode CRUD endpoints
│   ├── admin/            # Admin panel page
│   ├── page.tsx          # Main homepage
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── EpisodeCard.tsx   # Episode display card
│   └── VideoPlayer.tsx   # Video player component
├── lib/
│   ├── db.ts             # Database setup and utilities
│   ├── api-client.ts     # MediathekViewWeb API client
│   └── episodes.ts       # Episode business logic
├── scripts/
│   └── seed.ts           # Database seeding script
└── data/                  # Database files (gitignored)
```

## API Endpoints

- `GET /api/episodes` - Get all episodes (optionally sync with `?sync=true`)
- `GET /api/episodes/:id` - Get single episode
- `POST /api/episodes` - Create new episode
- `PATCH /api/episodes/:id` - Update episode metadata
- `DELETE /api/episodes/:id` - Delete episode
- `GET /api/episodes/rss` - Generate RSS feed

## Admin Features

Visit `/admin` to access the admin panel where you can:
- View all episodes
- Edit custom titles, descriptions, and language
- Delete episodes
- Sync episodes from the API

## Migration from Python Version

The original Python/Streamlit app has been ported with the following improvements:

1. **Persistent Storage**: Manual episodes are now stored in a database instead of hardcoded
2. **Admin Interface**: Web-based admin panel for managing episodes
3. **Better Performance**: Client-side rendering with Next.js
4. **Modern UI**: Responsive design with Tailwind CSS
5. **Type Safety**: Full TypeScript support

## Deployment

This application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting** (requires SQLite file persistence)

For production, consider:
- Using PostgreSQL instead of SQLite for better scalability
- Adding authentication for the admin panel
- Setting up environment variables for configuration

## License

Apache License 2.0 (same as original)

