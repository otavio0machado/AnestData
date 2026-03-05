import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middlewares/auth';
import { generateBoletimPDF } from '../services/pdf';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Listar boletins
router.get('/', async (req: AuthRequest, res) => {
  const { data, medico, convenio, status, statusCobranca, page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (req.user!.role === 'MEDICO') where.userId = req.user!.id;
  if (data) {
    const d = new Date(data);
    const d2 = new Date(data);
    d2.setDate(d2.getDate() + 1);
    where.dataCirurgia = { gte: d, lt: d2 };
  }
  if (medico && req.user!.role === 'ADMIN') where.userId = medico;
  if (convenio) where.tipoConvenioNome = { contains: convenio, mode: 'insensitive' };
  if (status) where.status = status;
  if (statusCobranca) where.statusCobranca = statusCobranca;

  const [total, items] = await Promise.all([
    prisma.boletim.count({ where }),
    prisma.boletim.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { nome: true, prontuario: true } },
        user: { select: { nome: true, cremers: true } },
      },
    }),
  ]);

  res.json({ total, page: parseInt(page), items });
});

// Buscar boletim por ID
router.get('/:id', async (req: AuthRequest, res) => {
  const boletim = await prisma.boletim.findUnique({
    where: { id: req.params.id },
    include: {
      patient: true,
      user: { select: { nome: true, cremers: true, email: true } },
      convenio: true,
      assinatura: true,
    },
  });
  if (!boletim) return res.status(404).json({ error: 'Boletim não encontrado' });
  if (req.user!.role === 'MEDICO' && boletim.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  res.json(boletim);
});

// Criar boletim
router.post('/', async (req: AuthRequest, res) => {
  const { patient, assinatura, ...data } = req.body;

  let patientId = data.patientId;
  if (patient && !patientId) {
    const p = await prisma.patient.create({ data: patient });
    patientId = p.id;
  }

  const boletim = await prisma.boletim.create({
    data: { ...data, patientId, userId: req.user!.id },
    include: { patient: true },
  });

  if (assinatura) {
    await prisma.assinatura.create({ data: { boletimId: boletim.id, imagemBase64: assinatura } });
  }

  await prisma.auditLog.create({
    data: { userId: req.user!.id, boletimId: boletim.id, acao: 'CRIAR_BOLETIM' },
  });

  res.status(201).json(boletim);
});

// Atualizar boletim
router.put('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.boletim.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Boletim não encontrado' });
  if (req.user!.role === 'MEDICO' && existing.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { patient, assinatura, ...data } = req.body;

  if (patient && existing.patientId) {
    await prisma.patient.update({ where: { id: existing.patientId }, data: patient });
  }

  const boletim = await prisma.boletim.update({
    where: { id: req.params.id },
    data,
    include: { patient: true, assinatura: true },
  });

  if (assinatura) {
    await prisma.assinatura.upsert({
      where: { boletimId: boletim.id },
      update: { imagemBase64: assinatura },
      create: { boletimId: boletim.id, imagemBase64: assinatura },
    });
  }

  await prisma.auditLog.create({
    data: { userId: req.user!.id, boletimId: boletim.id, acao: 'ATUALIZAR_BOLETIM' },
  });

  res.json(boletim);
});

// Gerar PDF
router.get('/:id/pdf', async (req: AuthRequest, res) => {
  const boletim = await prisma.boletim.findUnique({
    where: { id: req.params.id },
    include: { patient: true, user: true, convenio: true, assinatura: true },
  });
  if (!boletim) return res.status(404).json({ error: 'Boletim não encontrado' });
  if (req.user!.role === 'MEDICO' && boletim.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const pdf = await generateBoletimPDF(boletim as Parameters<typeof generateBoletimPDF>[0]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="boletim_${boletim.patient?.prontuario || boletim.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('Erro PDF:', err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

// Admin: atualizar status de cobrança
router.patch('/:id/cobranca', adminOnly, async (req: AuthRequest, res) => {
  const { statusCobranca, obsAdmin } = req.body;
  const boletim = await prisma.boletim.update({
    where: { id: req.params.id },
    data: { statusCobranca, obsAdmin },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, boletimId: boletim.id, acao: `STATUS_COBRANCA_${statusCobranca}` },
  });
  res.json(boletim);
});

export default router;
