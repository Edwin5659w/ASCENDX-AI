import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { AppText, Button, Icon, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthShell, FormError } from '@/features/auth/AuthShell';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';

type Field = 'email' | 'password';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { spacing } = useTheme();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const localErrors: Partial<Record<Field, string>> = {};
    if (!EMAIL_PATTERN.test(email.trim())) localErrors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com';
    if (!password) localErrors.password = 'Escribe tu contraseña';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Con la sesión iniciada, la navegación protegida lleva al panel.
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setFormError('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.');
      } else if (err instanceof ApiError && err.code === 'TOO_MANY_ATTEMPTS') {
        setFormError('Hiciste demasiados intentos. Espera 15 minutos antes de volver a intentar.');
      } else {
        setFormError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
      }
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode="login"
      title="Hola de nuevo"
      subtitle="Ingresa para seguir con tu plan."
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shield" size={16} color="textSubtle" />
          <AppText variant="caption" color="textSubtle">
            Tu contraseña se guarda cifrada. Nadie puede leerla.
          </AppText>
        </View>
      }
    >
      <TextField
        label="Correo electrónico"
        icon="mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        placeholder="nombre@correo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        icon="lock"
        revealable
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Tu contraseña"
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={errors.password}
      />

      {formError ? <FormError message={formError} /> : null}

      <Button title="Iniciar sesión" onPress={handleSubmit} loading={loading} />
    </AuthShell>
  );
}
