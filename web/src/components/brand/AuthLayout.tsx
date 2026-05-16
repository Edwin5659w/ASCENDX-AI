import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';
import { BrandPattern } from './BrandPattern';

interface AuthLayoutProps {
  children: ReactNode;
  subtitle: string;
  title?: string;
}

export function AuthLayout({ children, subtitle, title }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 overflow-hidden">
      <BrandPattern />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#12081f]/80 to-[#0a0a0f]"
        aria-hidden
      />
      <div className="relative w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size="md" animate breathe />
          {title ? (
            <h1 className="mt-6 text-xl font-semibold text-white text-center">{title}</h1>
          ) : null}
          <p className={`text-center text-zinc-500 text-sm ${title ? 'mt-2' : 'mt-6'}`}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
