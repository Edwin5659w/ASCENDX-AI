import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { theme } from '@/constants/theme';
import { API_URL, checkApiHealth, formatApiError } from '@/src/api/client';
import { userApi, billingApi } from '@/src/api/services';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../../../shared/currencies';
import type { ReferralInfo } from '@/src/types/api';
import { AccountabilityPanel } from '@/src/components/AccountabilityPanel';
import { ProfileAvatar } from '@/src/components/profile/ProfileAvatar';
import { ProfileSection } from '@/src/components/profile/ProfileSection';
import { useToast } from '@/src/context/ToastContext';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useLocale } from '@/src/context/LocaleContext';
import { isRevenueCatConfigured, purchasePro, restorePurchases, configureRevenueCat } from '@/src/lib/revenuecat';
import { registerExpoPushToken } from '@/src/lib/notifications';
import { lightTapHaptic } from '@/src/lib/haptics';

const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.1.0';

const PRICING_URL = process.env.EXPO_PUBLIC_WEB_URL
  ? `${process.env.EXPO_PUBLIC_WEB_URL}/pricing`
  : 'https://ascendx.ai/pricing';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { mode, setMode } = useAppTheme();
  const { locale, setLocale, t } = useLocale();
  const [pushBusy, setPushBusy] = useState(false);
  const [testPushBusy, setTestPushBusy] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [apiCheckBusy, setApiCheckBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currency, setCurrency] = useState(user?.preferredCurrency ?? DEFAULT_CURRENCY);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(user?.tradingJournalEnabled ?? false);
  const [savingTrading, setSavingTrading] = useState(false);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(user?.emailOptIn ?? true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    userApi.referral().then(setReferral).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id && isRevenueCatConfigured()) {
      void configureRevenueCat(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    setName(user?.name ?? '');
    setCurrency(user?.preferredCurrency ?? DEFAULT_CURRENCY);
    setTradingEnabled(user?.tradingJournalEnabled ?? false);
    setEmailOptIn(user?.emailOptIn ?? true);
  }, [user?.name, user?.preferredCurrency, user?.tradingJournalEnabled, user?.emailOptIn]);

  const saveCurrency = async (code: string) => {
    if (code === user?.preferredCurrency) return;
    setCurrency(code);
    setSavingCurrency(true);
    try {
      await userApi.updateProfile({ preferredCurrency: code });
      await refreshUser();
      Alert.alert('Listo', 'Moneda actualizada en toda la app');
    } catch (e) {
      setCurrency(user?.preferredCurrency ?? DEFAULT_CURRENCY);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar la moneda');
    } finally {
      setSavingCurrency(false);
    }
  };

  const toggleTradingJournal = async (value: boolean) => {
    setTradingEnabled(value);
    setSavingTrading(true);
    try {
      await userApi.updateProfile({ tradingJournalEnabled: value });
      await refreshUser();
    } catch (e) {
      setTradingEnabled(user?.tradingJournalEnabled ?? false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setSavingTrading(false);
    }
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    setSavingName(true);
    try {
      await userApi.updateProfile({ name: trimmed });
      await refreshUser();
      lightTapHaptic();
      showToast('Nombre actualizado', 'success');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Datos incompletos', 'Completa contraseña actual y nueva');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('No coincide', 'La nueva contraseña y la confirmación deben ser iguales');
      return;
    }
    setChangingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Listo', 'Contraseña actualizada. Inicia sesión de nuevo si cierras la app.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const testApiConnection = async () => {
    setApiCheckBusy(true);
    try {
      const ok = await checkApiHealth();
      if (ok) {
        Alert.alert('Conexión OK', 'El backend responde correctamente.');
      } else {
        Alert.alert('Error', 'El servidor no respondió correctamente');
      }
    } catch (e) {
      Alert.alert('Sin conexión', formatApiError(e));
    } finally {
      setApiCheckBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const registerPush = async () => {
    if (!Device.isDevice) {
      Alert.alert('Avisos', 'Las notificaciones push funcionan en un dispositivo físico.');
      return;
    }
    setPushBusy(true);
    try {
      const token = await registerExpoPushToken();
      if (!token) {
        Alert.alert('Permisos', 'Activa las notificaciones para ASCENDX en los ajustes del sistema.');
        return;
      }
      await refreshUser();
      Alert.alert('Listo', 'Notificaciones registradas en tu cuenta.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo obtener el token de Expo.');
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = async () => {
    if (!user?.pushToken) {
      Alert.alert('Token push', 'Primero activa las notificaciones push en esta pantalla.');
      return;
    }
    setTestPushBusy(true);
    try {
      await userApi.testPush();
      Alert.alert('Enviado', 'Revisa la bandeja de notificaciones del sistema.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo enviar la prueba.');
    } finally {
      setTestPushBusy(false);
    }
  };

  const toggleEmailOptIn = async (value: boolean) => {
    setEmailOptIn(value);
    try {
      await userApi.updateProfile({ emailOptIn: value });
      await refreshUser();
      showToast(value ? 'Emails activados' : 'Emails desactivados', 'success');
    } catch (e) {
      setEmailOptIn(user?.emailOptIn ?? true);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    }
  };

  const upgradePro = async () => {
    setUpgrading(true);
    try {
      const status = await billingApi.status();
      if (status.plan === 'PRO') {
        showToast('Ya tienes Pro activo', 'info');
        return;
      }

      // iOS: solo IAP (Guideline 3.1.1) — no Stripe en navegador
      if (Platform.OS === 'ios') {
        if (!isRevenueCatConfigured() || !user?.id) {
          Alert.alert(
            'Suscripción',
            'Las compras in-app aún no están configuradas. Restaura compras si ya pagaste, o vuelve más tarde.',
          );
          return;
        }
        const ok = await purchasePro(user.id);
        if (ok) {
          await refreshUser();
          showToast('¡Pro activado con App Store!', 'success');
        }
        return;
      }

      if (isRevenueCatConfigured() && user?.id) {
        const ok = await purchasePro(user.id);
        if (ok) {
          await refreshUser();
          showToast('¡Pro activado con Play Store!', 'success');
          return;
        }
      }
      if (!status.billingConfigured) {
        Alert.alert('Pagos', 'Los pagos aún no están disponibles. Visita la web para más info.');
        await WebBrowser.openBrowserAsync(PRICING_URL);
        return;
      }
      const { url } = await billingApi.checkout();
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo activar Pro');
    } finally {
      setUpgrading(false);
    }
  };

  const restoreIap = async () => {
    if (!user?.id || !isRevenueCatConfigured()) return;
    setUpgrading(true);
    try {
      await restorePurchases(user.id);
      await refreshUser();
      showToast('Compras restauradas', 'success');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo restaurar');
    } finally {
      setUpgrading(false);
    }
  };

  const manageSubscription = async () => {
    setUpgrading(true);
    try {
      const { url } = await billingApi.portal();
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir el portal');
    } finally {
      setUpgrading(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await userApi.exportData();
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'ASCENDX export' });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  const replayTour = async () => {
    try {
      const { markOpenProductTour } = await import('@/src/lib/open-product-tour');
      await userApi.updateProfile({ productTourDone: false });
      await markOpenProductTour();
      await refreshUser();
      router.push('/(tabs)' as never);
    } catch (e) {
      Alert.alert('Error', formatApiError(e));
    }
  };

  const shareReferral = async () => {
    if (!referral) return;
    try {
      await Share.share({ message: referral.shareMessage, title: 'ASCENDX AI' });
    } catch {
      /* cancelado */
    }
  };

  const isOAuthUser = !!(user?.googleId || user?.appleId);

  const deleteAccount = () => {
    if (isOAuthUser) {
      if (deletePassword.trim().toUpperCase() !== 'ELIMINAR') {
        Alert.alert('Confirmación', 'Escribe ELIMINAR para borrar tu cuenta (entraste con Google/Apple).');
        return;
      }
    } else if (!deletePassword) {
      Alert.alert('Confirmación', 'Ingresa tu contraseña para eliminar la cuenta');
      return;
    }
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán todos tus datos permanentemente. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                if (isOAuthUser) {
                  await userApi.deleteAccount({ confirmText: 'ELIMINAR' });
                } else {
                  await userApi.deleteAccount({ password: deletePassword });
                }
                await logout();
              } catch (e) {
                Alert.alert('Error', formatApiError(e));
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={{ marginTop: 16 }}>
        <ProfileAvatar name={user?.name ?? name} size={96} />
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.version}>ASCENDX v{APP_VERSION}</Text>
      {user?.plan === 'PRO' ? (
        <View style={styles.proBadge}>
          <FontAwesome name="star" size={12} color={theme.colors.primaryLight} />
          <Text style={styles.proBadgeText}> Plan Pro</Text>
        </View>
      ) : (
        <Text style={styles.freeBadge}>Plan Gratis</Text>
      )}

      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Nivel</Text>
          <Text style={styles.statValue}>{user?.level ?? 1}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>XP total</Text>
          <Text style={styles.statValue}>{user?.xp ?? 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Miembro desde</Text>
          <Text style={styles.statValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es') : '—'}
          </Text>
        </View>
        {user?.pushToken ? (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Push</Text>
            <Text style={styles.statValueSmall}>Activo</Text>
          </View>
        ) : null}
      </Card>

      <ProfileSection title="Identidad" hint="Cómo te ve ASCENDX en la app" />
      <Card style={styles.nameCard}>
        <Input label="Nombre completo" value={name} onChangeText={setName} autoCapitalize="words" />
        <Button title="Guardar nombre" onPress={saveName} loading={savingName} />
      </Card>

      <ProfileSection title="Plan y progreso" />
      {user?.subscriptionStatus === 'PAST_DUE' ? (
        <Card style={styles.pastDueCard}>
          <Text style={styles.pastDueTitle}>Pago pendiente</Text>
          <Text style={styles.prefsHint}>
            No pudimos cobrar tu suscripción Pro. Actualiza tu método de pago en Stripe.
          </Text>
          <Button title="Actualizar pago" variant="secondary" onPress={manageSubscription} loading={upgrading} />
        </Card>
      ) : null}

      {user?.plan === 'PRO' ? (
        <Card style={styles.proCard}>
          <Text style={styles.sectionTitle}>Membresía Pro activa</Text>
          {user.subscriptionPeriodEnd ? (
            <Text style={styles.prefsHint}>
              Renueva el {new Date(user.subscriptionPeriodEnd).toLocaleDateString('es')}
            </Text>
          ) : null}
          <Button title="Gestionar suscripción" variant="secondary" onPress={manageSubscription} loading={upgrading} />
        </Card>
      ) : (
        <Card style={styles.proCard}>
          <Text style={styles.sectionTitle}>Pasa a Pro — $4.99/mes</Text>
          <Text style={styles.prefsHint}>
            100 mensajes IA/día, resumen semanal, diario de trading y más objetivos.
          </Text>
          <Button title="Suscribirme a Pro" onPress={upgradePro} loading={upgrading} />
          {isRevenueCatConfigured() ? (
            <Button title="Restaurar compras" variant="secondary" onPress={restoreIap} loading={upgrading} />
          ) : null}
          <Pressable style={styles.pricingLink} onPress={() => void WebBrowser.openBrowserAsync(PRICING_URL)}>
            <Text style={styles.pricingLinkText}>Ver planes en web →</Text>
          </Pressable>
        </Card>
      )}

      <AccountabilityPanel />

      {referral && (
        <Card style={styles.referralCard}>
          <Text style={styles.sectionTitle}>Invita amigos</Text>
          <Text style={styles.prefsHint}>
            Tú ganas +{referral.bonusXp} XP. Tu amigo gana +{referral.bonusXp} XP y{' '}
            {referral.trialDays ?? 7} días de Pro gratis.
          </Text>
          <Text style={[styles.prefsHint, { color: theme.colors.accent, marginTop: 4 }]}>
            Más amigos = más XP. Ellos prueban Pro sin tarjeta.
          </Text>
          <Text style={styles.refCode}>{referral.referralCode}</Text>
          <Text style={styles.refCount}>{referral.referralCount} invitado(s)</Text>
          <Button title="Compartir invitación" variant="secondary" onPress={shareReferral} />
        </Card>
      )}

      {(user?.streakShields ?? 0) > 0 && (
        <Card style={styles.shieldsCard}>
          <View style={styles.shieldsRow}>
            <FontAwesome name="shield" size={22} color={theme.colors.warning} />
            <View>
              <Text style={styles.shieldsTitle}>{user?.streakShields} escudo(s) de racha</Text>
              <Text style={styles.prefsHint}>Protegen tu racha si faltas un día</Text>
            </View>
          </View>
        </Card>
      )}

      <Pressable
        style={styles.achievementsLink}
        onPress={() => router.push('/(tabs)/achievements' as never)}>
        <FontAwesome name="trophy" size={16} color={theme.colors.warning} />
        <Text style={styles.achievementsLinkText}>Ver mis logros</Text>
      </Pressable>

      <Button title="Ver cómo funciona ASCENDX" variant="secondary" onPress={replayTour} />

      {user?.plan === 'PRO' ? (
        <Button title="Exportar mis datos (JSON · Pro)" variant="secondary" onPress={exportData} loading={exporting} />
      ) : null}

      <ProfileSection title="Preferencias" hint="Apariencia, idioma y moneda" />
      <Card style={styles.prefsCard}>
        <Text style={styles.sectionTitle}>Apariencia e idioma</Text>
        <View style={styles.currencyGrid}>
          <Pressable
            style={[styles.currencyChip, mode === 'dark' && styles.currencyChipActive]}
            onPress={() => setMode('dark')}>
            <Text style={[styles.currencyChipText, mode === 'dark' && styles.currencyChipTextActive]}>
              {t('theme', 'dark')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.currencyChip, mode === 'light' && styles.currencyChipActive]}
            onPress={() => setMode('light')}>
            <Text style={[styles.currencyChipText, mode === 'light' && styles.currencyChipTextActive]}>
              {t('theme', 'light')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.currencyChip, locale === 'es' && styles.currencyChipActive]}
            onPress={() => setLocale('es')}>
            <Text style={[styles.currencyChipText, locale === 'es' && styles.currencyChipTextActive]}>ES</Text>
          </Pressable>
          <Pressable
            style={[styles.currencyChip, locale === 'en' && styles.currencyChipActive]}
            onPress={() => setLocale('en')}>
            <Text style={[styles.currencyChipText, locale === 'en' && styles.currencyChipTextActive]}>EN</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.prefsCard}>
        <Text style={styles.sectionTitle}>Moneda principal</Text>
        <Text style={styles.prefsHint}>
          Todos los montos (finanzas, balance, ventas) se muestran en esta moneda. Por defecto: peso
          colombiano.
        </Text>
        {savingCurrency ? (
          <Text style={styles.prefsHint}>Guardando…</Text>
        ) : null}
        <View style={styles.currencyGrid}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <Pressable
              key={c.code}
              style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
              onPress={() => void saveCurrency(c.code)}
              disabled={savingCurrency}>
              <Text
                style={[
                  styles.currencyChipText,
                  currency === c.code && styles.currencyChipTextActive,
                ]}>
                {c.code}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.prefsCard}>
        {user?.plan === 'PRO' ? (
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.sectionTitle}>Diario de trading</Text>
              <Text style={styles.prefsHint}>
                Registro manual de operaciones (opcional). Visible en Finanzas si lo activas.
              </Text>
            </View>
            <Switch
              value={tradingEnabled}
              onValueChange={(v) => void toggleTradingJournal(v)}
              disabled={savingTrading}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.text}
            />
          </View>
        ) : (
          <Text style={styles.prefsHint}>El diario de trading está incluido en Pro.</Text>
        )}
      </Card>

      <Card style={styles.prefsCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.sectionTitle}>Emails de tips</Text>
            <Text style={styles.prefsHint}>Rachas, recordatorios y novedades</Text>
          </View>
          <Switch
            value={emailOptIn}
            onValueChange={(v) => void toggleEmailOptIn(v)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.text}
          />
        </View>
      </Card>

      <ProfileSection title="Notificaciones" />
      <Card style={styles.pushCard}>
        <Text style={styles.pushTitle}>Avisos en el teléfono</Text>
        <Text style={styles.pushHint}>
          Registra el token para avisos de hábitos y metas. Los recordatorios de hábitos usan
          notificaciones locales al configurar la campana en cada hábito.
        </Text>
        <Button title="Activar notificaciones push" onPress={registerPush} loading={pushBusy} />
        {user?.pushToken ? (
          <Button
            title="Probar notificación"
            variant="secondary"
            onPress={sendTestPush}
            loading={testPushBusy}
            style={styles.testPushButton}
          />
        ) : null}
      </Card>

      <ProfileSection title="Cuenta y seguridad" />
      {!isOAuthUser ? (
        <Card style={styles.passwordCard}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          <Input
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <Input label="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <Input
            label="Confirmar nueva"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Button title="Cambiar contraseña" onPress={changePassword} loading={changingPassword} />
        </Card>
      ) : (
        <Card style={styles.passwordCard}>
          <Text style={styles.sectionTitle}>Inicio de sesión</Text>
          <Text style={styles.prefsHint}>
            Entraste con {user?.googleId ? 'Google' : 'Apple'}. No hay contraseña local que cambiar.
          </Text>
        </Card>
      )}

      {__DEV__ ? (
        <>
          <Text style={styles.apiLabel}>API (dev): {API_URL}</Text>
          <Button
            title="Probar conexión al backend"
            variant="secondary"
            onPress={testApiConnection}
            loading={apiCheckBusy}
            style={styles.apiTestBtn}
          />
        </>
      ) : null}

      <Card style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Zona de peligro</Text>
        <Text style={styles.prefsHint}>Eliminar cuenta borra todos tus datos (GDPR).</Text>
        <Input
          label={isOAuthUser ? 'Escribe ELIMINAR para confirmar' : 'Contraseña para confirmar'}
          value={deletePassword}
          onChangeText={setDeletePassword}
          secureTextEntry={!isOAuthUser}
          autoCapitalize={isOAuthUser ? 'characters' : 'none'}
        />
        <Button
          title={deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
          variant="secondary"
          onPress={deleteAccount}
          loading={deleting}
        />
      </Card>

      <Button title="Cerrar sesión" variant="secondary" onPress={handleLogout} style={styles.logout} />
      <View style={styles.legalRow}>
        <Pressable onPress={() => void WebBrowser.openBrowserAsync(`${PRICING_URL.replace('/pricing', '/privacy')}`)}>
          <Text style={styles.legalLink}>Privacidad</Text>
        </Pressable>
        <Pressable onPress={() => void WebBrowser.openBrowserAsync(`${PRICING_URL.replace('/pricing', '/terms')}`)}>
          <Text style={styles.legalLink}>Términos</Text>
        </Pressable>
        <Pressable onPress={() => void WebBrowser.openBrowserAsync('mailto:hola@ascendx.ai')}>
          <Text style={styles.legalLink}>Soporte</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    paddingBottom: 40,
  },
  name: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 16 },
  email: { color: theme.colors.textMuted, fontSize: 15, marginTop: 4 },
  version: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '33',
  },
  proBadgeText: { color: theme.colors.primaryLight, fontSize: 12, fontWeight: '600' },
  freeBadge: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
  nameCard: { width: '100%', marginTop: 8 },
  statsCard: { width: '100%', marginTop: 16 },
  proCard: { width: '100%', marginTop: 8, borderColor: 'rgba(139, 92, 246, 0.35)', borderWidth: 1 },
  pastDueCard: {
    width: '100%',
    marginTop: 8,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  pastDueTitle: { color: theme.colors.warning, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  pricingLink: { marginTop: 12, alignItems: 'center' },
  pricingLinkText: { color: theme.colors.primaryLight, fontSize: 13 },
  referralCard: { width: '100%', marginTop: 8 },
  refCode: {
    color: theme.colors.accent,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 8,
    textAlign: 'center',
  },
  refCount: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' },
  shieldsCard: { width: '100%', marginTop: 8 },
  shieldsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldsTitle: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  achievementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
  },
  achievementsLinkText: { color: theme.colors.primaryLight, fontWeight: '600', fontSize: 14 },
  dangerCard: {
    width: '100%',
    marginTop: 8,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderWidth: 1,
  },
  dangerTitle: { color: theme.colors.danger, fontWeight: '600', marginBottom: 8 },
  prefsCard: { width: '100%', marginTop: 8 },
  prefsHint: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  currencyChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '22',
  },
  currencyChipText: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 },
  currencyChipTextActive: { color: theme.colors.primaryLight },
  switchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  switchCopy: { flex: 1 },
  passwordCard: { width: '100%', marginTop: 8, gap: 4 },
  sectionTitle: { color: theme.colors.text, fontWeight: '600', marginBottom: 8 },
  pushCard: { width: '100%', marginTop: 8 },
  pushTitle: { color: theme.colors.text, fontWeight: '600', marginBottom: 8 },
  pushHint: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  testPushButton: { marginTop: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statLabel: { color: theme.colors.textMuted },
  statValue: { color: theme.colors.text, fontWeight: '600' },
  statValueSmall: { color: theme.colors.success, fontWeight: '600', fontSize: 13 },
  apiLabel: { color: theme.colors.textMuted, fontSize: 11, marginTop: 24, textAlign: 'center' },
  apiTestBtn: { width: '100%', marginTop: 12 },
  logout: { width: '100%', marginTop: 16 },
  legalRow: { flexDirection: 'row', gap: 20, marginTop: 12, marginBottom: 24 },
  legalLink: { color: theme.colors.textMuted, fontSize: 12 },
});
