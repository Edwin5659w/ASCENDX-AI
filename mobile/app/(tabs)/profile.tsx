import { Alert, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { theme } from '@/constants/theme';
import { API_URL } from '@/src/api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: logout,
      },
    ]);
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
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('es')
              : '—'}
          </Text>
        </View>
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statLabel: { color: theme.colors.textMuted },
  statValue: { color: theme.colors.text, fontWeight: '600' },
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
