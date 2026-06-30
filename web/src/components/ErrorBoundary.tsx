import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Sentry } from '../lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
          <div className="max-w-md text-center rounded-2xl border border-white/10 bg-[#14141f] p-8">
            <h1 className="text-xl font-bold text-white mb-2">Algo salió mal</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Recarga la página. Si persiste, contacta soporte en hola@ascendx.ai
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/dashboard')}
              className="brand-btn-primary px-6 py-2.5 rounded-lg text-white font-medium">
              Ir al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
