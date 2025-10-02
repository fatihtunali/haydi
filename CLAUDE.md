# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Haydi Hep Beraber** is a Turkish social challenge platform that enables users to create, participate in, and track community challenges across various categories (fitness, photography, coding, cooking, art, music, reading, language learning). Users can submit content, earn points, form teams, and compete in time-bound challenges.

## Core Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL with connection pooling (mysql2/promise)
- **Authentication**: JWT (Bearer tokens)
- **File Uploads**: Multer + Cloudinary (max 100MB for videos)
- **Frontend**: Vanilla JavaScript (no framework)
- **View Engine**: EJS (server-side rendering)
- **AI Services**: OpenAI (content moderation & quality scoring)

### Directory Structure
```
backend/
  config/
    database.js           - MySQL connection pool configuration
    cloudinary.js         - Cloudinary configuration and storage setup
  middleware/
    auth.js               - JWT authentication (authenticateToken, optionalAuth, isAdmin)
    upload.js             - Multer + Cloudinary file upload configuration
  controllers/            - Business logic (auth, challenges, submissions, admin)
  routes/                 - API route definitions
  services/
    aiModeration.js       - OpenAI content moderation and quality scoring
database/
  schema.sql              - Full database schema with indexes
  setup.js                - Database initialization script
  seed-challenges.sql     - Sample challenge data
public/                   - Static frontend files (CSS, JS, images)
  js/                     - Client-side JavaScript modules
  css/                    - Stylesheets
views/                    - EJS templates
  pages/                  - Page templates (index, challenges, profile, admin, etc.)
  partials/               - Reusable components (header, footer)
uploads/                  - Temporary local uploads (gitignored, files moved to Cloudinary)
server.js                 - Main application entry point
.cpanel.yml               - cPanel deployment configuration
```

### Database Schema
Key tables and relationships:
- **users**: Authentication and profile data (username, email, password, points, avatar)
- **categories**: Pre-seeded challenge categories with slugs and icons
- **challenges**: Core challenge entity with status enum (taslak/aktif/bitti/iptal), difficulty (kolay/orta/zor), team support, date ranges
- **teams**: For team-based challenges, linked to captain and participants
- **participants**: Many-to-many join table for users and challenges, tracks status and points_earned
- **submissions**: User/team content submissions with media support (resim/video/link/metin) and approval status
- **likes**, **comments**: Social interaction features
- **notifications**: User notification system

All tables use InnoDB engine with utf8mb4 charset and appropriate indexes.

### Authentication Flow
- JWT tokens are issued on login/register and stored client-side
- Protected routes use `authenticateToken` middleware (requires valid token)
- Public routes use `optionalAuth` middleware (token optional, adds user context if present)
- Token payload includes: `{ id, username, email }`

### Routing Architecture
The application uses **hybrid routing** with both server-rendered views and API endpoints:

**View Routes (EJS-rendered pages):**
- `/` - Homepage with social feed
- `/challenges` - Challenge listing page
- `/challenge/:id` - Individual challenge detail page
- `/login`, `/register` - Authentication pages
- `/profile` - User profile page
- `/admin` - Admin panel (role-based access)

**API Routes (JSON endpoints):**
All prefixed with `/api`:
- `/api/auth` - Registration, login, profile management
- `/api/challenges` - CRUD operations, listing, filtering, participation
- `/api/submissions` - Creating and managing challenge submissions
- `/api/admin` - Admin operations (user management, content moderation)
- `/api/health` - Health check endpoint

## Common Commands

### Development
```bash
npm start          # Start the server (port 3000 by default)
npm run dev        # Same as npm start
```

### Database Setup
```bash
npm run setup      # Initialize database and run schema.sql
```

This creates the database, all tables, indexes, and seeds initial categories. Must be run before first server start.

### Environment Configuration
Copy `.env` and configure:
- **Database**: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`
- **Server**: `PORT` (default 3000), `NODE_ENV` (development/production)
- **Auth**: `JWT_SECRET` (must be changed for production)
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`
- **OpenAI**: `OPENAI_API_KEY` (for AI moderation)
- **Uploads**: `UPLOAD_DIR`, `MAX_FILE_SIZE` (legacy, now using Cloudinary)

## Development Notes

### Database Connection
The app uses a connection pool (max 10 connections) configured in `backend/config/database.js`. The server will not start if database connection fails - `testConnection()` is called on startup.

### File Uploads & Cloud Storage
- Handled via Multer + Cloudinary integration
- Configuration in `backend/config/cloudinary.js` and `backend/middleware/upload.js`
- Max file size: 100MB (supports large videos)
- Supported formats: Images (jpg, png, gif, webp) and Videos (mp4, mov, avi, webm)
- Files uploaded directly to Cloudinary cloud storage
- Automatic transformations:
  - Images: max 1200x1200, auto quality
  - Videos: max 1920x1080, auto quality and format
- Legacy `/uploads/*` route exists for backward compatibility

### AI-Powered Content Moderation
Located in `backend/services/aiModeration.js`:
- **AI Analysis Only** - All submissions go to admin approval queue
- **Automatic moderation** using OpenAI Moderation API (content safety check)
- **Challenge compliance check** using GPT-4o-mini (validates submissions against challenge rules)
- **Quality scoring** (0-100) for submissions with point bonuses
- **AI Recommendations**: `approve`, `reject`, or `manual` (stored in `submissions.ai_recommendation`)
- Admin sees AI score, reason, and recommendation in admin panel
- Admin makes final approval/rejection decision
- Point calculation uses AI quality score if available (admin can override)
- Database fields: `ai_score`, `ai_reason`, `ai_recommendation`

### Admin & Role-Based Access
- Admin middleware in `backend/middleware/auth.js` (`isAdmin`)
- Admin role checked against database `users.role` field
- Admin routes protected by `isAdmin` middleware
- Admin panel accessible at `/admin` for authorized users
- Admin can moderate submissions, manage users, and view analytics

### Error Handling
Global error handler in `server.js`:
- Catches MulterError for file upload issues
- Handles Cloudinary upload errors
- Returns Turkish error messages (all UI responses in Turkish)
- Logs detailed error info to console

### View Rendering (EJS)
- Server-side rendering with EJS templates
- Pages in `views/pages/`, partials in `views/partials/`
- All views receive: `title`, `activePage`, `challenge` (optional context)
- Header/footer partials included in all pages
- Challenge detail page (`/challenge/:id`) fetches data server-side before rendering

### Frontend-Backend Communication
- Frontend JavaScript modules in `public/js/` make fetch requests to API endpoints
- JWT token sent via `Authorization: Bearer <token>` header when available
- Key modules:
  - `api.js` - API request helpers
  - `auth.js` - Authentication utilities
  - `main.js` - Homepage feed logic
  - `challenge-detail.js` - Challenge interaction
  - `admin.js` - Admin panel functionality
  - `utils.js` - Shared utilities

### Challenge Status Lifecycle
Challenges follow this status flow:
1. `taslak` (draft) - Being created
2. `aktif` (active) - Accepting participants and submissions
3. `bitti` (finished) - Completed
4. `iptal` (cancelled) - Cancelled

### Points System
- Users earn points by participating in challenges
- Points are tracked in `users.points` (aggregate) and `participants.points_earned` (per challenge)
- Submissions can award points via `submissions.points_awarded`
- Teams have `total_points` for leaderboards
- Point calculation influenced by:
  - Base challenge points
  - AI quality score (0-100)
  - Difficulty multiplier (kolay: 1.0, orta: 1.5, zor: 2.0)
  - Quality bonus: scores 60+ get scaling bonuses up to 1.5x

## Deployment

### Production (cPanel)
Deployment is automated via `.cpanel.yml`:
```bash
git push  # Pushes to repository, triggers cPanel deployment
```

Deployment process:
1. Files copied to `/home/haydi/haydihepberaber/`
2. Environment files (`.env`, `.htaccess`) copied
3. Dependencies installed with `npm install --production --prefer-offline`

For production environment, use `.env.production` with production database credentials and secrets.
- add this
- add to memory
- add to memory
- add
- add to memory