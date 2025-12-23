# Stream Peskowcik - Modern Web Version

This is a modern web application for streaming Sorbian-language episodes of "Unser Sandmännchen" (Pěskowčik). It's a port from the original Python/Streamlit application to a Next.js-based web stack with a backend for managing custom episode metadata.

## Features

- 🎬 **Video Streaming**: Stream episodes directly in the browser with support for MP4 and HLS (m3u8) formats
- 📱 **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- 🗄️ **Database Backend**: SQLite database for search terms, overrides, blacklist, and admin users
- ✏️ **Admin Panel**: Manage overrides, search terms, and blacklist entries with authentication
- 📡 **RSS Feed**: Generate and download RSS feeds of available episodes
- 🔄 **API Integration**: Fetches episodes from the ARD Mediathek API with 24h caching
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

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Management

- The database file is stored in `data/episodes.db`
- Provide `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment to bootstrap the initial admin login

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
│   ├── api-client.ts     # ARD Mediathek API client
│   └── episodes.ts       # Episode business logic
└── data/                  # Database files (gitignored)
```

## API Endpoints

- `GET /api/episodes` - Get all episodes
- `GET /api/episodes/rss` - Generate RSS feed
- `POST /api/episode-overrides` - Create/update overrides (admin)
- `PATCH /api/episode-overrides/:id` - Update overrides (admin)
- `DELETE /api/episode-overrides/:id` - Delete overrides (admin)

## Admin Features

Visit `/admin` to access the admin panel where you can:
- View and override episode metadata
- Manage search terms for ARD API queries
- Maintain the blacklist

## Migration from Python Version

The original Python/Streamlit app has been ported with the following improvements:

1. **Persistent Storage**: Override metadata and API settings are stored in a database
2. **Admin Interface**: Web-based admin panel for managing API settings and overrides
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
- Rotating admin credentials regularly
- Setting up environment variables for configuration

## License

Apache License 2.0 (same as original)
