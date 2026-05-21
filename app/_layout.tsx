import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import AppDialogProvider from '@/components/ui/AppDialogProvider';

function RootNavigation() {
	const { user, isLoading } = useAuth();
	const router = useRouter();
	const segments = useSegments();
	const pathname = usePathname();

	useEffect(() => {
		if (isLoading) return;
		if (pathname.includes('reset-password')) {
			console.log('[RootNavigation] skip reset-password');
			return;
		}
		console.log('[RootNavigation] run route check', { user, isLoading, segments });

		const firstSegment = segments[0] as string;
		const publicRoutes = ['index', 'login', 'register-select', 'register-teacher', 'register-school', '+not-found'];
		const isPublicRoute = !firstSegment || publicRoutes.includes(firstSegment);
		const inTeacherTabs = firstSegment === '(teacher-tabs)';
		const inSchoolTabs = firstSegment === '(school-tabs)';
		const inTerms = firstSegment === 'terms';

		if (!user) {
			if (!isPublicRoute) {
				if (pathname.includes('reset-password')) {
					return;
				}
				console.log('[RootNavigation] no user - redirect to /login (from)', firstSegment);
				router.replace('/login');
			}
		} else if (!user.termsAccepted) {
			if (!inTerms) {
				console.log('[RootNavigation] user not accepted terms - redirect to /terms');
				router.replace('/terms');
			}
		} else {
			// support both numeric roles (9/10) and string roles ('teacher'/'school')
			const role = user.role;
			const isTeacherRole = role === 9 ;
			const isSchoolRole = role === 10 ;

			console.log('[RootNavigation] user accepted terms, role=', role, 'firstSegment=', firstSegment);
			if (isTeacherRole && inSchoolTabs) {
				console.log('[RootNavigation] teacher in school tabs - redirect to teacher-tabs');
				router.replace('/(teacher-tabs)');
			} else if (isSchoolRole && inTeacherTabs) {
				console.log('[RootNavigation] school in teacher tabs - redirect to school-tabs');
				router.replace('/(school-tabs)');
			} else if (isPublicRoute) {
				if (isTeacherRole) {
					console.log('[RootNavigation] public route - teacher -> teacher-tabs');
					router.replace('/(teacher-tabs)');
				} else if (isSchoolRole) {
					console.log('→ school masuk school-tabs');
					router.replace('/(school-tabs)');
				} else {
					console.log(' ROLE GA JELAS:', role);
				}
			}
		}
	}, [user, isLoading, segments, pathname, router]);

	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
				<ActivityIndicator size="large" color={Colors.primary} />
			</View>
		);
	}

	return (
		<Stack key={user?.role} screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen name="login" />
			<Stack.Screen name="register-select" />
			<Stack.Screen name="register-teacher" />
			<Stack.Screen name="register-school" />
			<Stack.Screen name="terms" />
			<Stack.Screen name="(teacher-tabs)" />
			<Stack.Screen name="(school-tabs)" />
			<Stack.Screen name="session-detail" options={{ presentation: 'card' }} />
			<Stack.Screen name="create-session" options={{ presentation: 'card' }} />
			<Stack.Screen name="upload-payment" options={{ presentation: 'card' }} />
			<Stack.Screen name="review-teacher" options={{ presentation: 'card' }} />
			<Stack.Screen name="+not-found" />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<AuthProvider>
				<SessionProvider>
					<AppDialogProvider>
						<RootNavigation />
						<StatusBar style="dark" />
					</AppDialogProvider>
				</SessionProvider>
			</AuthProvider>
		</SafeAreaProvider>
	);
}
