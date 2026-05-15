import { useCallback, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trash2, Wallet } from 'lucide-react';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/PageLoader';
import { financeApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { FinanceRecord, FinanceSummary } from '../types';

export function Finance() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([financeApi.list(), financeApi.summary()]);
      setRecords(list);
      setSummary(sum);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar finanzas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !category.trim()) {
      showToast('Indica monto y categoría válidos', 'info');
      return;
    }
    setSaving(true);
    try {
      await financeApi.create({ type, amount: num, category: category.trim() });
      setAmount('');
      setCategory('');
      showToast('Registro guardado', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo registrar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await financeApi.remove(deleteId);
      showToast('Movimiento eliminado', 'success');
      setDeleteId(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  const pieData = [
    { name: 'Ingresos', value: summary?.income ?? 0, color: '#34d399' },
    { name: 'Gastos', value: summary?.expense ?? 0, color: '#f87171' },
  ];

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Finanzas</h1>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-zinc-500 text-sm">Ingresos</p>
          <p className="text-2xl font-bold text-emerald-400">+${summary?.income ?? 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Gastos</p>
          <p className="text-2xl font-bold text-red-400">-${summary?.expense ?? 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Balance</p>
          <p className="text-2xl font-bold text-white">${summary?.balance ?? 0}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-white font-semibold mb-4">Distribución</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c1c2e', border: 'none', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-white font-semibold mb-4">Nuevo registro</h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400'}`}>
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>
              Ingreso
            </button>
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto"
            type="number"
            className="w-full mb-2 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoría"
            className="w-full mb-3 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={add}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg">
            Registrar
          </button>
        </Card>
      </div>

      <Card>
        <h2 className="text-white font-semibold mb-4">Historial</h2>
        {records.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sin movimientos"
            description="Registra ingresos y gastos para ver el historial aquí."
          />
        ) : (
          records.map((r) => (
            <div key={r.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 gap-2">
              <div>
                <p className="text-white">{r.category}</p>
                <p className="text-zinc-500 text-xs">{new Date(r.createdAt).toLocaleDateString('es')}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className={r.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}>
                  {r.type === 'INCOME' ? '+' : '-'}${r.amount}
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteId(r.id)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                  aria-label="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar movimiento"
        message="Se quitará este registro del balance."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
