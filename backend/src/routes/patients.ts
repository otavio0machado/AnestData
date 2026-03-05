import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { q } = req.query as { q?: string };
  const patients = await prisma.patient.findMany({
    where: q ? { nome: { contains: q, mode: 'insensitive' } } : undefined,
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  res.json(patients);
});

router.post('/', async (req, res) => {
  const patient = await prisma.patient.create({ data: req.body });
  res.status(201).json(patient);
});

router.put('/:id', async (req, res) => {
  const patient = await prisma.patient.update({ where: { id: req.params.id }, data: req.body });
  res.json(patient);
});

export default router;
