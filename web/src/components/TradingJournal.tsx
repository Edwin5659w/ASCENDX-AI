import { useCallback, useEffect, useState } from 'react';
import { LineChart, Plus, Trash2 } from 'lucide-react';
import { Card } from './Card';
import { EmptyState } from './ui/EmptyState';
import { tradesApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Trade, TradeSummary } from '../types';
import {
  TRADE_EMOTION_TAGS,
  TRADING_DISCLAIMER,
  formatTradeSide,
} from '@shared/trading-helpers';

export function TradingJournal() {
  const { showToast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [emotion, setEmotion] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([tradesApi.list(), tradesApi.summary()]);
      setTrades(list);
      setSummary(sum);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar diario', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    const q = parseFloat(quantity.replace(',', '.'));
    const p = parseFloat(price.replace(',', '.'));
    if (!symbol.trim() || !q || q <= 0 || !p || p <= 0) {
      showToast('Símbolo, cantidad y precio obligatorios', 'info');
      return;
    }
    setSaving(true);
    try {
      await tradesApi.create({
        symbol: symbol.trim(),
        side,
        quantity: q,
        price: p,
        pnl: pnl.trim() ? parseFloat(pnl.replace(',', '.')) : undefined,
        emotionTag: emotion ?? undefined,
        note: note.trim() || undefined,
      });
      setSymbol('');
      setQuantity('');
      setPrice('');
      setPnl('');
      setNote('');
      setEmotion(null);
      showToast('Operación registrada', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await tradesApi.remove(id);
      showToast('Operación eliminada', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-zinc-500 text-xs italic">{TRADING_DISCLAIMER}</p>
      {summary ? (
        <Card className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-zinc-500 text-xs">Operaciones</p>
            <p className="text-white font-bold text-lg">{summary.totalTrades}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">P&L total</p>
            <p className={`font-bold text-lg ${summary.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.totalPnl >= 0 ? '+' : ''}
              {summary.totalPnl.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">W / L</p>
            <p className="text-white font-bold text-lg">
              {summary.wins} / {summary.losses}
            </p>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <LineChart size={18} /> Nueva operación
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex-1 py-2 rounded-lg text-sm ${side === 'BUY' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
            Compra
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex-1 py-2 rounded-lg text-sm ${side === 'SELL' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
            Venta
          </button>
        </div>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Símbolo"
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2 text-white"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Cantidad"
            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Precio"
            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="P&L"
            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TRADE_EMOTION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setEmotion(emotion === tag ? null : tag)}
              className={`text-xs px-2 py-1 rounded-full border ${
                emotion === tag ? 'border-violet-500 text-violet-300' : 'border-white/10 text-zinc-500'
              }`}>
              {tag}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota opcional"
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2 text-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg">
          <Plus size={18} /> Registrar
        </button>
      </Card>

      {trades.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Diario vacío"
          description="Anota operaciones y emociones para reflexionar — sin asesoría financiera."
        />
      ) : (
        <div className="space-y-2">
          {trades.map((t) => (
            <Card key={t.id} className="flex justify-between items-start gap-3">
              <div>
                <p className="text-white font-semibold">{t.symbol}</p>
                <p className="text-zinc-500 text-sm">
                  {formatTradeSide(t.side)} · {t.quantity} @ {t.price}
                </p>
                {t.emotionTag ? <p className="text-violet-400 text-xs mt-1">{t.emotionTag}</p> : null}
                {t.pnl != null ? (
                  <p className={`text-sm mt-1 font-medium ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    P&L: {t.pnl >= 0 ? '+' : ''}
                    {t.pnl.toFixed(2)}
                  </p>
                ) : null}
              </div>
              <button type="button" onClick={() => remove(t.id)} className="text-zinc-500 hover:text-red-400 p-1">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
