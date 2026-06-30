import { MarketingLayout } from '../components/marketing/MarketingLayout';

export function Privacy() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 prose prose-invert prose-zinc">
        <h1 className="text-3xl font-bold text-white mb-6">Política de privacidad</h1>
        <p className="text-zinc-400 text-sm mb-8">Última actualización: junio 2026</p>

        <section className="space-y-4 text-zinc-400 text-sm leading-relaxed">
          <h2 className="text-white text-lg font-semibold">1. Datos que recopilamos</h2>
          <p>
            Nombre, email, objetivos, tareas, hábitos, registros financieros y conversaciones con el mentor IA.
            No vendemos tus datos a terceros.
          </p>

          <h2 className="text-white text-lg font-semibold">2. Proveedores de servicio</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-zinc-300">Neon</strong> — base de datos PostgreSQL donde se almacenan tus datos.
            </li>
            <li>
              <strong className="text-zinc-300">OpenAI</strong> — procesamiento del mentor IA (resumen JSON de tu perfil y mensajes).
            </li>
            <li>
              <strong className="text-zinc-300">Stripe</strong> — pagos del plan Pro (no almacenamos números de tarjeta).
            </li>
            <li>
              <strong className="text-zinc-300">Resend</strong> — emails transaccionales (recuperación de contraseña, retención si activas emails).
            </li>
          </ul>

          <h2 className="text-white text-lg font-semibold">3. Cookies y analítica</h2>
          <p>
            Usamos cookies esenciales para mantener tu sesión. Si aceptas el banner de cookies, podemos registrar
            eventos anónimos (registro, tour completado) para mejorar el producto. Puedes rechazarlas cerrando el
            banner sin afectar el uso básico de la app.
          </p>

          <h2 className="text-white text-lg font-semibold">4. Uso de la IA</h2>
          <p>
            El mentor IA procesa un resumen JSON de tu perfil para generar planes y respuestas. Los mensajes se
            envían a OpenAI bajo sus políticas de privacidad. Puedes borrar tu historial de chat en cualquier momento.
          </p>

          <h2 className="text-white text-lg font-semibold">5. Seguridad</h2>
          <p>
            Contraseñas hasheadas con bcrypt, tokens JWT con rotación, HTTPS en producción y rate limiting en la API.
          </p>

          <h2 className="text-white text-lg font-semibold">6. Tus derechos</h2>
          <p>
            Puedes actualizar tu perfil, cambiar contraseña, exportar datos (plan Pro) y eliminar tu cuenta desde la
            app (Perfil → Zona de peligro). Al eliminar la cuenta se borran todos tus datos de forma permanente.
          </p>

          <h2 className="text-white text-lg font-semibold">7. Contacto</h2>
          <p>Para consultas de privacidad: privacidad@ascendx.ai</p>
        </section>
      </article>
    </MarketingLayout>
  );
}
