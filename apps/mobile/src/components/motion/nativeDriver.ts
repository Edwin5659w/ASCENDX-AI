import { Platform } from 'react-native';

/**
 * El motor nativo de animaciones solo existe en el teléfono. En la vista
 * previa web se usa el de JavaScript para no mostrar advertencias.
 */
export const NATIVE_DRIVER = Platform.OS !== 'web';
