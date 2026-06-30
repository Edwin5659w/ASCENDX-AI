import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { track } from '../../lib/analytics';
import type { User } from '../../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string; locale?: string },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  referralCode?: string;
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
  label?: 'signin' | 'signup';
}

export function GoogleSignInButton({
  referralCode,
  onSuccess,
  onError,
  label = 'signin',
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const mount = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const user = await loginWithGoogle(response.credential, referralCode);
            track('google_auth_complete');
            onSuccess(user);
          } catch (e) {
            onError(e instanceof Error ? e.message : 'No se pudo iniciar con Google');
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: label === 'signup' ? 'signup_with' : 'signin_with',
        locale: 'es',
      });
    };

    if (window.google?.accounts?.id) {
      mount();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = mount;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, referralCode, label, loginWithGoogle, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-zinc-500 text-xs">o continúa con</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <div ref={containerRef} className="flex justify-center min-h-[44px]" />
    </div>
  );
}
