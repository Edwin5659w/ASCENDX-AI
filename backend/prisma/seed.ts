/**
 * Datos iniciales: categorías predeterminadas del sistema (user_id = null).
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros.
 * No crea usuarios ni datos financieros de prueba.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type MovementType } from '../src/generated/prisma/client.js';

if (process.env.NODE_ENV === 'production') {
  console.error('El seed está bloqueado en producción.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const defaultCategories: { name: string; type: MovementType; icon: string; color: string }[] = [
  // Ingresos
  { name: 'Salario', type: 'INCOME', icon: 'briefcase', color: '#14B8A6' },
  { name: 'Trabajo independiente', type: 'INCOME', icon: 'laptop', color: '#22C55E' },
  { name: 'Negocio propio', type: 'INCOME', icon: 'store', color: '#10B981' },
  { name: 'Otros ingresos', type: 'INCOME', icon: 'plus-circle', color: '#5EEAD4' },
  // Gastos
  { name: 'Vivienda', type: 'EXPENSE', icon: 'home', color: '#6366F1' },
  { name: 'Servicios públicos', type: 'EXPENSE', icon: 'zap', color: '#F59E0B' },
  { name: 'Alimentación', type: 'EXPENSE', icon: 'shopping-cart', color: '#F97316' },
  { name: 'Transporte', type: 'EXPENSE', icon: 'bus', color: '#0EA5E9' },
  { name: 'Salud', type: 'EXPENSE', icon: 'heart', color: '#EF4444' },
  { name: 'Educación', type: 'EXPENSE', icon: 'book', color: '#8B5CF6' },
  { name: 'Entretenimiento', type: 'EXPENSE', icon: 'film', color: '#EC4899' },
  { name: 'Ropa', type: 'EXPENSE', icon: 'shirt', color: '#A855F7' },
  { name: 'Pago de deudas', type: 'EXPENSE', icon: 'credit-card', color: '#64748B' },
  { name: 'Otros gastos', type: 'EXPENSE', icon: 'more-horizontal', color: '#94A3B8' },
];

async function main() {
  let created = 0;
  for (const category of defaultCategories) {
    // Prisma no permite upsert con userId null en la clave compuesta, por eso se busca primero.
    const exists = await prisma.category.findFirst({
      where: { userId: null, name: category.name, type: category.type },
      select: { id: true },
    });
    if (!exists) {
      await prisma.category.create({ data: category });
      created++;
    }
  }
  console.log(`Categorías predeterminadas: ${created} creadas, ${defaultCategories.length - created} ya existían.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
