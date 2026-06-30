import { MarketingLayout } from '../components/marketing/MarketingLayout';

export function Terms() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-6">Términos de servicio</h1>
        <p className="text-zinc-400 text-sm mb-8">Última actualización: junio 2026</p>

        <section className="space-y-4 text-zinc-400 text-sm leading-relaxed">
          <h2 className="text-white text-lg font-semibold">1. Servicio</h2>
          <p>
            ASCENDX AI es una plataforma de productividad personal (Life OS) con funciones de IA. No constituye
            asesoría financiera, médica ni psicológica profesional.
          </p>

          <h2 className="text-white text-lg font-semibold">2. Cuenta</h2>
          <p>
            Eres responsable de mantener la confidencialidad de tu contraseña. Debes tener al menos 16 años para
            registrarte. Al crear cuenta aceptas estos términos y nuestra política de privacidad.
          </p>

          <h2 className="text-white text-lg font-semibold">3. Planes y pagos</h2>
          <p>
            El plan Gratis es perpetuo y no requiere tarjeta. El plan Pro se factura mensualmente ($4.99/mes) a través
            de Stripe. Puedes cancelar en cualquier momento desde Perfil → Gestionar suscripción. No hay permanencia.
          </p>

          <h2 className="text-white text-lg font-semibold">4. Uso aceptable</h2>
          <p>
            No uses la plataforma para actividades ilegales, spam o intentos de vulnerar la seguridad del sistema.
          </p>

          <h2 className="text-white text-lg font-semibold">5. Limitación de responsabilidad</h2>
          <p>
            ASCENDX AI se ofrece &quot;tal cual&quot;. Las sugerencias de la IA son orientativas; las decisiones finales
            son tuyas.
          </p>

          <h2 className="text-white text-lg font-semibold">6. Contacto</h2>
          <p>legal@ascendx.ai</p>
        </section>
      </article>
    </MarketingLayout>
  );
}
