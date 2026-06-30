import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { userApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import { Card } from './Card';

interface Partner {
  id: string;
  name: string;
  ascendScore: number;
  ascendLabel: string;
}

export function AccountabilityPanel() {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [linkCode, setLinkCode] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [c, p] = await Promise.all([userApi.accountabilityCode(), userApi.accountabilityPartners()]);
      setCode(c.code);
      setPartners(p);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const link = async () => {
    if (!linkCode.trim()) return;
    try {
      await userApi.linkAccountability(linkCode.trim());
      showToast('Compañero vinculado', 'success');
      setLinkCode('');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo vincular', 'error');
    }
  };

  if (loading) return null;

  return (
    <Card className="mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="text-cyan-400" size={20} />
        <h3 className="text-white font-semibold">Modo accountability</h3>
      </div>
      <p className="text-zinc-500 text-xs">
        Comparte tu código. Tu compañero solo ve tu Ascenso Score — no tus datos privados.
      </p>
      <code className="block text-center text-cyan-300 font-mono text-lg tracking-widest py-2 bg-[#0a0a0f] rounded-lg">
        {code}
      </code>
      <div className="flex gap-2">
        <input
          value={linkCode}
          onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
          placeholder="Código de compañero"
          className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white text-sm uppercase"
        />
        <button
          type="button"
          onClick={() => void link()}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
          Vincular
        </button>
      </div>
      {partners.length > 0 ? (
        <ul className="space-y-2 pt-2 border-t border-white/10">
          {partners.map((p) => (
            <li key={p.id} className="flex justify-between text-sm">
              <span className="text-zinc-300">{p.name}</span>
              <span className="text-violet-300 font-medium">
                {p.ascendScore} · {p.ascendLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
