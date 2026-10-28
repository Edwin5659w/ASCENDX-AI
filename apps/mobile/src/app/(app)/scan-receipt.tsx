import { parseReceiptText, type Confidence, type ReceiptFields } from '@ascendx/finance-core';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { AppText, Button, Card, errorMessage, Header, Icon, LoadingView, Screen, TextField } from '@/components/ui';
import { updateConsents } from '@/features/account/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDay } from '@/features/finance/labels';
import { onDeviceOcrAvailable, recognizeText } from '@/features/receipts/ocr';
import { formatCop } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

const CONFIDENCE_LABEL: Record<Confidence, string> = { alta: 'Lectura clara', media: 'Revisa este dato', baja: 'No se pudo leer' };

/**
 * RF-28: leer un recibo, mostrar lo extraído con su nivel de confianza y
 * pasar al formulario de movimiento para que el usuario confirme.
 */
export default function ScanReceiptScreen() {
  const { user, setUser } = useAuth();
  const { colors, radius, spacing } = useTheme();
  const allowed = user?.consents.ocr.granted ?? false;
  const nativeOcr = onDeviceOcrAvailable();
  const [granting, setGranting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [fields, setFields] = useState<ReceiptFields | null>(null);

  async function grant() {
    setGranting(true);
    try {
      const { user: updated } = await updateConsents({ ocr: true });
      setUser(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGranting(false);
    }
  }

  async function pick(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(fromCamera ? 'Necesitamos permiso de cámara para tomar la foto.' : 'Necesitamos permiso para abrir tus fotos.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    const result = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setReading(true);
    try {
      const text = await recognizeText(uri);
      setFields(parseReceiptText(text));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReading(false);
    }
  }

  function readPasted() {
    setError(null);
    setFields(parseReceiptText(pasted));
  }

  function useFields() {
    if (!fields) return;
    router.replace({
      pathname: '/new-movement',
      params: {
        type: 'gasto',
        source: 'ocr',
        ...(fields.total ? { amount: String(fields.total), total: String(fields.total) } : {}),
        ...(fields.date ? { date: fields.date, receiptDate: fields.date } : {}),
        ...(fields.merchant ? { description: fields.merchant, merchant: fields.merchant } : {}),
      },
    });
  }

  function reset() {
    setFields(null);
    setImageUri(null);
    setPasted('');
    setError(null);
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Escanear recibo" />

      {!allowed ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="shield" color="primary" />
            <AppText variant="heading" style={{ flex: 1 }}>
              Autoriza la lectura de recibos
            </AppText>
          </View>
          <AppText color="textMuted">
            El texto se lee en tu teléfono. No guardamos la foto: solo el total, la fecha y el comercio que tú confirmes.
          </AppText>
          <Button title="Autorizar" onPress={grant} loading={granting} />
        </Card>
      ) : fields ? (
        <>
          <Card elevated>
            <AppText variant="heading">Esto leímos</AppText>
            <FieldRow label="Total" value={fields.total ? formatCop(fields.total) : null} confidence={fields.totalConfidence} />
            <FieldRow label="Fecha" value={fields.date ? formatDay(fields.date) : null} confidence={fields.dateConfidence} />
            <FieldRow label="Comercio" value={fields.merchant} confidence={fields.merchantConfidence} />
            <AppText variant="caption" color="textMuted">
              En el siguiente paso puedes corregir cualquier dato y elegir la categoría. Nada se guarda sin tu confirmación.
            </AppText>
          </Card>
          <Button title="Revisar y registrar el gasto" onPress={useFields} />
          <Button title="Leer otro recibo" variant="ghost" onPress={reset} />
        </>
      ) : (
        <>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              accessibilityLabel="Foto del recibo"
              style={{ width: '100%', height: 260, borderRadius: radius.lg, backgroundColor: colors.surface }}
              resizeMode="contain"
            />
          ) : (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name="camera" color="primary" />
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  Consejos para una buena lectura
                </AppText>
              </View>
              <AppText color="textMuted">• Recibo plano y completo dentro de la foto.{'\n'}• Buena luz, sin sombras ni reflejos.{'\n'}• Que se vea la palabra TOTAL.</AppText>
            </Card>
          )}
          {reading ? <LoadingView label="Leyendo el recibo…" /> : null}
          {nativeOcr ? (
            <>
              <Button title="Tomar foto" onPress={() => pick(true)} disabled={reading} />
              <Button title="Elegir de la galería" variant="secondary" onPress={() => pick(false)} disabled={reading} />
            </>
          ) : (
            <Card>
              <AppText variant="bodyStrong">Pega el texto del recibo</AppText>
              <AppText variant="caption" color="textMuted">
                La lectura con cámara funciona en la app instalada para Android. Aquí puedes pegar el texto (por ejemplo, de una factura
                electrónica) y lo interpretamos igual.
              </AppText>
              <TextField label="Texto del recibo" value={pasted} onChangeText={setPasted} multiline numberOfLines={8} placeholder={'SUPERMERCADO EL ÉXITO\nNIT 890.900.608-9\n…\nTOTAL $ 84.900'} />
              <Button title="Interpretar texto" onPress={readPasted} disabled={pasted.trim().length < 5} />
            </Card>
          )}
          <Button title="Registrar a mano" variant="ghost" onPress={() => router.replace('/new-movement')} />
        </>
      )}
      {error ? <AppText color="danger">{error}</AppText> : null}
    </Screen>
  );
}

function FieldRow({ label, value, confidence }: { label: string; value: string | null; confidence: Confidence }) {
  const { spacing } = useTheme();
  const tone = confidence === 'alta' ? 'success' : confidence === 'media' ? 'warning' : 'danger';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
        <AppText variant="bodyStrong">{value ?? '—'}</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name={confidence === 'alta' ? 'check' : 'warning'} size={14} color={tone} />
        <AppText variant="caption" color={tone}>
          {CONFIDENCE_LABEL[confidence]}
        </AppText>
      </View>
    </View>
  );
}
