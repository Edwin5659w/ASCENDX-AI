import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  PiggyBank,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { FinanceSkeleton } from '../components/ui/FinanceSkeleton';
import { LoadMoreButton } from '../components/ui/LoadMoreButton';
import { TradingJournal } from '../components/TradingJournal';
import { financeApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useMoneyFormat } from '../hooks/useMoneyFormat';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useToast } from '../context/ToastContext';
import { MethodologyStrip } from '../components/MethodologyStrip';
import type { FinanceRecord, FinanceSummary } from '../types';
import {
  CATEGORY_CHART_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isOnboardingFinanceRecord,
} from '@shared/finance-helpers';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';
type FinanceTab = 'cashflow' | 'trading';

const tooltipStyle = {
  background: '#1c1c2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f4f4f5',
};

export function Finance() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatMoney, currency } = useMoneyFormat();
  const showTrading = user?.plan === 'PRO' && user?.tradingJournalEnabled === true;
  const [financeTab, setFinanceTab] = useState<FinanceTab>('cashflow');
  const fetchRecords = useCallback((page: number, limit: number) => financeApi.list(page, limit), []);
  const {
    items: records,
    loading: recordsLoading,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
  } = usePaginatedList<FinanceRecord>(fetchRecords);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');

  const categoryPresets = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await financeApi.summary());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar resumen', 'error');
    } finally {
      setSummaryLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const reload = useCallback(async () => {
    await refresh();
    await loadSummary();
  }, [refresh, loadSummary]);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setNote('');
    setType('EXPENSE');
    setEditingId(null);
  };

  const startEdit = (r: FinanceRecord) => {
    setEditingId(r.id);
    setAmount(String(r.amount));
    setCategory(r.category);
    setNote(r.note ?? '');
    setType(r.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (!num || num <= 0 || !category.trim()) {
      showToast('Indica monto y categoría válidos', 'info');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        amount: num,
        category: category.trim(),
        note: note.trim() || undefined,
      };
      if (editingId) {
        await financeApi.update(editingId, payload);
        showToast('Movimiento actualizado', 'success');
      } else {
        await financeApi.create(payload);
        showToast('Registro guardado', 'success');
      }
      resetForm();
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
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
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter !== 'ALL' && r.type !== filter) return false;
      if (search.trim() && !r.category.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [records, filter, search]);

  const pieData = useMemo(
    () => [
      { name: 'Ingresos', value: summary?.income ?? 0, color: '#34d399' },
      { name: 'Gastos', value: summary?.expense ?? 0, color: '#f87171' },
    ],
    [summary],
  );

  const expenseChartData = useMemo(
    () =>
      (summary?.expenseByCategory ?? []).slice(0, 8).map((c, i) => ({
        name: c.category.length > 10 ? `${c.category.slice(0, 9)}…` : c.category,
        fullName: c.category,
        total: c.total,
        fill: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
      })),
    [summary],
  );

  const monthlyChartData = summary?.monthly ?? [];

  const balancePositive = (summary?.balance ?? 0) >= 0;
  const hasChartData = (summary?.income ?? 0) > 0 || (summary?.expense ?? 0) > 0;

  if (recordsLoading || summaryLoading) return <FinanceSkeleton />;

  return (
    <div className="pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <p className="text-zinc-500 text-xs max-w-md">
          Control de flujo de caja para tu negocio o finanzas personales ({currency}). No constituye
          asesoría financiera ni de inversión.
        </p>
      </div>
      <MethodologyStrip module="finance" />

      {showTrading ? (
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFinanceTab('cashflow')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              financeTab === 'cashflow' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'
            }`}>
            Presupuesto
          </button>
          <button
            type="button"
            onClick={() => setFinanceTab('trading')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              financeTab === 'trading' ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400'
            }`}>
            Diario trading
          </button>
        </div>
      ) : null}

      {showTrading && financeTab === 'trading' ? <TradingJournal /> : null}

      {(!showTrading || financeTab === 'cashflow') ? (
      <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ArrowUpCircle size={18} />
            <p className="text-zinc-500 text-xs">Ingresos</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(summary?.income ?? 0)}</p>
        </Card>
        <Card className="border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <ArrowDownCircle size={18} />
            <p className="text-zinc-500 text-xs">Gastos</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatMoney(summary?.expense ?? 0)}</p>
        </Card>
        <Card className={balancePositive ? 'border-emerald-500/30' : 'border-red-500/30'}>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Wallet size={18} />
            <p className="text-zinc-500 text-xs">Balance</p>
          </div>
          <p className={`text-2xl font-bold ${balancePositive ? 'text-white' : 'text-red-300'}`}>
            {formatMoney(summary?.balance ?? 0)}
          </p>
        </Card>
        <Card className="border-violet-500/20">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <PiggyBank size={18} />
            <p className="text-zinc-500 text-xs">Tasa de ahorro</p>
          </div>
          <p className="text-2xl font-bold text-violet-300">{summary?.savingsRate ?? 0}%</p>
          <p className="text-zinc-600 text-[10px] mt-1">
            {summary?.totalRecords ?? 0} movimientos
            {summary?.topExpenseCategory ? ` · Top gasto: ${summary.topExpenseCategory}` : ''}
          </p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h2 className="text-white font-semibold mb-1">Ingresos vs gastos</h2>
          <p className="text-zinc-500 text-xs mb-4">Distribución del flujo total</p>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}>
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-500 text-sm">
              Registra movimientos para ver el gráfico
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-white font-semibold mb-1">Gastos por categoría</h2>
          <p className="text-zinc-500 text-xs mb-4">Dónde se va tu dinero</p>
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => formatMoney(v)}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {expenseChartData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-500 text-sm">
              Sin gastos registrados aún
            </div>
          )}
        </Card>
      </div>

      {/* Monthly + 50/30/20 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-cyan-400" size={18} />
            <h2 className="text-white font-semibold">Tendencia mensual</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="income" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="text-violet-400" size={18} />
            <h2 className="text-white font-semibold">Guía 50 / 30 / 20</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-4">Referencia según tus ingresos registrados</p>
          {summary?.budget503020 ? (
            <div className="space-y-4">
              {[
                { label: '50% Necesidades', value: summary.budget503020.needs, color: 'bg-violet-500', pct: 50 },
                { label: '30% Deseos', value: summary.budget503020.wants, color: 'bg-cyan-500', pct: 30 },
                { label: '20% Ahorro', value: summary.budget503020.savings, color: 'bg-emerald-500', pct: 20 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{row.label}</span>
                    <span className="text-white font-medium">{formatMoney(row.value)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-zinc-600 text-xs">
                Gastos actuales: {formatMoney(summary.expense)} (
                {summary.income > 0 ? Math.round((summary.expense / summary.income) * 100) : 0}% de ingresos)
              </p>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-8 text-center">
              Registra al menos un ingreso para ver la guía presupuestal
            </p>
          )}
        </Card>
      </div>

      {/* Form */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">{editingId ? 'Editar movimiento' : 'Nuevo registro'}</h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm">
              <X size={16} />
              Cancelar
            </button>
          ) : null}
        </div>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setType('EXPENSE');
              setCategory('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'EXPENSE' ? 'bg-red-500/25 text-red-200 ring-1 ring-red-500/40' : 'bg-zinc-800 text-zinc-400'
            }`}>
            Gasto
          </button>
          <button
            type="button"
            onClick={() => {
              setType('INCOME');
              setCategory('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              type === 'INCOME'
                ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
            Ingreso
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto (ej. 25.50)"
            type="text"
            inputMode="decimal"
            className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoría"
            className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white"
          />
        </div>
        <p className="text-zinc-500 text-xs mb-2">Categorías rápidas</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {categoryPresets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota opcional (ej. Supermercado del barrio)"
          className="w-full mb-4 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium">
          {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar movimiento'}
        </button>
      </Card>

      {/* History */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-white font-semibold">Historial</h2>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'INCOME', 'EXPENSE'] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  filter === f ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                {f === 'ALL' ? 'Todos' : f === 'INCOME' ? 'Ingresos' : 'Gastos'}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por categoría..."
            className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
          />
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={records.length === 0 ? 'Sin movimientos' : 'Sin resultados'}
            description={
              records.length === 0
                ? 'Registra ingresos y gastos para ver gráficos y balance.'
                : 'Prueba otro filtro o búsqueda.'
            }
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredRecords.map((r) => {
              const isSeed = isOnboardingFinanceRecord(r.category, r.amount);
              return (
                <li key={r.id} className="flex justify-between items-start py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium">{r.category}</p>
                      {isSeed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                          Plantilla
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          r.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                        }`}>
                        {r.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </div>
                    {r.note ? <p className="text-zinc-500 text-xs mt-0.5 truncate">{r.note}</p> : null}
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(r.createdAt).toLocaleString('es', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p
                      className={`font-bold tabular-nums ${
                        r.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                      {r.type === 'INCOME' ? '+' : '−'}
                      {formatMoney(r.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="text-zinc-500 hover:text-violet-400 p-1"
                      aria-label="Editar">
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(r.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      aria-label="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <LoadMoreButton hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
      </Card>
      </>
      ) : null}

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar movimiento"
        message="Se quitará este registro del balance y los gráficos."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
