import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw, Send, Sparkles } from 'lucide-react';
import { aiApi, type AIContextLevel } from '../api/services';
import { Card } from '../components/Card';
import { ChatMessageBubble, ChatTypingIndicator } from '../components/chat/ChatMessageBubble';
import { ChatSkeleton } from '../components/ChatSkeleton';
import { MethodologyHint } from '../components/MethodologyHint';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SuggestedPrompts } from '../components/SuggestedPrompts';
import { useToast } from '../context/ToastContext';
import { CONTEXT_LEVEL_LABELS, insightTypeLabel } from '@shared/chat-helpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const INTRO: Record<AIContextLevel, string> = {
  empty:
    'Hola, soy tu mentor ASCENDX. Tu perfil está vacío: puedo ayudarte a definir tu primer objetivo, tareas y hábito. Elige una sugerencia o escribe tu meta.',
  partial:
    'Hola, soy tu mentor ASCENDX. Veo que empezaste a configurar tu espacio. Te ayudo a completar lo que falta y a priorizar tu día.',
  ready:
    'Hola, soy tu mentor ASCENDX. Tengo contexto de tus objetivos, tareas y hábitos. ¿Qué quieres mejorar hoy?',
};

const CONTEXT_BADGE: Record<AIContextLevel, string> = {
  empty: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  partial: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
};

export function Chat() {
  const location = useLocation();
  const { showToast } = useToast();
  const prefill = (location.state as { prefill?: string } | null)?.prefill;
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState<{ id: string; type: string; message: string; createdAt: string }[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [contextLevel, setContextLevel] = useState<AIContextLevel>('empty');
  const [bootLoading, setBootLoading] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillHandled = useRef(false);

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  useEffect(() => {
    let alive = true;
    Promise.all([aiApi.insights(), aiApi.context(), aiApi.chatHistory()])
      .then(([ins, ctx, history]) => {
        if (!alive) return;
        setInsights(ins);
        setSuggestedPrompts(ctx.suggestedPrompts);
        setContextLevel(ctx.contextLevel);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{ id: 'intro', role: 'assistant', content: INTRO[ctx.contextLevel] }]);
        }
      })
      .catch(() => {
        if (alive) {
          setMessages([
            { id: '0', role: 'assistant', content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?' },
          ]);
        }
      })
      .finally(() => {
        if (alive) setBootLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      if (!text || loading) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setLoading(true);
      scrollBottom();
      try {
        const { reply, suggestedPrompts: nextPrompts, contextLevel: level } = await aiApi.chat(text);
        setSuggestedPrompts(nextPrompts);
        setContextLevel(level);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: e instanceof Error ? e.message : 'Error de conexión',
          },
        ]);
      } finally {
        setLoading(false);
        scrollBottom();
      }
    },
    [loading],
  );

  useEffect(() => {
    if (!prefill || bootLoading || prefillHandled.current) return;
    prefillHandled.current = true;
    void sendText(prefill);
  }, [bootLoading, prefill, sendText]);

  const send = () => void sendText(input.trim());

  const confirmClear = async () => {
    try {
      await aiApi.clearChatHistory();
      setMessages([{ id: 'intro', role: 'assistant', content: INTRO[contextLevel] }]);
      setClearOpen(false);
      showToast('Conversación reiniciada', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo limpiar', 'error');
    }
  };

  const ctxMeta = CONTEXT_LEVEL_LABELS[contextLevel];

  if (bootLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-white">Mentor IA</h1>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CONTEXT_BADGE[contextLevel]}`}>
            {ctxMeta?.label ?? contextLevel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setClearOpen(true)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
          <RotateCcw size={14} />
          Nueva conversación
        </button>
      </div>

      <div className="shrink-0 mb-2">
        <MethodologyHint module="ai" />
      </div>

      {insights.length > 0 && (
        <Card className="mb-3 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-violet-400" size={18} />
            <h2 className="text-sm font-semibold text-white">Insights del mentor</h2>
          </div>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {insights.slice(0, 5).map((ins) => (
              <li key={ins.id} className="text-zinc-400 text-xs border-l-2 border-violet-500/50 pl-2">
                <span className="text-violet-400 text-[10px] font-semibold uppercase">
                  {insightTypeLabel(ins.type)}
                </span>
                <p className="text-zinc-300 mt-0.5 line-clamp-3">{ins.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-0">
        {messages.map((m) => (
          <ChatMessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
        ))}
        {loading && <ChatTypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 pt-3">
        <SuggestedPrompts prompts={suggestedPrompts} onSelect={(p) => void sendText(p)} disabled={loading} />
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escribe a tu mentor... (Enter envía, Shift+Enter nueva línea)"
              rows={2}
              maxLength={4000}
              className="w-full bg-[#1c1c2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
            <span className="absolute right-3 bottom-2 text-[10px] text-zinc-600">{input.length}/4000</span>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white p-3 rounded-xl shrink-0 mb-5">
            <Send size={20} />
          </button>
        </div>
        <p className="text-zinc-600 text-[10px] mt-2 text-center">
          No sustituye asesoría profesional. Usa tus datos reales en la app para mejores respuestas.
        </p>
      </div>

      <ConfirmDialog
        open={clearOpen}
        title="Nueva conversación"
        message="Se borrará el historial de chat guardado. Los insights de plan y procrastinación se mantienen."
        onConfirm={confirmClear}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}
