import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/Card';
import { financeApi } from '../api/services';
import type { FinanceRecord, FinanceSummary } from '../types';

export function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const load = () => {
    financeApi.list().then(setRecords).catch(() => {});
    financeApi.summary().then(setSummary).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !category.trim()) return;
    await financeApi.create({ type, amount: num, category: category.trim() });
    setAmount('');
    setCategory('');
    load();
  };

  const pieData = [
    { name: 'Ingresos', value: summary?.income ?? 0, color: '#34d399' },
    { name: 'Gastos', value: summary?.expense ?? 0, color: '#f87171' },
  ];

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
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c1c2e', border: 'none', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-white font-semibold mb-4">Nuevo registro</h2>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400'}`}>
              Gasto
            </button>
            <button
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
          <button onClick={add} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg">
            Registrar
          </button>
        </Card>
      </div>

      <Card>
        <h2 className="text-white font-semibold mb-4">Historial</h2>
        {records.map((r) => (
          <div key={r.id} className="flex justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <p className="text-white">{r.category}</p>
              <p className="text-zinc-500 text-xs">{new Date(r.createdAt).toLocaleDateString('es')}</p>
            </div>
            <p className={r.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}>
              {r.type === 'INCOME' ? '+' : '-'}${r.amount}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}
