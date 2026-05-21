import api, { setAuthToken } from '@/lib/api';
import * as storage from '@/lib/storage';

// 🔥 pakai RELATIVE PATH
const TERMS_ENDPOINT = '/auth/terms';

export async function fetchTerms() {
  try {
    const savedUser = await storage.getUser();
    const token = (savedUser as any)?.token ?? null;

    console.log('[terms service] token:', token);

    if (token) {
      setAuthToken(token); // 🔥 FIX
    }
  } catch (e) {
    console.warn('[terms service] failed reading saved user', e);
  }

  const res = await api.get(TERMS_ENDPOINT);

  console.log('[terms service] response:', res);

  return res?.terms ?? res;
}