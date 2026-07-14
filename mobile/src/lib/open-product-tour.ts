import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ascendx_open_product_tour';

/** Marca que el dashboard debe abrir el tour una vez (p. ej. desde Perfil). */
export async function markOpenProductTour() {
  await AsyncStorage.setItem(KEY, '1');
}

export async function consumeOpenProductTour(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  if (v !== '1') return false;
  await AsyncStorage.removeItem(KEY);
  return true;
}
