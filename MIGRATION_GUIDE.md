# Migration Guide: Python/Streamlit to Next.js

This guide explains the differences between the original Python/Streamlit application and the new Next.js version.

## Key Changes

### Architecture

**Before (Python/Streamlit):**
- Single Python file with Streamlit UI
- Hardcoded episode lists in source code
- Server-side rendering only
- Deployed on Streamlit Cloud

**After (Next.js):**
- Modern web application with React frontend
- SQLite database for episode storage
- Client-side rendering with server-side API
- Deployable to Vercel, Netlify, or any Node.js host

### Episode Management

**Before:**
- Manual episodes defined in Python constants:
  - `MANUAL_EPISODES` (base64 IDs)
  - `MANUAL_EPISODE_URLS` (URLs)
  - `MANUAL_EPISODE_METADATA` (custom metadata)
- Changes require code deployment

**After:**
- Episodes stored in SQLite database
- Admin panel at `/admin` for managing episodes
- Can add/edit/delete episodes without code changes
- Custom titles, descriptions, and language settings

### API Integration

The API integration logic has been ported from Python to TypeScript:

- `fetchMediathekResults()` - Equivalent to `fetch_results()`
- `fetchArdEpisode()` - Equivalent to `fetch_ard_episode()`
- `isSorbianEpisode()` - Equivalent to `is_sorbian_episode()`
- `detectLanguage()` - Equivalent to `detect_language()`

### Database Schema

The new database stores:
- Original episode data from API
- Custom overrides (title, description, language)
- Manual episode flags
- Timestamps for creation/updates

### Features Added

1. **Admin Panel** (`/admin`)
   - View all episodes in a table
   - Edit custom metadata
   - Delete episodes
   - Sync from API

2. **RESTful API**
   - `GET /api/episodes` - List all episodes
   - `GET /api/episodes/:id` - Get single episode
   - `POST /api/episodes` - Create episode
   - `PATCH /api/episodes/:id` - Update episode
   - `DELETE /api/episodes/:id` - Delete episode
   - `GET /api/episodes/rss` - RSS feed

3. **Better Performance**
   - Client-side navigation
   - Optimized rendering
   - Better mobile experience

## Migration Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Main page: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Data Management

- Provide `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment to bootstrap the admin account.
- Use `/admin` to manage search terms, blacklist entries, and episode overrides.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Next.js
4. Note: SQLite files need to be persisted (consider using Vercel Blob or external database)

### With External Database

For production, consider migrating to PostgreSQL:
- Update `lib/db.ts` to use `pg` instead of `better-sqlite3`
- Update connection string in environment variables
- Same schema applies

## Backward Compatibility

The original Python code is preserved in `stream.app.peskowcik.py` for reference. The new application maintains the same functionality while adding:
- Persistent storage
- Admin interface
- Better performance
- Modern web stack
