import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { aiApi } from '../api/services';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { id: Date.now().toString(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const { reply } = await aiApi.chat(text);
      setMessages((m) => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: e instanceof Error ? e.message : 'Error de conexión' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold text-white mb-4">Mentor IA</h1>
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
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escribe a tu mentor..."
          className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white p-3 rounded-xl">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
