import { Link } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';

import { CookieConsent } from './CookieConsent';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="xs" />
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors">
              Precios
            </Link>
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="brand-btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white">
              Empezar gratis
            </Link>
          </nav>
          <Link
            to="/register"
            className="sm:hidden brand-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
            Empezar
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 mt-20 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} ASCENDX AI — Life OS con mentor IA</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-zinc-300">
              Privacidad
            </Link>
            <Link to="/terms" className="hover:text-zinc-300">
              Términos
            </Link>
            <Link to="/pricing" className="hover:text-zinc-300">
              Precios
            </Link>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
