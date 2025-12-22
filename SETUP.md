# Setup Instructions

## Quick Start

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/ (version 18 or higher)
   - Verify installation: `node --version`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Initialize Database**
   ```bash
   npm run db:seed
   ```
   This creates the database and populates it with manual episodes from the original Python code.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Main application: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with manual episodes

## Database Location

The SQLite database is stored in:
```
data/episodes.db
```

This directory is gitignored and will be created automatically.

## Environment Variables

Currently, no environment variables are required. For production, you may want to add:

- `DATABASE_URL` - For PostgreSQL (if migrating from SQLite)
- `ADMIN_PASSWORD` - For admin authentication (future feature)

## Troubleshooting

### Database Errors

If you see database errors:
1. Delete `data/episodes.db` and `data/episodes.db-journal`
2. Run `npm run db:seed` again

### Port Already in Use

If port 3000 is in use:
- Change port in `package.json` scripts: `next dev -p 3001`
- Or kill the process using port 3000

### Module Not Found

If you see module errors:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Next Steps

1. **Sync Episodes from API**
   - Visit http://localhost:3000/admin
   - Click "Episoden aktualisieren" to sync from MediathekViewWeb API

2. **Customize Episodes**
   - Use the admin panel to edit titles, descriptions, and language
   - Changes are saved to the database

3. **Deploy**
   - See `MIGRATION_GUIDE.md` for deployment instructions

