import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { AppText, Button, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { spacing } = useTheme();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Al iniciar sesión, la navegación protegida lleva automáticamente al inicio.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: spacing.sm, marginTop: spacing.xxl }}>
        <AppText variant="title">Hola de nuevo</AppText>
        <AppText color="textMuted">Inicia sesión para seguir con tu plan.</AppText>
      </View>

      <TextField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {error ? <AppText color="danger">{error}</AppText> : null}

      <Button title="Iniciar sesión" onPress={handleSubmit} loading={loading} />

      <AppText align="center" color="textMuted">
        ¿No tienes cuenta?{' '}
        <Link href="/register" replace>
          <AppText color="primary" variant="bodyStrong">
            Crear cuenta
          </AppText>
        </Link>
      </AppText>
    </Screen>
  );
}
