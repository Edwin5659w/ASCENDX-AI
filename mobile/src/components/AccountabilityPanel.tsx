import { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import { userApi } from '@/src/api/services';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { useToast } from '@/src/context/ToastContext';

interface Partner {
  id: string;
  name: string;
  ascendScore: number;
  ascendLabel: string;
}

function createStyles(theme: AppTheme) {
  return {
    card: { marginBottom: theme.spacing.md },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 6 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' as const },
    sub: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
    codeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 12 },
    code: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800' as const,
      letterSpacing: 2,
      backgroundColor: theme.colors.surfaceLight,
      padding: 12,
      borderRadius: 12,
      textAlign: 'center' as const,
    },
    shareBtn: {
      backgroundColor: theme.colors.primary,
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    input: {
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 12,
      padding: 12,
      color: theme.colors.text,
      marginBottom: 10,
      letterSpacing: 1,
    },
    linkBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center' as const,
    },
    linkBtnDisabled: { opacity: 0.6 },
    linkBtnText: { color: '#fff', fontWeight: '700' as const },
    list: { marginTop: 14, gap: 8 },
    partner: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    partnerName: { color: theme.colors.text, fontWeight: '600' as const },
    partnerScore: { color: theme.colors.textMuted, fontSize: 13 },
  };
}

export function AccountabilityPanel() {
  const { showToast } = useToast();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [code, setCode] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([userApi.accountabilityCode(), userApi.accountabilityPartners()]);
      setCode(c.code);
      setPartners(p);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Únete a mi accountability en ASCENDX. Mi código: ${code}`,
        title: 'ASCENDX Accountability',
      });
    } catch {
      /* cancelado */
    }
  };

  const linkPartner = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    try {
      const res = await userApi.linkAccountability(linkCode.trim().toUpperCase());
      showToast(`Vinculado con ${res.partnerName}`, 'success');
      setLinkCode('');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Código inválido', 'error');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="users" size={18} color={theme.colors.primaryLight} />
        <Text style={styles.title}>Modo accountability</Text>
      </View>
      <Text style={styles.sub}>Comparte tu código y ve el Ascenso Score de tu partner.</Text>
      <View style={styles.codeRow}>
        <Text style={styles.code}>{code || '...'}</Text>
        <Pressable onPress={() => void shareCode()} style={styles.shareBtn}>
          <FontAwesome name="share-alt" size={16} color="#fff" />
        </Pressable>
      </View>
      <TextInput
        value={linkCode}
        onChangeText={(t) => setLinkCode(t.toUpperCase())}
        placeholder="Código de tu partner"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="characters"
        style={styles.input}
      />
      <Pressable style={[styles.linkBtn, linking && styles.linkBtnDisabled]} disabled={linking} onPress={() => void linkPartner()}>
        <Text style={styles.linkBtnText}>{linking ? 'Vinculando...' : 'Vincular partner'}</Text>
      </Pressable>
      {partners.length > 0 ? (
        <View style={styles.list}>
          {partners.map((p) => (
            <View key={p.id} style={styles.partner}>
              <Text style={styles.partnerName}>{p.name}</Text>
              <Text style={styles.partnerScore}>
                {p.ascendScore} · {p.ascendLabel}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
