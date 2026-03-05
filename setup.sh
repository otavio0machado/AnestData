#!/bin/bash
set -e

echo "=== AnestésioApp Setup ==="

# Backend
echo "→ Instalando dependências do backend..."
cd backend
cp .env.example .env
npm install
cd ..

# Frontend
echo "→ Instalando dependências do frontend..."
cd frontend
npm install
cd ..

echo ""
echo "=== Setup concluído! ==="
echo ""
echo "Para rodar o app, você precisa de um PostgreSQL rodando."
echo ""
echo "Opção 1 — Docker (recomendado):"
echo "  docker compose up -d postgres"
echo "  cd backend && npx prisma db push && npm run db:seed"
echo ""
echo "Opção 2 — Banco local já rodando:"
echo "  Edite backend/.env com sua DATABASE_URL"
echo "  cd backend && npx prisma db push && npm run db:seed"
echo ""
echo "Para iniciar em desenvolvimento:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Acesse: http://localhost:5173"
echo "  Admin:  admin@anestesio.com  /  admin123"
echo "  Médico: dr.silva@anestesio.com  /  medico123"
