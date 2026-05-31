# Everlink 🔗

> **Own your links. Forever.**

A premium, self-hosted URL shortener and permanent link manager. Create short links you control — update the destination anytime without breaking the link you already shared.

---

## The Problem

Most link shorteners treat links as a one-and-done transaction. But in the real world, links outlive the things they point to.

**Here's where permanent links matter:**

| Situation | Without Everlink | With Everlink |
|-----------|-----------------|---------------|
| 📄 **Resume / Portfolio** | You share `drive.google.com/file/abc123` on 50 job applications. Months later you create a new version. All your old applications now point to the outdated doc. | Share `everlink.app/resume` once. Update the destination to the new file anytime. |
| 🎓 **Student projects** | You submit a Vercel link that changes when you re-deploy. Your professor's bookmarked link breaks. | Submit `everlink.app/project1`. Point it anywhere — it never breaks. |
| 📱 **Social media bio links** | You have one link slot on Instagram/Twitter. Updating the URL means updating every profile manually. | Use `everlink.app/links`. Change destination at will. |
| 🏢 **Business resources** | Your company shares a link to an internal doc. The doc gets migrated to a new platform. Every email, slide deck, and printout with the old link is broken. | Use a permanent slug. Redirect to wherever the doc lives now. |
| 🎥 **YouTube / Content creators** | You promote a link in old videos you can't edit. The destination (merchandise store, discord, etc.) changes. | Promote one everlink. Update the destination as your business evolves. |
| 📊 **Marketing campaigns** | Printed QR codes on flyers point to a seasonal landing page that expires. | The QR code points to an Everlink. Update to the next campaign page. |
| 🔬 **Research / Academic** | Citations in published papers point to URLs that rot over time (link rot). | Maintain a controlled redirect that you can update when resources move. |

---

## Features

- 🔗 **Permanent Short Links** — Create clean, short URLs that never expire
- ✏️ **Live Redirect Editing** — Change the destination URL anytime from your dashboard
- 🏷️ **Custom Slugs** — Name your links meaningfully (e.g. `/resume`, `/portfolio`)
- 📊 **Click Tracking** — See how many times each link has been opened
- 📝 **Link Titles** — Give each link a descriptive name for easy management
- 🔐 **Secure Auth** — JWT-based username + password authentication with bcrypt-hashed passwords
- 🛡️ **Protected Routes** — All link management requires authentication
- ⚡ **Fast Redirects** — Slugs are database-indexed for near-instant lookups

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, React Router |
| **Backend** | Node.js, Express |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT + bcryptjs (username + password) |
| **Slug Generation** | nanoid |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/everlink.git
cd everlink
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `backend/.env` and fill in the values. Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Then open `frontend/.env` and set `VITE_API_URL` (and `VITE_SHORT_URL_BASE`) to your backend URL.

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user (`name`, `username`, `password`) — returns a JWT |
| `POST` | `/api/auth/login` | Login with `username` & `password` — returns a JWT |

### Links (Protected — requires `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/links` | Get all links for the logged-in user |
| `POST` | `/api/links` | Create a new link |
| `PUT` | `/api/links/:id` | Update a link (destination URL, slug, title) |
| `DELETE` | `/api/links/:id` | Delete a link |

### Redirect (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/:slug` | Redirect to the destination URL + increment click count |

---

## Deployment

### Backend → Render
This repo includes a `render.yaml` blueprint. Easiest path:
1. Push to GitHub.
2. Render dashboard → **New +** → **Blueprint** → select your repo.
3. Fill the secret env vars (`MONGO_URI`, `FRONTEND_URL`) in the prompt — `JWT_SECRET` is auto-generated.

Or manually:
1. **New +** → **Web Service** → connect repo → **Root Directory** = `backend`.
2. Build: `npm install` | Start: `node server.js` | Health check path: `/health`.
3. Add every variable from `backend/.env.example`.
4. After the frontend is deployed, set `FRONTEND_URL` to your Vercel domain (you can pass multiple, comma-separated).

### Frontend → Vercel
1. Create a new **Project** on [Vercel](https://vercel.com)
2. Connect your GitHub repo, set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Add environment variable: `VITE_API_URL` = your Render backend URL

### MongoDB → Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Go to **Network Access** → Add `0.0.0.0/0` to allow Render's dynamic IPs
3. Copy the connection string and set it as `MONGO_URI` in Render

---

## Environment Variables Summary

| Variable | Where | Required | Description |
|----------|--------|----------|-------------|
| `MONGO_URI` | Backend | ✅ | MongoDB connection string |
| `JWT_SECRET` | Backend | ✅ | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Backend | ❌ | Token expiry (default: `7d`) |
| `FRONTEND_URL` | Backend | ✅ | Frontend origin for CORS |
| `PORT` | Backend | ❌ | Server port (default: `5000`) |
| `VITE_API_URL` | Frontend | ✅ | Backend API base URL |
| `VITE_SHORT_URL_BASE` | Frontend | ❌ | Base URL shown for short links (defaults to `VITE_API_URL`) |

---

## Security

- Passwords hashed with **bcryptjs** (never stored in plaintext)
- Username + password auth — no email, no third-party login
- JWT tokens expire after 7 days
- Generic error messages to prevent user enumeration attacks
- CORS restricted to whitelisted frontend origin only
- Reserved slugs (`api`, `health`, …) can't be claimed as short links
- All link operations require a valid JWT

---

## License

MIT — free to use, modify, and self-host.
