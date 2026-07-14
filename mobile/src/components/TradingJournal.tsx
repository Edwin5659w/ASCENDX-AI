import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { tradesApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/EmptyState';
import type { Trade, TradeSummary } from '@/src/types/api';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { useMoneyFormat } from '@/src/hooks/useMoneyFormat';
import {
  TRADE_EMOTION_TAGS,
  TRADING_DISCLAIMER,
  formatTradeSide,
} from '../../../shared/trading-helpers';

function createStyles(theme: AppTheme) {
  return {
    disclaimer: {
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 12,
      fontStyle: 'italic' as const,
    },
    summaryCard: { marginBottom: 12 },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 6,
    },
    summaryLabel: { color: theme.colors.textMuted },
    summaryValue: { color: theme.colors.text, fontWeight: '700' as const },
    wl: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
    positive: { color: theme.colors.success },
    negative: { color: theme.colors.danger },
    addBtn: { marginBottom: 16 },
    tradeRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    tradeMain: { flex: 1 },
    symbol: { color: theme.colors.text, fontSize: 16, fontWeight: '600' as const },
    meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
    emotion: { color: theme.colors.primaryLight, fontSize: 11, marginTop: 4 },
    pnl: { fontSize: 13, marginTop: 4, fontWeight: '600' as const },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end' as const,
    },
    modalCard: {
      backgroundColor: theme.colors.surfaceLight,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      maxHeight: '90%' as const,
    },
    modalTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '600' as const,
      marginBottom: 12,
    },
    sideRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 12 },
    sideBtn: { flex: 1 },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      padding: 12,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    noteInput: { minHeight: 72, textAlignVertical: 'top' as const },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '22' },
    chipText: { color: theme.colors.textMuted, fontSize: 11 },
    chipTextActive: { color: theme.colors.primaryLight },
    modalActions: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
    modalBtn: { flex: 1 },
  };
}

export function TradingJournal() {
  const { formatMoney } = useMoneyFormat();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([tradesApi.list(), tradesApi.summary()]);
      setTrades(list);
      setSummary(sum);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar el diario');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleAdd = async () => {
    const q = parseFloat(quantity.replace(',', '.'));
    const p = parseFloat(price.replace(',', '.'));
    if (!symbol.trim() || !q || q <= 0 || !p || p <= 0) {
      Alert.alert('Datos incompletos', 'Símbolo, cantidad y precio son obligatorios');
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
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = (t: Trade) => {
    Alert.alert('Eliminar', `¿Eliminar operación ${t.symbol}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await tradesApi.remove(t.id);
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View>
      <Text style={styles.disclaimer}>{TRADING_DISCLAIMER}</Text>
      {summary ? (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Operaciones</Text>
            <Text style={styles.summaryValue}>{summary.totalTrades}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>P&L acumulado</Text>
            <Text
              style={[
                styles.summaryValue,
                summary.totalPnl >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {summary.totalPnl >= 0 ? '+' : ''}
              {formatMoney(summary.totalPnl)}
            </Text>
          </View>
          <Text style={styles.wl}>
            ✓ {summary.wins} · ✗ {summary.losses}
          </Text>
        </Card>
      ) : null}

      <Button title="Nueva operación" onPress={() => setShowForm(true)} style={styles.addBtn} />

      {trades.length === 0 ? (
        <EmptyState
          icon="line-chart"
          title="Diario vacío"
          description="Registra compras/ventas, P&L y emoción para reflexionar sin asesoría."
        />
      ) : (
        trades.map((t) => (
          <View key={t.id} style={styles.tradeRow}>
            <View style={styles.tradeMain}>
              <Text style={styles.symbol}>{t.symbol}</Text>
              <Text style={styles.meta}>
                {formatTradeSide(t.side)} · {t.quantity} @ {formatMoney(t.price)}
              </Text>
              {t.emotionTag ? <Text style={styles.emotion}>{t.emotionTag}</Text> : null}
              {t.pnl != null ? (
                <Text style={[styles.pnl, t.pnl >= 0 ? styles.positive : styles.negative]}>
                  P&L: {t.pnl >= 0 ? '+' : ''}
                  {formatMoney(t.pnl)}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => remove(t)} hitSlop={8}>
              <FontAwesome name="trash-o" size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        ))
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowForm(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Nueva operación</Text>
            <View style={styles.sideRow}>
              <Button
                title="Compra"
                variant={side === 'BUY' ? 'primary' : 'secondary'}
                onPress={() => setSide('BUY')}
                style={styles.sideBtn}
              />
              <Button
                title="Venta"
                variant={side === 'SELL' ? 'primary' : 'secondary'}
                onPress={() => setSide('SELL')}
                style={styles.sideBtn}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Símbolo (AAPL, BTC...)"
              placeholderTextColor={theme.colors.textMuted}
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              placeholderTextColor={theme.colors.textMuted}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              placeholderTextColor={theme.colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="P&L (opcional)"
              placeholderTextColor={theme.colors.textMuted}
              value={pnl}
              onChangeText={setPnl}
              keyboardType="decimal-pad"
            />
            <View style={styles.chips}>
              {TRADE_EMOTION_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.chip, emotion === tag && styles.chipActive]}
                  onPress={() => setEmotion(emotion === tag ? null : tag)}
                >
                  <Text style={[styles.chipText, emotion === tag && styles.chipTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Nota (opcional)"
              placeholderTextColor={theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="secondary" onPress={() => setShowForm(false)} style={styles.modalBtn} />
              <Button title="Guardar" onPress={() => void handleAdd()} loading={saving} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
