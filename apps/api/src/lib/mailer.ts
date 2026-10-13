import { isProduction } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Envío de correos. El proveedor de correo transaccional está «a verificar»
 * en el Documento Maestro v2 (sección 4). Mientras no se elija:
 * - En desarrollo, el mensaje se muestra en la consola de la API para poder probar.
 * - En producción no se muestra nunca; se registra un error para configurar el proveedor.
 */
export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

class DevelopmentConsoleMailer implements Mailer {
  async send(message: { to: string; subject: string; text: string }) {
    // Solo en desarrollo: nunca debe usarse con datos reales.
    console.log(`\n✉️  [Correo de desarrollo] Para: ${message.to}\n   Asunto: ${message.subject}\n   ${message.text}\n`);
  }
}

class MissingProviderMailer implements Mailer {
  async send() {
    logger.error('No hay proveedor de correo configurado: no se pudo enviar un correo transaccional');
  }
}

export const mailer: Mailer = isProduction ? new MissingProviderMailer() : new DevelopmentConsoleMailer();
