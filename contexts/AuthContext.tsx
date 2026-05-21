import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, TeacherProfile, SchoolProfile } from '@/types';
import * as storage from '@/lib/storage';
import api, { setAuthToken } from '@/lib/api';

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<{ success: boolean; message: string; status?: string; email?: string; reset_hash?: string }>;
	register: (userData: Partial<User> & { role: UserRole }) => Promise<{ success: boolean; message: string }>;
	logout: () => Promise<void>;
	updateUser: (updates: Partial<User>) => Promise<void>;
	acceptTerms: () => Promise<{ status: string; message: string }>;
	reset_password: (params: { email: string, reset_hash: string, password: string }) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type RegisterUserData = Partial<User> & {
	role: UserRole;
} & Partial<Pick<TeacherProfile,
	'subjects' |
	'preferred_name' |
	'first_name' |
	'last_name' |
	'subject_name' |
	'state' |
	'locality' |
	'pcode' |
	'qualifications'
>> & Partial<Pick<SchoolProfile, 'schoolName' | 'address' | 'contactPerson'>>;

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadUser();
	}, []);

	async function loadUser() {
		try {
			const savedUser = await storage.getUser();
			if (savedUser) {
				setUser(savedUser);
				setAuthToken((savedUser as any)?.token ?? null);
			}
		} catch (e) {
			console.error('Failed to load user:', e);
		} finally {
			setIsLoading(false);
		}
	}

	async function login(email: string, password: string): Promise<{ success: boolean; message: string; status?: string; email?: string; reset_hash?: string }> {
		// Try remote API login first
		try {
			const res = await fetch('https://teacher-relief.vizzeon.com/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ login: email, password }),
			});

			const data = await res.json().catch(() => null);
			if (res.status === 403 && data?.status === 'force_reset') {
				console.log('Password reset required for', email);
				return {
					success: false,
					status: 'force_reset',
					message: data?.message,
					email: data?.email,
					reset_hash: data?.reset_hash,
				};
			}
			if (res.ok && data && data.status === 'success') {
				// attach token to user object and persist
				const remoteUser = data.user || { email };
				const token = data.token;

				// Normalize role information coming from API: some APIs return `role_id`,
				// others return `role` as string. We'll store `role` as 'teacher'|'school'
				// and keep `role_id` when available for reference.
				const rawRole = (remoteUser as any).role ?? (remoteUser as any).role_id;
				let normalizedRole: 'teacher' | 'school' | undefined;
				let roleId: number | undefined;

				if (rawRole === 'teacher' || rawRole === 'school') {
					normalizedRole = rawRole;
				} else if (rawRole === 9 || rawRole === '9' || rawRole === 10 || rawRole === '10') {
					roleId = Number(rawRole);
					normalizedRole = roleId === 9 ? 'teacher' : 'school';
				} else if (typeof rawRole === 'number') {
					roleId = rawRole;
					normalizedRole = rawRole === 9 ? 'teacher' : rawRole === 10 ? 'school' : undefined;
				} else if (typeof rawRole === 'string') {
					const parsed = parseInt(rawRole as string, 10);
					if (!Number.isNaN(parsed)) {
						roleId = parsed;
						normalizedRole = parsed === 9 ? 'teacher' : parsed === 10 ? 'school' : undefined;
					}
				}

				const teacherName =
					data.teacherName ||
					(remoteUser as any).teacherName ||
					(remoteUser as any).name ||
					data.schoolName ||
					'';

				const userWithToken = {
					...(remoteUser as any),
					name: (remoteUser as any).name ?? teacherName,
					teacherName,
					role: roleId ?? (normalizedRole === 'teacher' ? 9 : normalizedRole === 'school' ? 10 : data.role_id ?? (remoteUser as any).role),
					role_id: roleId ?? (remoteUser as any).role_id,
					token,
					termsAccepted: data.termsAccepted,
					schoolName: data.schoolName,
				} as User;

				setUser(userWithToken);
				await storage.saveUser(userWithToken);
				console.log('LOGIN TOKEN:', data.token, 'normalizedRole=', (userWithToken as any).role, 'role_id=', (userWithToken as any).role_id);
				setAuthToken(token);
				return { success: true, message: data.message || 'Login successful' };
			}
			// If API responded with error, fall back to local/mock checks below
			return { success: false, message: 'Invalid email or password' };
		} catch (err) {
			// network error — continue to offline/mock fallback
			console.warn('API login failed, falling back to local auth', err);
			return { success: false, message: 'Login failed. Please try again.' };
		}
	}

	async function register(userData: RegisterUserData) {
		try {
			const allUsers = await storage.getAllUsers();
			const exists = allUsers.find(
				(u) => u.email.toLowerCase() === userData.email?.toLowerCase()
			);

			if (exists) {
				return { success: false, message: 'An account with this email already exists.' };
			}

			const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
			let newUser: User;

			if (userData.role === 9) {
				const teacherName =
					userData.teacherName ||
					userData.preferred_name ||
					userData.first_name ||
					userData.last_name ||
					'';

				newUser = {
					id,
					email: userData.email || '',
					password: userData.password || '',
					name: userData.name || teacherName,
					teacherName,
					role: 9,
					phone: userData.phone || '',
					location: userData.location || '',
					subjects: (userData as Partial<TeacherProfile>).subjects || [],
					preferred_name: userData.preferred_name || teacherName,
					first_name: userData.first_name || '',
					last_name: userData.last_name || '',
					subject_name: userData.subject_name || '',
					state: userData.state || '',
					locality: userData.locality || '',
					pcode: userData.pcode || '',
					qualifications: (userData as Partial<TeacherProfile>).qualifications || '',
					rating: 0,
					reviewCount: 0,
					isAvailable: true,
					documents: userData.documents || [],
					termsAccepted: false,
					integrityAccepted: userData.integrityAccepted || false,
					createdAt: new Date().toISOString(),
				} as TeacherProfile;
			} else {
				const schoolName = userData.schoolName || userData.name || '';

				newUser = {
					id,
					email: userData.email || '',
					password: userData.password || '',
					name: userData.name || schoolName,
					teacherName: userData.teacherName || schoolName,
					role: 10,
					phone: userData.phone || '',
					location: userData.location || '',
					schoolName,
					address: (userData as Partial<SchoolProfile>).address || '',
					contactPerson: (userData as Partial<SchoolProfile>).contactPerson || '',
					documents: userData.documents || [],
					termsAccepted: false,
					integrityAccepted: userData.integrityAccepted || false,
					createdAt: new Date().toISOString(),
				} as SchoolProfile;
			}

			allUsers.push(newUser);
			await storage.saveAllUsers(allUsers);
			setUser(newUser);
			await storage.saveUser(newUser);
			return { success: true, message: 'Registration successful' };
		} catch (e) {
			return { success: false, message: 'Registration failed. Please try again.' };
		}
	}

	async function logout() {
		// Try server-side revoke if token exists
		try {
			const saved = await storage.getUser();
			const token = (saved as any)?.token;
			if (token) {
				try {
					await fetch('https://teacher-relief.vizzeon.com/api/auth/logout', {
						method: 'POST',
						headers: { Authorization: `Bearer ${token}` },
					});
				} catch (e) {
					// ignore network logout errors
				}
			}
		} catch (e) {
			console.warn('Could not read saved user for logout', e);
		}

		setAuthToken(null);

		setUser(null);
		try {
			await storage.removeUser();
		} catch (e) {
			console.error('Failed to clear user session:', e);
		}
	}

	// async function logout() {
	// 	try {
	// 		await storage.removeUser()   // hapus user dari local
	// 		api.setAuthToken(null)       // hapus token
	// 		setUser(null)                // reset state
	// 	} catch (e) {
	// 		console.log('Logout error:', e)
	// 	}
	// }

	async function updateUser(updates: Partial<User>) {
		if (!user) return;

		const updated = { ...user, ...updates };
		setUser(updated);
		await storage.saveUser(updated);

		const allUsers = await storage.getAllUsers();
		const idx = allUsers.findIndex((u) => u.id === user.id);

		if (idx >= 0) {
			allUsers[idx] = updated;
			await storage.saveAllUsers(allUsers);
		}
	}

	async function acceptTerms() {
		return await api.post('/auth/terms/accept');
	}

	async function reset_password(params: { email: string, reset_hash: string, password: string }): Promise<{ success: boolean; message: string }> {
		try {
			const res = await fetch('https://teacher-relief.vizzeon.com/api/auth/reset_password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params),
			});
			const data = await res.json().catch(() => null);

			if (res.ok && data && data.status === 'success') {
				return { success: true, message: data.message || 'Password reset successful' };
			}
			return { success: false, message: data?.message || 'Password reset failed' };
		} catch (err) {
			console.warn('API password reset failed', err);
			return { success: false, message: 'Password reset failed. Please try again.' };
		}
	}

	return (
		<AuthContext.Provider
			value={{ user, isLoading, login, register, logout, updateUser, acceptTerms, reset_password }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
