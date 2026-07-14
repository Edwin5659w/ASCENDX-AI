import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MORNING_RITUAL_STEPS } from '../../../../shared/morning-ritual';
import { userApi } from '@/src/api/services';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface MorningRitualModalProps {
  visible: boolean;
  onClose: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center' as const,
      padding: 20,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.3)',
      padding: 24,
    },
    close: { position: 'absolute' as const, top: 16, right: 16, zIndex: 1 },
    iconWrap: {
      alignSelf: 'center' as const,
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: 'rgba(251,191,36,0.15)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 12,
    },
    kicker: {
      color: '#fbbf24',
      fontSize: 11,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '800' as const,
      textAlign: 'center' as const,
      marginTop: 6,
    },
    body: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center' as const,
      lineHeight: 21,
      marginVertical: 16,
    },
    cta: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
  };
}

export function MorningRitualModal({ visible, onClose }: MorningRitualModalProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const current = MORNING_RITUAL_STEPS[step];
  const isLast = step === MORNING_RITUAL_STEPS.length - 1;

  const next = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setFinishing(true);
    try {
      await userApi.completeMorningRitual();
    } catch {
      /* ignore */
    }
    onClose();
    router.push(current.mobilePath as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Cerrar ritual">
            <FontAwesome name="times" size={18} color={theme.colors.textMuted} />
          </Pressable>
          <View style={styles.iconWrap}>
            <FontAwesome name="sun-o" size={28} color="#fbbf24" />
          </View>
          <Text style={styles.kicker}>
            Ritual matutino · {step + 1}/{MORNING_RITUAL_STEPS.length}
          </Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          <Pressable
            style={[styles.cta, finishing && styles.ctaDisabled]}
            disabled={finishing}
            onPress={() => void next()}>
            <Text style={styles.ctaText}>{finishing ? 'Listo...' : isLast ? current.cta : 'Siguiente →'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
