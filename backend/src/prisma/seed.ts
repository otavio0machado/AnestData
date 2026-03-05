import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const medicoHash = await bcrypt.hash('medico123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@anestesio.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@anestesio.com',
      senhaHash: adminHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'dr.silva@anestesio.com' },
    update: {},
    create: {
      nome: 'Dr. Carlos Silva',
      email: 'dr.silva@anestesio.com',
      senhaHash: medicoHash,
      role: 'MEDICO',
      cremers: '12345',
    },
  });

  const convenios = ['UNIMED', 'BRADESCO SAÚDE', 'SULAMERICA', 'AMIL', 'CASSI', 'PARTICULAR'];
  for (const nome of convenios) {
    await prisma.convenio.upsert({
      where: { id: nome.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: { id: nome.toLowerCase().replace(/\s/g, '-'), nome },
    });
  }

  console.log('Seed concluído!');
  console.log('Admin: admin@anestesio.com / admin123');
  console.log('Médico: dr.silva@anestesio.com / medico123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
