import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, Chip, ChipGroup, errorMessage, ErrorView, Header, Icon, LoadingView, Screen, SegmentedControl, TextField } from '@/components/ui';
import { createCategory, deleteCategory, getCategories, type Category } from '@/features/finance/api';
import { CategoryIcon } from '@/features/finance/components';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const COLORS = ['#22C55E', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C', '#FBBF24', '#F87171', '#94A3B8'];

/** RF-10: categorías por defecto y personalizadas. Las que tienen movimientos se archivan. */
export default function CategoriesScreen() {
  const { spacing } = useTheme();
  const { data, error, loading, refetch } = useQuery('categories', getCategories);
  const [kind, setKind] = useState<'gasto' | 'ingreso'>('gasto');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]!);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const list = (data?.categories ?? []).filter((c) => c.kind === kind);
  const own = list.filter((c) => !c.isDefault);
  const defaults = list.filter((c) => c.isDefault);

  async function add() {
    if (name.trim().length < 2) {
      setMessage('Escribe al menos 2 caracteres.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createCategory({ name: name.trim(), kind, color, icon: kind === 'gasto' ? 'sell' : 'payments' });
      setName('');
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    try {
      await deleteCategory(category.id);
      setPendingDelete(null);
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Categorías" />
      <SegmentedControl
        accessibilityLabel="Tipo de categoría"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'gasto', label: 'Gastos' },
          { value: 'ingreso', label: 'Ingresos' },
        ]}
      />

      <Card>
        <AppText variant="heading">Nueva categoría de {kind === 'gasto' ? 'gasto' : 'ingreso'}</AppText>
        <TextField label="Nombre" value={name} onChangeText={setName} placeholder={kind === 'gasto' ? 'Ej.: Mascotas' : 'Ej.: Arriendo recibido'} maxLength={60} />
        <AppText variant="label" color="textMuted">
          Color
        </AppText>
        <ChipGroup>
          {COLORS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === option }}
              accessibilityLabel={`Color ${option}`}
              onPress={() => setColor(option)}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: option }}
            >
              {color === option ? <Icon name="checkSmall" color="onPrimary" /> : null}
            </Pressable>
          ))}
        </ChipGroup>
        {message ? <AppText color="danger">{message}</AppText> : null}
        <Button title="Agregar" onPress={add} loading={saving} />
      </Card>

      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {own.length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color="textMuted">
            Tus categorías
          </AppText>
          {own.map((category) => (
            <View key={category.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 }}>
              <CategoryIcon icon={category.icon} color={category.color} />
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {category.name}
              </AppText>
              {pendingDelete === category.id ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Chip label="Borrar" onPress={() => remove(category)} />
                  <Chip label="No" onPress={() => setPendingDelete(null)} />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Borrar ${category.name}`}
                  onPress={() => setPendingDelete(category.id)}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="trash" color="textMuted" />
                </Pressable>
              )}
            </View>
          ))}
          <AppText variant="caption" color="textMuted">
            Si una categoría ya tiene movimientos, se archiva: desaparece de la lista, pero tu historial la conserva.
          </AppText>
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText variant="overline" color="textMuted">
          Por defecto
        </AppText>
        {defaults.map((category) => (
          <View key={category.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}>
            <CategoryIcon icon={category.icon} color={category.color} />
            <AppText style={{ flex: 1 }}>{category.name}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
