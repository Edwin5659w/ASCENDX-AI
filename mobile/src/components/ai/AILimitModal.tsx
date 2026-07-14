import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PRO_VALUE_PROPS } from '../../../../shared/retention-playbook';
import { PLAN_LIMITS, PLAN_PRICING } from '../../../../shared/plans';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface AILimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center' as const,
      padding: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      padding: 22,
      maxHeight: '90%' as const,
    },
    close: { position: 'absolute' as const, top: 12, right: 14, zIndex: 1 },
    closeText: { color: theme.colors.textMuted, fontSize: 24, lineHeight: 24 },
    iconWrap: {
      alignSelf: 'center' as const,
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 14,
    },
    title: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    body: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: 'center' as const,
      lineHeight: 19,
      marginBottom: 14,
    },
    list: { maxHeight: 160, marginBottom: 14 },
    bullet: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
    },
    bulletIcon: { marginRight: 8, marginTop: 2 },
    bulletText: { flex: 1, color: theme.colors.text, fontSize: 13, lineHeight: 18 },
    upgradeBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginBottom: 8,
    },
    upgradeText: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
    laterBtn: { paddingVertical: 10 },
    laterText: { color: theme.colors.textMuted, textAlign: 'center' as const, fontSize: 13 },
    disabled: { opacity: 0.5 },
  };
}

export function AILimitModal({ visible, onClose, onUpgrade, upgrading }: AILimitModalProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
          <View style={styles.iconWrap}>
            <FontAwesome name="magic" size={28} color={theme.colors.primaryLight} />
          </View>
          <Text style={styles.title}>Tu mentor quiere seguir ayudándote</Text>
          <Text style={styles.body}>
            Usaste tus {PLAN_LIMITS.FREE.aiChatPerDay} mensajes gratis de hoy. Con Pro sigues conversando con
            contexto de tus tareas, hábitos y finanzas reales.
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {PRO_VALUE_PROPS.map((p) => (
              <View key={p} style={styles.bullet}>
                <FontAwesome name="star" size={12} color={theme.colors.accent} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            onPress={onUpgrade}
            disabled={upgrading}
            style={[styles.upgradeBtn, upgrading && styles.disabled]}>
            <FontAwesome name="diamond" size={14} color="#fff" />
            <Text style={styles.upgradeText}>
              {upgrading ? 'Redirigiendo...' : `Activar Pro — $${PLAN_PRICING.PRO.price}/mes`}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.laterBtn}>
            <Text style={styles.laterText}>Volver mañana (plan Gratis)</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
