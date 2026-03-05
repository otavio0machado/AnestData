import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware, adminOnly);

router.get('/dashboard', async (_req, res) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const [totalHoje, pendentesEnvio, emAberto, totalGeral] = await Promise.all([
    prisma.boletim.count({ where: { dataCirurgia: { gte: hoje, lt: amanha } } }),
    prisma.boletim.count({ where: { status: 'FINALIZADO', statusCobranca: 'PENDENTE' } }),
    prisma.boletim.count({ where: { statusCobranca: { in: ['PENDENTE', 'ENVIADO'] } } }),
    prisma.boletim.count(),
  ]);

  res.json({ totalHoje, pendentesEnvio, emAberto, totalGeral });
});

router.get('/mensal', async (req, res) => {
  const { ano, mes } = req.query as { ano?: string; mes?: string };
  const year = parseInt(ano || String(new Date().getFullYear()));
  const month = parseInt(mes || String(new Date().getMonth() + 1));

  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const boletins = await prisma.boletim.findMany({
    where: { dataCirurgia: { gte: inicio, lt: fim } },
    include: {
      patient: { select: { nome: true } },
      user: { select: { nome: true } },
    },
    orderBy: { dataCirurgia: 'asc' },
  });

  res.json(boletins);
});

export default router;
