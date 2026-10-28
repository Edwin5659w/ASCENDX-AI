import { ActivityIndicator, View } from 'react-native';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

export function LoadingView({ label = 'Cargando…' }: { label?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={{ paddingVertical: spacing.xxxl, alignItems: 'center', gap: spacing.md }}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { spacing } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Icon name="error" color="danger" />
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          No pudimos cargar la información
        </AppText>
      </View>
      <AppText color="textMuted">{errorMessage(error)}</AppText>
      {onRetry ? <Button title="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </Card>
  );
}

interface EmptyViewProps {
  icon: IconName;
  title: string;
  description: string;
  action?: { title: string; onPress: () => void };
}

/** Estado vacío que invita al siguiente paso; nunca muestra cifras inventadas. */
export function EmptyView({ icon, title, description, action }: EmptyViewProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Card>
      <View style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} color="primary" size={26} />
      </View>
      <AppText variant="heading">{title}</AppText>
      <AppText color="textMuted">{description}</AppText>
      {action ? <Button title={action.title} onPress={action.onPress} /> : null}
      <View style={{ height: spacing.xs }} />
    </Card>
  );
}

/** Aviso de datos guardados en el teléfono cuando no hay conexión (RF-27). */
export function OfflineBanner({ updatedAt }: { updatedAt?: number }) {
  const { colors, radius, spacing } = useTheme();
  const when = updatedAt
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(updatedAt))
    : null;
  return (
    <View
      accessibilityRole="alert"
      style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft }}
    >
      <Icon name="offline" color="warning" size={18} />
      <AppText variant="caption" color="text" style={{ flex: 1 }}>
        Sin conexión. Ves los datos guardados{when ? ` el ${when}` : ''}.
      </AppText>
    </View>
  );
}
