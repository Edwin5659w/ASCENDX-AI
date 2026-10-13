/**
 * Datos iniciales (idempotente, se puede ejecutar varias veces):
 * - Categorías por defecto del sistema (user_id = null).
 * - Fila única de configuración global (app_settings) con los límites de IA.
 *
 * No crea usuarios ni datos financieros. La tasa de usura de referencia NO se
 * inventa: se registra a mano con su fecha cuando se consulte la vigente.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type CategoryKind } from '../src/generated/prisma/client.js';

// En producción solo se permite de forma explícita (render.yaml lo hace al arrancar):
// únicamente crea categorías del sistema y la configuración global, nunca datos de usuarios.
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  console.error('El seed está bloqueado en producción (usa ALLOW_PROD_SEED=true).');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const defaultCategories: { name: string; kind: CategoryKind; icon: string; color: string }[] = [
  // Ingresos
  { name: 'Salario', kind: 'ingreso', icon: 'payments', color: '#2DD4BF' },
  { name: 'Trabajo independiente', kind: 'ingreso', icon: 'work', color: '#22C55E' },
  { name: 'Negocio propio', kind: 'ingreso', icon: 'storefront', color: '#10B981' },
  { name: 'Otros ingresos', kind: 'ingreso', icon: 'add_circle', color: '#5EEAD4' },
  // Gastos
  { name: 'Vivienda', kind: 'gasto', icon: 'home', color: '#818CF8' },
  { name: 'Servicios públicos', kind: 'gasto', icon: 'bolt', color: '#F59E0B' },
  { name: 'Mercado', kind: 'gasto', icon: 'shopping_cart', color: '#FB923C' },
  { name: 'Restaurantes y domicilios', kind: 'gasto', icon: 'restaurant', color: '#F97316' },
  { name: 'Transporte', kind: 'gasto', icon: 'directions_bus', color: '#38BDF8' },
  { name: 'Salud', kind: 'gasto', icon: 'favorite', color: '#FB7185' },
  { name: 'Educación', kind: 'gasto', icon: 'school', color: '#A78BFA' },
  { name: 'Entretenimiento', kind: 'gasto', icon: 'movie', color: '#F472B6' },
  { name: 'Ropa y cuidado personal', kind: 'gasto', icon: 'checkroom', color: '#C084FC' },
  { name: 'Celular e internet', kind: 'gasto', icon: 'wifi', color: '#60A5FA' },
  { name: 'Otros gastos', kind: 'gasto', icon: 'more_horiz', color: '#94A3B8' },
];

async function main() {
  let created = 0;
  for (const category of defaultCategories) {
    // Prisma no permite upsert con user_id null en la clave compuesta, por eso se busca primero.
    const exists = await prisma.category.findFirst({
      where: { userId: null, name: category.name, kind: category.kind },
      select: { id: true },
    });
    if (!exists) {
      await prisma.category.create({ data: { ...category, isDefault: true } });
      created++;
    }
  }
  await prisma.appSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  console.log(`Categorías por defecto: ${created} creadas, ${defaultCategories.length - created} ya existían.`);
  console.log('Configuración global lista (app_settings).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
