import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { theme } from '@/constants/theme';
import { API_URL, checkApiHealth, formatApiError } from '@/src/api/client';
import { userApi } from '@/src/api/services';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [pushBusy, setPushBusy] = useState(false);
  const [testPushBusy, setTestPushBusy] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [apiCheckBusy, setApiCheckBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    setSavingName(true);
    try {
      await userApi.updateProfile({ name: trimmed });
      await refreshUser();
      Alert.alert('Listo', 'Nombre actualizado');
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
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    setPushBusy(true);
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }
      if (final !== 'granted') {
        Alert.alert('Permisos', 'Activa las notificaciones para ASCENDX en los ajustes del sistema.');
        return;
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
      const opts = projectId ? { projectId } : undefined;
      const { data } = await Notifications.getExpoPushTokenAsync(opts);
      await userApi.updateProfile({ pushToken: data });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.avatar}>
        <FontAwesome name="user" size={40} color={theme.colors.primaryLight} />
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.version}>ASCENDX v{APP_VERSION}</Text>

      <Card style={styles.nameCard}>
        <Input label="Nombre completo" value={name} onChangeText={setName} autoCapitalize="words" />
        <Button title="Guardar nombre" onPress={saveName} loading={savingName} />
      </Card>

      <Card style={styles.passwordCard}>
        <Text style={styles.sectionTitle}>Seguridad</Text>
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

      <Card style={styles.pushCard}>
        <Text style={styles.pushTitle}>Notificaciones</Text>
        <Text style={styles.pushHint}>
          Registra el token en el servidor para avisos de hábitos y metas. Los recordatorios de hábitos usan
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

      <Button title="Cerrar sesión" variant="secondary" onPress={handleLogout} style={styles.logout} />
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
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  name: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 16 },
  email: { color: theme.colors.textMuted, fontSize: 15, marginTop: 4 },
  version: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
  nameCard: { width: '100%', marginTop: 20 },
  passwordCard: { width: '100%', marginTop: 16, gap: 4 },
  sectionTitle: { color: theme.colors.text, fontWeight: '600', marginBottom: 8 },
  statsCard: { width: '100%', marginTop: 16 },
  pushCard: { width: '100%', marginTop: 16 },
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
});
