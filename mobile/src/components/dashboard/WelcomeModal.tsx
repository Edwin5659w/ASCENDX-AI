import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { XP } from '../../../../shared/retention';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface WelcomeModalProps {
  visible: boolean;
  userName?: string;
  onDismiss: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center' as const,
      padding: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      padding: 24,
    },
    close: { position: 'absolute' as const, top: 16, right: 16, zIndex: 1 },
    iconWrap: {
      alignSelf: 'center' as const,
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 16,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800' as const,
      textAlign: 'center' as const,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.primaryLight,
      fontSize: 14,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
    body: {
      color: theme.colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
    tips: { gap: 8, marginBottom: 20 },
    tipRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tipText: { color: theme.colors.text, fontSize: 13, flex: 1 },
    primaryBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const, textAlign: 'center' as const },
    secondaryBtn: { paddingVertical: 10, alignItems: 'center' as const },
    secondaryBtnText: { color: theme.colors.textMuted, fontSize: 13 },
  };
}

export function WelcomeModal({ visible, userName, onDismiss }: WelcomeModalProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const firstName = userName?.split(' ')[0] ?? 'viajero';

  const goTasks = () => {
    onDismiss();
    router.push('/(tabs)/tasks' as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable style={styles.close} onPress={onDismiss} hitSlop={12}>
            <FontAwesome name="times" size={20} color={theme.colors.textMuted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <FontAwesome name="rocket" size={32} color={theme.colors.primaryLight} />
          </View>

          <Text style={styles.title}>¡Listo, {firstName}!</Text>
          <Text style={styles.subtitle}>+{XP.ONBOARDING_COMPLETE} XP de bienvenida</Text>

          <Text style={styles.body}>
            Completa tu primera tarea ahora. Es el primer paso de tu Life OS.
          </Text>

          <View style={styles.tips}>
            <View style={styles.tipRow}>
              <FontAwesome name="bolt" size={14} color={theme.colors.warning} />
              <Text style={styles.tipText}>Completa 1 tarea → +{XP.TASK_COMPLETE} XP</Text>
            </View>
            <View style={styles.tipRow}>
              <FontAwesome name="fire" size={14} color={theme.colors.accent} />
              <Text style={styles.tipText}>Marca tu hábito hoy → +{XP.HABIT_COMPLETE} XP</Text>
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={goTasks}>
            <Text style={styles.primaryBtnText}>Completar mi primera tarea (+{XP.TASK_COMPLETE} XP)</Text>
          </Pressable>
          <Pressable onPress={onDismiss} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Explorar el dashboard primero</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
