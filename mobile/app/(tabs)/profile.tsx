import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { theme } from '@/constants/theme';
import { API_URL } from '@/src/api/client';
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

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [pushBusy, setPushBusy] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <FontAwesome name="user" size={40} color={theme.colors.primaryLight} />
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

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
          Registra el token en el servidor para futuros recordatorios (hábitos, metas). En Expo Go puede requerir
          proyecto EAS con projectId.
        </Text>
        <Button title="Activar notificaciones push" onPress={registerPush} loading={pushBusy} />
      </Card>

      <Text style={styles.apiLabel}>API: {API_URL}</Text>

      <Button title="Cerrar sesión" variant="secondary" onPress={handleLogout} style={styles.logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    alignItems: 'center',
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
  name: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    color: theme.colors.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  statsCard: {
    width: '100%',
    marginTop: 24,
  },
  pushCard: {
    width: '100%',
    marginTop: 16,
  },
  pushTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  pushHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
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
  apiLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 24,
  },
  logout: {
    width: '100%',
    marginTop: 24,
  },
});
