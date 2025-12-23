# Setup Instructions

## Quick Start

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/ (version 18 or higher)
   - Verify installation: `node --version`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Main application: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Location

The SQLite database is stored in:
```
data/episodes.db
```

This directory is gitignored and will be created automatically.

## Environment Variables

Provide admin credentials via environment variables:

- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

## Troubleshooting

### Database Errors

If you see database errors:
1. Delete `data/episodes.db` and `data/episodes.db-journal`
2. Restart the development server to recreate the database

### Port Already in Use

If port 3000 is in use:
- Change port in `package.json` scripts: `next dev -p 3001`
- Or kill the process using port 3000

### Module Not Found

If you see module errors:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Next Steps

1. **Configure API Search Terms**
   - Visit http://localhost:3000/admin
   - Add search terms for the ARD Mediathek API

2. **Customize Episodes**
   - Use the admin panel to edit titles, descriptions, and language overrides
   - Changes are saved to the database

3. **Deploy**
   - See `MIGRATION_GUIDE.md` for deployment instructions
