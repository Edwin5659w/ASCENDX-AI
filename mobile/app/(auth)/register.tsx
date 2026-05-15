import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { theme } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Empieza tu ascenso hoy</Text>

          <View style={styles.form}>
            <Input label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} />
            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Registrarse" onPress={handleRegister} loading={loading} />
          </View>

          <Link href="/(auth)/login" asChild>
            <Text style={styles.link}>
              ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
  },
  form: { marginBottom: theme.spacing.lg },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  link: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontSize: 15,
  },
  linkBold: {
    color: theme.colors.primaryLight,
    fontWeight: '600',
  },
});
