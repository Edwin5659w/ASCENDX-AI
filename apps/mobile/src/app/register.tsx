import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { AppText, Button, Checkbox, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthShell, FormError } from '@/features/auth/AuthShell';
import { isPasswordValid, PasswordStrength } from '@/features/auth/PasswordStrength';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';

/**
 * RF-01: registro con nombre, correo, contraseña, declaración de mayoría de
 * edad y aceptación por separado de los términos y del tratamiento de datos
 * (Ley 1581 de 2012). Cada aceptación se guarda como consentimiento versionado.
 */
type Field = 'name' | 'email' | 'password' | 'isAdult' | 'acceptTerms' | 'acceptDataPolicy';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { spacing } = useTheme();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDataPolicy, setAcceptDataPolicy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit() {
    const localErrors: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) localErrors.name = 'Escribe tu nombre';
    if (!EMAIL_PATTERN.test(email.trim())) localErrors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com';
    if (!isPasswordValid(password)) localErrors.password = 'La contraseña aún no cumple los requisitos';
    if (!isAdult) localErrors.isAdult = 'ASCENDX AI es solo para mayores de 18 años';
    if (!acceptTerms) localErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    if (!acceptDataPolicy) localErrors.acceptDataPolicy = 'Necesitamos tu autorización para tratar tus datos';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        isAdult: true,
        acceptTerms: true,
        acceptDataPolicy: true,
      });
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
        value={name}
        onChangeText={(text) => {
          setName(text);
          clearError('name');
        }}
        placeholder="Cómo quieres que te llamemos"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
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

      <View style={{ gap: spacing.lg }}>
        <Consent
          checked={isAdult}
          onChange={(value) => {
            setIsAdult(value);
            clearError('isAdult');
          }}
          error={errors.isAdult}
          label="Declaro que soy mayor de 18 años"
        >
          Declaro que soy mayor de 18 años.
        </Consent>
        <Consent
          checked={acceptTerms}
          onChange={(value) => {
            setAcceptTerms(value);
            clearError('acceptTerms');
          }}
          error={errors.acceptTerms}
          label="Acepto los términos y condiciones"
        >
          Acepto los términos y condiciones. Entiendo que ASCENDX AI es una herramienta educativa y no reemplaza la
          asesoría financiera profesional.
        </Consent>
        <Consent
          checked={acceptDataPolicy}
          onChange={(value) => {
            setAcceptDataPolicy(value);
            clearError('acceptDataPolicy');
          }}
          error={errors.acceptDataPolicy}
          label="Autorizo el tratamiento de mis datos personales"
        >
          Autorizo el tratamiento de mis datos personales y financieros conforme a la Ley 1581 de 2012. El análisis con IA
          y la lectura de recibos piden un permiso aparte.
        </Consent>
      </View>

      {formError ? <FormError message={formError} /> : null}

      <Button title="Crear cuenta" onPress={handleSubmit} loading={loading} />
    </AuthShell>
  );
}

function Consent({
  checked,
  onChange,
  error,
  label,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  label: string;
  children: string;
}) {
  return (
    <Checkbox checked={checked} onChange={onChange} invalid={Boolean(error)} accessibilityLabel={label}>
      <AppText variant="caption" color="textMuted">
        {children}
      </AppText>
      {error ? (
        <AppText variant="caption" color="danger" style={{ marginTop: 4 }}>
          {error}
        </AppText>
      ) : null}
    </Checkbox>
  );
}
