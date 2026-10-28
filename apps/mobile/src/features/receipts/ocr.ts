import { NativeModules, Platform } from 'react-native';

/**
 * Lectura de texto en el dispositivo con Google ML Kit (RF-28, RNF-07).
 * La imagen nunca sale del teléfono: solo se usan el total, la fecha y el
 * comercio que el usuario revisa. ML Kit necesita una compilación de
 * desarrollo (EAS); en Expo Go y en la web no existe el módulo nativo y la
 * pantalla ofrece pegar el texto del recibo.
 */
export function onDeviceOcrAvailable() {
  return Platform.OS !== 'web' && Boolean(NativeModules.TextRecognition);
}

export async function recognizeText(imageUri: string): Promise<string> {
  if (!onDeviceOcrAvailable()) throw new Error('La lectura automática no está disponible en esta versión de la app.');
  const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
  const result = await TextRecognition.recognize(imageUri);
  return result.text;
}
