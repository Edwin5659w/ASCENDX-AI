import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ascendx_show_welcome';

export async function markWelcomePending() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function peekWelcomePending(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function clearWelcomePending() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated prefer peek + clear; kept for call sites that only consume once */
export async function consumeWelcomePending() {
  const pending = await peekWelcomePending();
  if (pending) await clearWelcomePending();
  return pending;
}
