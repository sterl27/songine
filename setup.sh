#!/bin/bash

# Musaix Pro Full Stack Setup Script
# Automates frontend and backend installation and build

set -e

echo "🎵 Musaix Pro - Full Stack Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Install pnpm if not exists
echo -e "${BLUE}[1/5]${NC} Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm ready${NC}"

# 2. Install root dependencies
echo ""
echo -e "${BLUE}[2/5]${NC} Installing root dependencies..."
pnpm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"

# 3. Install frontend dependencies
echo ""
echo -e "${BLUE}[3/5]${NC} Installing frontend dependencies..."
pnpm --dir frontend install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# 4. Setup backend
echo ""
echo -e "${BLUE}[4/5]${NC} Setting up backend Python environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
. venv/bin/activate
pip install --upgrade pip
echo "Installing backend dependencies (this may take a few minutes)..."
pip install -r requirements.txt
cd ..
echo -e "${GREEN}✓ Backend environment ready${NC}"

# 5. Build frontend
echo ""
echo -e "${BLUE}[5/5]${NC} Building frontend..."
pnpm --dir frontend build
echo -e "${GREEN}✓ Frontend built${NC}"

echo ""
echo -e "${GREEN}=================================="
echo "✓ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "  Development:"
echo "    Terminal A: pnpm backend:dev"
echo "    Terminal B: pnpm dev:frontend"
echo ""
echo "  Or combined (may require process manager):"
echo "    pnpm start:all"
echo ""
echo "  Production build verification:"
echo "    pnpm build:all"
echo ""
echo "Open http://localhost:3000 when both are running"
