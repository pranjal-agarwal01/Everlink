# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Everlink is a self-hosted URL shortener with live redirect editing — users can change the destination of a short link without breaking it. It has a Node.js/Express backend and a React/Vite frontend.

## Commands

### Backend (`/backend`)
```bash
npm run dev    # Development with nodemon hot reload
npm start      # Production start
```

### Frontend (`/frontend`)
```bash
npm run dev    # Vite dev server on port 5173
npm run build  # Production build to /dist
npm run lint   # ESLint check
```

### Running the full stack locally
Start backend first (port 5000), then frontend (port 5173). The frontend proxies API calls to `VITE_API_URL`.

## Architecture

### Backend (`backend/`)

**Entry point:** `server.js` — sets up Express, trust proxy (for Render's reverse proxy), CORS, JSON parsing, rate limiting, and mounts routes.

**Route → Controller → Model flow:**
- `src/routes/authRoutes.js` → `src/controllers/authController.js` — register, login
- `src/routes/linkRoutes.js` → `src/controllers/linkController.js` — CRUD for links (all protected by JWT middleware)
- `GET /:slug` in `server.js` → `linkController.redirectLink` — public redirect route, atomically increments click count

**Auth flow (username + password, no email):**
1. Register → provide `name`, `username`, `password`; validate; create user; issue a 7-day JWT immediately (auto-login)
2. Login → provide `username` + `password`; verify bcrypt password; issue JWT
3. JWT is checked in `src/middleware/authMiddleware.js` via `Authorization: Bearer <token>` header

> Auth is username + password only. There is **no email** anywhere in the system and **no password-reset flow** — if a user forgets their password, they create a new account. This was a deliberate choice (Render's free tier blocks outbound SMTP, and email added operational friction for no benefit on this project).

**Models:**
- `User`: `name`, `username` (unique indexed, 3–20 chars, `a-z 0-9 _`), bcrypt password (`select: false`)
- `Link`: `originalUrl`, `slug` (unique, nanoid(8) auto-generated), `user` ref, `clicks` counter

### Frontend (`frontend/`)

**State management:** No external store. User state is kept in `App.jsx` via `useState`, persisted to `localStorage` as `everlinkUser` (contains JWT token and user info). Auth redirect logic also lives in `App.jsx`.

**Pages:**
- `Home.jsx` — Landing/marketing page
- `Auth.jsx` — Single login/register form. On success it stores the JWT and redirects to the dashboard (no OTP step).
- `Dashboard.jsx` — Full link management: create, edit (title, URL, slug), delete, copy short URL, view click counts

**Routing:** React Router v7 with routes `/`, `/login`, `/register`, `/dashboard`. Non-authenticated users are redirected away from `/dashboard`.

**Design:** Glassmorphism UI (`.glass-panel` class) with coral red primary (`#FF6B6B`) and teal secondary (`#4ECDC4`). Fonts: Plus Jakarta Sans, Inter. Styles are in `src/index.css`.

## Environment Variables

**Backend (`.env`):**
| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default 7d) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |

**Frontend (`.env`):**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL for API calls |
| `VITE_SHORT_URL_BASE` | Base URL prepended to slugs in the UI |

## Key Implementation Details

- **Atomic click counting:** `redirectLink` uses MongoDB `$inc` operator to prevent race conditions on high-traffic slugs.
- **Slug generation:** `nanoid(8)` produces 8-character URL-safe slugs. Users can also provide custom slugs. Reserved slugs (e.g. `api`, `health`) are rejected so they can't shadow real routes.
- **Rate limiting:** Auth endpoints are limited to 20 requests per 15 minutes per IP. Express is configured with `trust proxy` so Render's reverse proxy forwards the real client IP correctly.
- **CORS:** Whitelists `FRONTEND_URL`, `localhost:5173`, and `localhost:3000`. Requests with no `Origin` header (curl/Postman) pass through.
- **Password policy:** Enforced both client-side and server-side — minimum 8 chars, at least one letter and one digit.
- **Username policy:** Enforced both client-side and server-side — 3–20 chars, lowercase letters, numbers, and underscores only. Stored lowercase and unique.
