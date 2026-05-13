# 🎵 Musaix Pro - Quick Start

## First Time Setup

```bash
# Automated (recommended)
./setup.sh
```

Takes ~5-10 minutes depending on internet speed.

## Daily Development

```bash
# Terminal A - Backend
pnpm backend:dev

# Terminal B - Frontend  
pnpm dev:frontend
```

Open: **http://localhost:3000**

API docs: **http://localhost:8000/docs**

## Building

```bash
# Production build check
pnpm build:all

# Frontend only
pnpm build:frontend
```

## Commands Summary

| Task | Command |
|------|---------|
| Setup everything | `./setup.sh` |
| Install dependencies | `pnpm install:all` |
| Dev: Frontend | `pnpm dev:frontend` |
| Dev: Backend | `pnpm backend:dev` |
| Build: All | `pnpm build:all` |
| Build: Frontend | `pnpm build:frontend` |
| Verify backend | `pnpm backend:verify` |

## Project Structure

```
songine/
├── frontend/          # Next.js app (port 3000)
│   └── app/
├── backend/           # FastAPI (port 8000)
│   └── venv/         # Python virtual env
├── src/              # Shared React components
└── WORKFLOW.md       # Detailed workflow guide
```

## Troubleshooting

**Backend not starting?**
```bash
pnpm backend:verify
```

**Frontend build fails?**
```bash
rm -rf frontend/.next frontend/node_modules
pnpm build:frontend
```

**See full guide:** [WORKFLOW.md](./WORKFLOW.md)

---

✨ **Ready to develop!** Start with `./setup.sh`
