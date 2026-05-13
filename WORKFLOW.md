# Musaix Pro Workflow Guide

## Quick Commands

### Full Stack Setup (one-time)
```bash
# Automated setup script
./setup.sh
```

Takes ~5-10 minutes depending on system and internet speed.

### Development

**Option 1: Two terminals (recommended)**

Terminal A - Backend:
```bash
pnpm backend:dev
```

Terminal B - Frontend:
```bash
pnpm dev:frontend
```

Then open: `http://localhost:3000`

**Option 2: Single command (with process manager)**
```bash
pnpm start:all
```

### Building

Frontend only:
```bash
pnpm build:frontend
```

Full stack:
```bash
pnpm build:all
```

Production frontend start:
```bash
pnpm --dir frontend start
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `pnpm setup` | Full setup: install all deps + build |
| `pnpm install:all` | Install root, frontend, and backend deps |
| `pnpm build:all` | Build frontend + verify backend |
| `pnpm dev:frontend` | Start Next.js dev server (port 3000) |
| `pnpm backend:dev` | Start FastAPI dev server (port 8000) |
| `pnpm backend:start` | Start FastAPI production server |
| `pnpm backend:verify` | Check backend dependencies |

## Development Workflow

1. **First time setup:**
   ```bash
   ./setup.sh
   ```

2. **Daily development:**
   ```bash
   # Terminal A
   pnpm backend:dev
   
   # Terminal B
   pnpm dev:frontend
   ```

3. **Test production build:**
   ```bash
   pnpm build:all
   ```

## Backend Python Environment

The backend uses a Python virtual environment at `backend/venv/`.

To activate manually:
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

Install additional packages:
```bash
cd backend
source venv/bin/activate
pip install <package>
pip freeze > requirements.txt  # Update requirements
```

## Troubleshooting

### Backend won't start
```bash
# Verify dependencies
pnpm backend:verify

# Reinstall
pnpm backend:install
```

### Frontend build fails
```bash
# Clear cache and rebuild
rm -rf frontend/.next frontend/node_modules
pnpm build:frontend
```

### Port already in use
- Frontend (3000): `lsof -i :3000` and `kill -9 <PID>`
- Backend (8000): `lsof -i :8000` and `kill -9 <PID>`

## Environment Setup

Copy and configure environment files:

**Root `.env`:**
```bash
VITE_LOCAL_PIPELINE_URL=http://localhost:8000
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH=/api/local-pipeline
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<your_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

**Backend `.env`:**
```bash
SUPABASE_URL=<your_url>
SUPABASE_KEY=<your_key>
```

## CI/CD & Deployment

**Vercel (Frontend):**
1. Set **Root Directory** to `frontend`
2. Configure env vars in Vercel project settings

**FastAPI Backend:**
Deploy to your hosting (Railway, Fly.io, AWS EC2, etc.)

See [README.md](../README.md) and [docs/VERCEL_PRODUCTION_AUDIT.md](../docs/VERCEL_PRODUCTION_AUDIT.md) for deployment details.
