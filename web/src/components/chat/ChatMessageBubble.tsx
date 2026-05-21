import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export function ChatMessageBubble({ role, content, createdAt }: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-[#1c1c2e] border border-white/10 text-zinc-200 rounded-bl-md'
        }`}>
        <p className="whitespace-pre-wrap">{content}</p>
        {createdAt && (
          <p className={`text-[10px] mt-2 ${isUser ? 'text-violet-200/70' : 'text-zinc-500'}`}>
            {new Date(createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
        {!isUser && (
          <button
            type="button"
            onClick={copy}
            className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 border border-white/10 rounded-lg p-1.5 text-zinc-400 hover:text-white"
            aria-label="Copiar respuesta">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#1c1c2e] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
        <span className="text-zinc-500 text-xs ml-2">Mentor escribiendo...</span>
      </div>
    </div>
  );
}
