/**
 * ASCENDX AI — `npm start`: abre la app en Expo, conectada al servidor en la nube.
 *
 * 1. Instala dependencias SOLO si cambiaron desde la última vez (p. ej. tras un git pull).
 * 2. Quita un apps/mobile/.env antiguo que apuntaba a una API local.
 * 3. Abre Expo en esta misma ventana: aparece el código QR para Expo Go.
 *
 * Para trabajar con la API y la base de datos en el computador: INICIAR-LOCAL.bat.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockFile = join(root, 'package-lock.json');
const stampFile = join(root, 'node_modules', '.ascendx-instalado');
const lockHash = () => createHash('sha1').update(readFileSync(lockFile)).digest('hex');

const upToDate = existsSync(stampFile) && readFileSync(stampFile, 'utf8') === lockHash();
if (!upToDate) {
  console.log('\n==> Instalando dependencias nuevas (solo esta vez)...\n');
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
  writeFileSync(stampFile, lockHash());
}

const oldEnv = join(root, 'apps', 'mobile', '.env');
if (existsSync(oldEnv) && !process.env.EXPO_PUBLIC_API_URL) {
  rmSync(oldEnv);
  console.log('Se quitó apps/mobile/.env antiguo: la app usa el servidor en la nube.');
}

const expo = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
  cwd: join(root, 'apps', 'mobile'),
  stdio: 'inherit',
  shell: true,
});
expo.on('exit', (code) => process.exit(code ?? 0));
