/**
 * Secure storage adapter for Supabase Auth sessions.
 * Why: persist tokens on-device securely (Keychain / Keystore), not plain AsyncStorage.
 * Future: same adapter can store other sensitive client secrets if needed.
 *
 * Note: Expo SecureStore has a size limit (~2048 bytes on some platforms),
 * so values are split into chunks.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 2000;

async function setItem(key: string, value: string): Promise<void> {
  const chunkCount = Math.ceil(value.length / CHUNK_SIZE) || 1;

  await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));

  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_${index}`, chunk);
  }
}

async function getItem(key: string): Promise<string | null> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
  if (!chunkCountRaw) {
    // Backward-compatible single-key read
    return SecureStore.getItemAsync(key);
  }

  const chunkCount = Number(chunkCountRaw);
  let value = '';

  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = await SecureStore.getItemAsync(`${key}_${index}`);
    if (chunk == null) {
      return null;
    }
    value += chunk;
  }

  return value;
}

async function removeItem(key: string): Promise<void> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
  const chunkCount = chunkCountRaw ? Number(chunkCountRaw) : 0;

  await SecureStore.deleteItemAsync(`${key}_chunks`);
  await SecureStore.deleteItemAsync(key);

  for (let index = 0; index < chunkCount; index += 1) {
    await SecureStore.deleteItemAsync(`${key}_${index}`);
  }
}

export const secureStorageAdapter = {
  getItem,
  setItem,
  removeItem,
};
