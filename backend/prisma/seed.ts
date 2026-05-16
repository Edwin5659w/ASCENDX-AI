import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ No ejecutes el seed en producción (NODE_ENV=production).');
    process.exit(1);
  }
  await prisma.badge.createMany({
    data: [
      { id: 'FIRST_TASK', title: 'En marcha', subtitle: 'Primera tarea completada', sortOrder: 1 },
      { id: 'STREAK_7', title: 'Constancia', subtitle: 'Racha de 7 días o más', sortOrder: 2 },
      { id: 'GOALS_3', title: 'Visionario', subtitle: '3 o más objetivos creados', sortOrder: 3 },
      { id: 'LEVEL_5', title: 'Ascenso', subtitle: 'Alcanza el nivel 5', sortOrder: 4 },
      { id: 'STEEL', title: 'Acero', subtitle: '3 hábitos y racha 3+', sortOrder: 5 },
      { id: 'XP_500', title: 'Veterano', subtitle: '500 XP totales', sortOrder: 6 },
    ],
    skipDuplicates: true,
  });

  const password = await bcrypt.hash('Demo1234!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@ascendx.ai' },
    update: { onboardingDone: true },
    create: {
      name: 'Usuario Demo',
      email: 'demo@ascendx.ai',
      password,
      xp: 120,
      level: 2,
      onboardingDone: true,
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        title: 'Lanzar ASCENDX AI',
        description: 'Completar MVP del producto',
        category: 'Trabajo',
        priority: 'HIGH',
        progress: 65,
        userId: user.id,
      },
      {
        title: 'Rutina de ejercicio',
        category: 'Salud',
        priority: 'MEDIUM',
        progress: 30,
        userId: user.id,
      },
    ],
    skipDuplicates: true,
  });

  const goal = await prisma.goal.findFirst({ where: { userId: user.id } });

  await prisma.task.createMany({
    data: [
      { title: 'Configurar base de datos Neon', completed: true, userId: user.id, goalId: goal?.id },
      { title: 'Probar app móvil', completed: false, userId: user.id, goalId: goal?.id },
      { title: 'Revisar dashboard web', completed: false, userId: user.id },
    ],
  });

  await prisma.habit.createMany({
    data: [
      { name: 'Meditar 10 min', frequency: 'DAILY', streak: 5, userId: user.id },
      { name: 'Leer 20 páginas', frequency: 'DAILY', streak: 3, userId: user.id },
    ],
  });

  await prisma.financeRecord.createMany({
    data: [
      { type: 'INCOME', amount: 2500, category: 'Salario', userId: user.id },
      { type: 'EXPENSE', amount: 45.5, category: 'Comida', userId: user.id },
      { type: 'EXPENSE', amount: 120, category: 'Transporte', userId: user.id },
    ],
  });

  console.log('✅ Seed completado — demo@ascendx.ai / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
