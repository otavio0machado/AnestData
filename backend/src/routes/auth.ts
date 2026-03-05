import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.ativo) return res.status(401).json({ error: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = generateToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
  res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role, cremers: user.cremers } });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, nome: true, email: true, role: true, cremers: true },
  });
  res.json(user);
});

export default router;
