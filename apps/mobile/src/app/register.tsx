import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { AppText, Button, Checkbox, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthShell, FormError } from '@/features/auth/AuthShell';
import { isPasswordValid, PasswordStrength } from '@/features/auth/PasswordStrength';
import { ApiError } from '@/lib/api';

type Field = 'fullName' | 'email' | 'password' | 'acceptPrivacyPolicy';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit() {
    const localErrors: Partial<Record<Field, string>> = {};
    if (fullName.trim().length < 2) localErrors.fullName = 'Escribe tu nombre';
    if (!EMAIL_PATTERN.test(email.trim())) localErrors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com';
    if (!isPasswordValid(password)) localErrors.password = 'La contraseña aún no cumple los requisitos';
    if (!accepted) localErrors.acceptPrivacyPolicy = 'Necesitamos tu autorización para crear la cuenta';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp({ fullName: fullName.trim(), email: email.trim(), password, acceptPrivacyPolicy: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_IN_USE') {
        setErrors({ email: 'Ya existe una cuenta con este correo. Inicia sesión en su lugar.' });
      } else if (err instanceof ApiError && Object.keys(err.fieldErrors()).length > 0) {
        setErrors(err.fieldErrors());
      } else {
        setFormError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.');
      }
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="register" title="Crea tu cuenta" subtitle="Toma menos de un minuto. Luego armamos tu plan.">
      <TextField
        label="Nombre"
        icon="person"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          clearError('fullName');
        }}
        placeholder="Cómo quieres que te llamemos"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.fullName}
      />
      <TextField
        ref={emailRef}
        label="Correo electrónico"
        icon="mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError('email');
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
          clearError('password');
        }}
        placeholder="Crea una contraseña"
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.password}
      />
      <PasswordStrength value={password} />

      <Checkbox
        checked={accepted}
        onChange={(value) => {
          setAccepted(value);
          clearError('acceptPrivacyPolicy');
        }}
        invalid={Boolean(errors.acceptPrivacyPolicy)}
        accessibilityLabel="Autorizo el tratamiento de mis datos personales"
      >
        <AppText variant="caption" color="textMuted">
          Autorizo el tratamiento de mis datos personales y financieros para usar ASCENDX AI, conforme a la Ley 1581 de
          2012. El análisis con IA y la lectura de recibos piden un permiso aparte.
        </AppText>
        {errors.acceptPrivacyPolicy ? (
          <AppText variant="caption" color="danger" style={{ marginTop: 4 }}>
            {errors.acceptPrivacyPolicy}
          </AppText>
        ) : null}
      </Checkbox>

      {formError ? <FormError message={formError} /> : null}

      <Button title="Crear cuenta" onPress={handleSubmit} loading={loading} />
    </AuthShell>
  );
}
