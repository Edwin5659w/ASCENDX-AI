import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PRO_VALUE_PROPS } from '../../../shared/retention-playbook';
import { PLAN_LIMITS, PLAN_PRICING } from '../../../shared/plans';
import { theme } from '@/constants/theme';

interface AILimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
}

export function AILimitModal({ visible, onClose, onUpgrade, upgrading }: AILimitModalProps) {
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    padding: 22,
    maxHeight: '90%',
  },
  close: { position: 'absolute', top: 12, right: 14, zIndex: 1 },
  closeText: { color: theme.colors.textMuted, fontSize: 24, lineHeight: 24 },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  body: { color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  list: { maxHeight: 160, marginBottom: 14 },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  bulletIcon: { marginRight: 8, marginTop: 2 },
  bulletText: { flex: 1, color: theme.colors.text, fontSize: 13, lineHeight: 18 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  upgradeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  laterBtn: { paddingVertical: 10 },
  laterText: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 13 },
  disabled: { opacity: 0.5 },
});
