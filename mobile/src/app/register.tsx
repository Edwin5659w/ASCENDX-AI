import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Icon, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';

type Field = 'fullName' | 'email' | 'password' | 'acceptPrivacyPolicy';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors, radius, spacing } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const localErrors: Partial<Record<Field, string>> = {};
    if (fullName.trim().length < 2) localErrors.fullName = 'Escribe tu nombre';
    if (!email.includes('@')) localErrors.email = 'Escribe un correo válido';
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      localErrors.password = 'Mínimo 8 caracteres, con letras y números';
    }
    if (!accepted) localErrors.acceptPrivacyPolicy = 'Debes aceptar para crear la cuenta';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp({ fullName: fullName.trim(), email: email.trim(), password, acceptPrivacyPolicy: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.fieldErrors();
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) setFormError(err.message);
      } else {
        setFormError('No se pudo crear la cuenta.');
      }
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: spacing.sm, marginTop: spacing.xxl }}>
        <AppText variant="title">Crea tu cuenta</AppText>
        <AppText color="textMuted">Empieza a ordenar tus finanzas y a planear tus metas.</AppText>
      </View>

      <TextField
        label="Nombre"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        textContentType="name"
        error={errors.fullName}
      />
      <TextField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={errors.email}
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="Mínimo 8 caracteres, con letras y números"
        error={errors.password}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((value) => !value)}
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: errors.acceptPrivacyPolicy ? colors.danger : colors.border,
        }}
      >
        <Icon name={accepted ? 'check' : 'pending'} color={accepted ? 'primary' : 'textSubtle'} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="caption">
            Autorizo el tratamiento de mis datos personales y financieros para usar ASCENDX AI, conforme a la Ley 1581
            de 2012.
          </AppText>
          <AppText variant="caption" color="textSubtle">
            La IA y la lectura de recibos piden un permiso aparte.
          </AppText>
          {errors.acceptPrivacyPolicy ? (
            <AppText variant="caption" color="danger">
              {errors.acceptPrivacyPolicy}
            </AppText>
          ) : null}
        </View>
      </Pressable>

      {formError ? <AppText color="danger">{formError}</AppText> : null}

      <Button title="Crear cuenta" onPress={handleSubmit} loading={loading} />

      <AppText align="center" color="textMuted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" replace>
          <AppText color="primary" variant="bodyStrong">
            Inicia sesión
          </AppText>
        </Link>
      </AppText>
    </Screen>
  );
}
