# Repository Analysis: Stream Peskowcik

## Current Architecture

### Technology Stack
- **Framework**: Streamlit (Python)
- **Dependencies**: 
  - `streamlit` - Web UI framework
  - `requests` - HTTP client for API calls
  - `pandas` - Data manipulation
- **Deployment**: Streamlit Cloud (streamlit.io)

### Core Functionality

1. **API Integration**
   - Fetches episodes from ARD Mediathek API (`https://api.ardmediathek.de`)
   - Queries for "Unser Sandmännchen" episodes
   - Supports pagination (offset/size)

2. **Episode Filtering**
   - Keyword-based detection of Sorbian episodes
   - Language variant detection (Obersorbisch/Niedersorbisch)
   - Scoring system for episode relevance
   - Deduplication logic based on title, description, and date

3. **Manual Episode Management**
   - Hardcoded lists in Python:
     - `MANUAL_EPISODES`: Base64 IDs for ARD Mediathek
     - `MANUAL_EPISODE_URLS`: Direct URLs (MDR/ARD)
     - `MANUAL_EPISODE_METADATA`: Custom titles/descriptions for MDR links
   - Fetches episode details from ARD API and MDR pages

4. **Video Playback**
   - Supports MP4 and HLS (m3u8) streams
   - Uses hls.js for HLS playback in browsers
   - Fallback to website links when video unavailable

5. **RSS Feed Generation**
   - Generates RSS 2.0 XML
   - Includes video enclosures
   - Downloadable feed

6. **UI Features**
   - Episode cards in 3-column grid
   - Grouped by language (Obersorbisch/Niedersorbisch)
   - Expandable descriptions
   - Data table view
   - Thumbnail previews

### Current Limitations

1. **No Persistent Storage**
   - Manual episodes hardcoded in source code
   - No way to manage custom titles/descriptions without code changes
   - No user preferences or settings

2. **Limited Customization**
   - Cannot edit episode metadata through UI
   - No admin interface
   - Manual episode management requires code deployment

3. **Streamlit Constraints**
   - Server-side rendering (slower interactions)
   - Limited customization options
   - Not optimized for mobile
   - Requires Python runtime

4. **No Authentication**
   - No way to restrict admin features
   - All functionality public

## Proposed Modern Web Stack

### Recommended Architecture

**Frontend:**
- **Next.js 14+** (React framework)
  - Server-side rendering for SEO
  - API routes for backend integration
  - Modern React patterns
  - Excellent performance
  - Easy deployment (Vercel, Netlify, etc.)

**Backend:**
- **Node.js + Express** or **Python + FastAPI**
  - RESTful API for episode management
  - Database operations
  - API proxy for ARD Mediathek (CORS handling)

**Database:**
- **SQLite** (development) or **PostgreSQL** (production)
  - Store custom episode metadata
  - User preferences
  - Admin settings

**Video Player:**
- **Video.js** or **Plyr**
  - Better cross-browser support
  - More customization options
  - Better mobile experience

### New Features to Implement

1. **Admin Backend**
   - CRUD operations for custom episode titles
   - Manage manual episode URLs
   - Edit episode metadata
   - Override API data with custom values

2. **Database Schema**
   ```sql
   episodes (
     id, base64_id, url_website, url_video,
     custom_title, custom_description, custom_language,
     original_title, original_description,
     timestamp, duration, channel,
     is_manual, created_at, updated_at
   )
   ```

3. **API Endpoints**
   - `GET /api/episodes` - Fetch all episodes
   - `GET /api/episodes/:id` - Get single episode
   - `POST /api/episodes` - Create custom episode
   - `PUT /api/episodes/:id` - Update episode metadata
   - `DELETE /api/episodes/:id` - Delete episode
   - `GET /api/episodes/rss` - Generate RSS feed

4. **Frontend Features**
   - Modern, responsive design
   - Fast client-side navigation
   - Better mobile experience
   - Admin panel (protected routes)
   - Search and filtering
   - Sort options

### Migration Strategy

1. **Phase 1: Setup**
   - Initialize Next.js project
   - Set up database schema
   - Create API routes

2. **Phase 2: Core Functionality**
   - Port API fetching logic
   - Port filtering logic
   - Port video playback

3. **Phase 3: Database Integration**
   - Migrate manual episodes to database
   - Implement CRUD operations
   - Add admin interface

4. **Phase 4: Enhancement**
   - Add authentication
   - Improve UI/UX
   - Add search/filter
   - Optimize performance
