import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (_req, res) => {
  const convenios = await prisma.convenio.findMany({ orderBy: { nome: 'asc' } });
  res.json(convenios);
});

router.post('/', adminOnly, async (req, res) => {
  const convenio = await prisma.convenio.create({ data: req.body });
  res.status(201).json(convenio);
});

export default router;
