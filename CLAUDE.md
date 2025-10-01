# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Haydi Hep Beraber** is a Turkish social challenge platform that enables users to create, participate in, and track community challenges across various categories (fitness, photography, coding, cooking, art, music, reading, language learning). Users can submit content, earn points, form teams, and compete in time-bound challenges.

## Core Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL with connection pooling (mysql2/promise)
- **Authentication**: JWT (Bearer tokens)
- **File Uploads**: Multer (max 5MB)
- **Frontend**: Vanilla JavaScript (no framework)

### Directory Structure
```
backend/
  config/database.js      - MySQL connection pool configuration
  middleware/
    auth.js               - JWT authentication (authenticateToken, optionalAuth)
    upload.js             - Multer file upload configuration
  controllers/            - Business logic for auth, challenges, submissions
  routes/                 - API route definitions
database/
  schema.sql              - Full database schema with indexes
  setup.js                - Database initialization script
public/                   - Static frontend files
  js/                     - Client-side JavaScript modules
  css/                    - Stylesheets
  *.html                  - HTML pages
uploads/                  - User-uploaded files (gitignored)
server.js                 - Main application entry point
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

### API Structure
All API routes are prefixed with `/api`:
- `/api/auth`: Registration, login, profile management
- `/api/challenges`: CRUD operations, listing, filtering, participation
- `/api/submissions`: Creating and managing challenge submissions
- `/api/health`: Health check endpoint

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
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`: MySQL connection
- `JWT_SECRET`: Must be changed for production
- `PORT`: Server port (default 3000)
- `UPLOAD_DIR`, `MAX_FILE_SIZE`: File upload settings

## Development Notes

### Database Connection
The app uses a connection pool (max 10 connections) configured in `backend/config/database.js`. The server will not start if database connection fails - `testConnection()` is called on startup.

### File Uploads
- Handled via Multer middleware in `backend/middleware/upload.js`
- Max file size: 5MB (configurable via `MAX_FILE_SIZE` env var)
- Files stored in `uploads/` directory
- Accessible via `/uploads/*` static route

### Error Handling
Global error handler in `server.js`:
- Catches MulterError for file upload issues
- Returns Turkish error messages
- All responses are in Turkish

### Frontend-Backend Communication
Frontend JavaScript modules (`public/js/`) make fetch requests to API endpoints. JWT token is sent via `Authorization: Bearer <token>` header when available.

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
