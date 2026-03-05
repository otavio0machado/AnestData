import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', adminOnly, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, role: true, cremers: true, ativo: true },
    orderBy: { nome: 'asc' },
  });
  res.json(users);
});

router.post('/', adminOnly, async (req, res) => {
  const { nome, email, senha, role, cremers } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  const user = await prisma.user.create({
    data: { nome, email, senhaHash: hash, role, cremers },
    select: { id: true, nome: true, email: true, role: true, cremers: true },
  });
  res.status(201).json(user);
});

router.patch('/:id', adminOnly, async (req, res) => {
  const { senha, ...data } = req.body;
  const update: Record<string, unknown> = { ...data };
  if (senha) update.senhaHash = await bcrypt.hash(senha, 10);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: update,
    select: { id: true, nome: true, email: true, role: true, cremers: true, ativo: true },
  });
  res.json(user);
});

router.get('/medicos', async (_req: AuthRequest, res) => {
  const medicos = await prisma.user.findMany({
    where: { role: 'MEDICO', ativo: true },
    select: { id: true, nome: true, cremers: true },
    orderBy: { nome: 'asc' },
  });
  res.json(medicos);
});

export default router;
