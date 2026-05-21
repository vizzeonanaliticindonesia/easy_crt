import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, TeachingSession, AppNotification, TeacherProfile } from '@/types';

// Kumpulan key untuk penyimpanan di AsyncStorage
const KEYS = {
  USER: '@app_user',
  SESSIONS: '@app_sessions',
  NOTIFICATIONS: '@app_notifications',
  TEACHERS: '@app_teachers',
  USERS: '@app_users',
};

// Simpan 1 data user (login session)
export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

// Ambil data user yang tersimpan
export async function getUser(): Promise<User | null> {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export async function getToken(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;

  const token = (user as { token?: unknown }).token;
  return typeof token === 'string' ? token : null;
}

// Hapus data user (logout)
export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

// Simpan semua user (array)
export async function saveAllUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

// Ambil semua user
export async function getAllUsers(): Promise<User[]> {
  const data = await AsyncStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

// Simpan data sesi mengajar
export async function saveSessions(sessions: TeachingSession[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

// Ambil data sesi mengajar
export async function getSessions(): Promise<TeachingSession[]> {
  const data = await AsyncStorage.getItem(KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

// Simpan data notifikasi
export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

// Ambil data notifikasi
export async function getNotifications(): Promise<AppNotification[]> {
  const data = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
}

// Simpan data profil guru
export async function saveTeachers(teachers: TeacherProfile[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TEACHERS, JSON.stringify(teachers));
}

// Ambil data profil guru
export async function getTeachers(): Promise<TeacherProfile[]> {
  const data = await AsyncStorage.getItem(KEYS.TEACHERS);
  return data ? JSON.parse(data) : [];
}

// Hapus semua data di AsyncStorage (reset / logout total)
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}