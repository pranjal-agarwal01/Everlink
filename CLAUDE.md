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
- `src/routes/authRoutes.js` → `src/controllers/authController.js` — register, login, OTP verify, resend OTP
- `src/routes/linkRoutes.js` → `src/controllers/linkController.js` — CRUD for links (all protected by JWT middleware)
- `GET /:slug` in `server.js` → `linkController.redirectLink` — public redirect route, atomically increments click count

**Auth flow:**
1. Register → generate 6-digit OTP, hash with HMAC-SHA256, email user
2. Verify OTP → set `isVerified = true`, issue 7-day JWT
3. Login → if unverified, send fresh OTP; if verified, issue JWT
4. JWT is checked in `src/middleware/authMiddleware.js` via `Authorization: Bearer <token>` header

**OTP security:** 10-min expiry, 5-attempt lockout (15 min), hashed with HMAC-SHA256. Legacy bcrypt and plaintext OTP formats are also supported in `User.matchOtp()` for backward compatibility.

**Email (`src/utils/sendEmail.js`):** Uses Nodemailer with explicit IPv4 DNS resolution for `smtp.gmail.com` — this is required on Render's free tier which cannot reach IPv6. The transporter is built lazily and pooled (max 3 connections, 100 messages each). On failure, the transporter is reset so the next call gets a fresh DNS resolution.

**Models:**
- `User`: email (unique indexed), bcrypt password, `isVerified`, OTP fields with lockout logic
- `Link`: `originalUrl`, `slug` (unique, nanoid(8) auto-generated), `user` ref, `clicks` counter

### Frontend (`frontend/`)

**State management:** No external store. User state is kept in `App.jsx` via `useState`, persisted to `localStorage` as `everlinkUser` (contains JWT token and user info). Auth redirect logic also lives in `App.jsx`.

**Pages:**
- `Home.jsx` — Landing/marketing page
- `Auth.jsx` — Two-step form (login/register → OTP verification). Handles OTP resend with 60-second cooldown.
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
| `SMTP_HOST/PORT/EMAIL/PASSWORD` | Nodemailer SMTP config |
| `FROM_NAME/EMAIL` | Email sender info |
| `FRONTEND_URL` | Allowed CORS origin |

**Frontend (`.env`):**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL for API calls |
| `VITE_SHORT_URL_BASE` | Base URL prepended to slugs in the UI |

## Key Implementation Details

- **Atomic click counting:** `redirectLink` uses MongoDB `$inc` operator to prevent race conditions on high-traffic slugs.
- **Slug generation:** `nanoid(8)` produces 8-character URL-safe slugs. Users can also provide custom slugs.
- **Rate limiting:** Auth endpoints are limited to 20 requests per 15 minutes per IP. Express is configured with `trust proxy` so Render's reverse proxy forwards the real client IP correctly.
- **CORS:** Whitelists `FRONTEND_URL`, `localhost:5173`, and `localhost:3000`. Requests with no `Origin` header (curl/Postman) pass through.
- **Password policy:** Enforced both client-side and server-side — minimum 8 chars, at least one letter and one digit.
