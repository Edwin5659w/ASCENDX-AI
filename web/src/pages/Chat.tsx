import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { aiApi, type AIContextLevel } from '../api/services';
import { Card } from '../components/Card';
import { ChatSkeleton } from '../components/ChatSkeleton';
import { SuggestedPrompts } from '../components/SuggestedPrompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INTRO: Record<AIContextLevel, string> = {
  empty:
    'Hola, soy tu mentor ASCENDX. Tu perfil está vacío: puedo ayudarte a definir tu primer objetivo, tareas y hábito. Elige una sugerencia o escribe tu meta.',
  partial:
    'Hola, soy tu mentor ASCENDX. Veo que empezaste a configurar tu espacio. Te ayudo a completar lo que falta y a priorizar tu día.',
  ready:
    'Hola, soy tu mentor ASCENDX. Tengo contexto de tus objetivos, tareas y hábitos. ¿Qué quieres mejorar hoy?',
};

export function Chat() {
  const location = useLocation();
  const prefill = (location.state as { prefill?: string } | null)?.prefill;
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState<{ id: string; type: string; message: string }[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillHandled = useRef(false);

  useEffect(() => {
    let alive = true;
    Promise.all([aiApi.insights(), aiApi.context()])
      .then(([ins, ctx]) => {
        if (!alive) return;
        setInsights(ins);
        setSuggestedPrompts(ctx.suggestedPrompts);
        setMessages([{ id: '0', role: 'assistant', content: INTRO[ctx.contextLevel] }]);
      })
      .catch(() => {
        if (alive) {
          setMessages([
            {
              id: '0',
              role: 'assistant',
              content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?',
            },
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

  const sendText = useCallback(async (text: string) => {
    if (!text || loading) return;
    setMessages((m) => [...m, { id: Date.now().toString(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const { reply, suggestedPrompts: nextPrompts } = await aiApi.chat(text);
      setSuggestedPrompts(nextPrompts);
      setMessages((m) => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Error de conexión',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [loading]);

  useEffect(() => {
    if (!prefill || bootLoading || prefillHandled.current) return;
    prefillHandled.current = true;
    void sendText(prefill);
  }, [bootLoading, prefill, sendText]);

  const send = () => void sendText(input.trim());

  if (bootLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold text-white mb-4">Mentor IA</h1>

      {insights.length > 0 && (
        <Card className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-violet-400" size={18} />
            <h2 className="text-sm font-semibold text-white">Insights recientes</h2>
          </div>
          <ul className="space-y-2 max-h-28 overflow-y-auto">
            {insights.slice(0, 5).map((ins) => (
              <li key={ins.id} className="text-zinc-400 text-xs border-l-2 border-violet-500/50 pl-2">
                <span className="text-violet-400 uppercase text-[10px]">{ins.type}</span>
                <p className="text-zinc-300 mt-0.5">{ins.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-violet-600 text-white'
                : 'bg-[#1c1c2e] border border-white/10 text-zinc-200'
            }`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <SuggestedPrompts prompts={suggestedPrompts} onSelect={(p) => void sendText(p)} disabled={loading} />

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escribe a tu mentor..."
          className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white p-3 rounded-xl">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
