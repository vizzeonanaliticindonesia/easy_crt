import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import AppDialogProvider from '@/components/ui/AppDialogProvider';
import { StripeProvider } from '@/lib/stripe-mock';
import { notify } from '@/lib/dialogs';


function RootNavigation() {
	const { user, isLoading, logout } = useAuth();
	const router = useRouter();
	const segments = useSegments();
	const pathname = usePathname();

	useEffect(() => {
		if (isLoading) return;

		const firstSegment = segments[0] as string;
		if (firstSegment === 'reset-password') {
			return;
		}

		const publicRoutes = ['index', 'login', 'register-select', 'register-teacher', 'register-school', '+not-found'];
		const isPublicRoute = !firstSegment || publicRoutes.includes(firstSegment);
		const inTeacherTabs = firstSegment === '(teacher-tabs)';
		const inSchoolTabs = firstSegment === '(school-tabs)';
		const inTerms = firstSegment === 'terms';

		if (!user) {
			if (!isPublicRoute) {
				router.replace('/login');
			}
		} else if (!user.termsAccepted) {
			if (!inTerms) {
				router.replace('/terms');
			}
		} else {
			// support both numeric roles (9/10) and string roles ('teacher'/'school')
			const role = user.role;
			const isTeacherRole = role === 9 ;
			const isSchoolRole = role === 10 ;
			// Fail closed: a missing verification_status is treated as NOT verified, not verified.
			const verificationStatus = Number((user as any)?.verification_status ?? 0);

			// Verification guard
			if (verificationStatus !== 1) {

				// const inTeacherProfile =
				// 	pathname === '/(teacher-tabs)/profile';

				// const inSchoolProfile =
				// 	pathname === '/(school-tabs)/profile';

				const currentScreen = segments[1];
				const currentRoot = segments[0];

				const allowedScreen =
					currentScreen === 'profile' ||
					currentScreen === 'documents' ||
					currentRoot === 'create-document' ||
					currentRoot === 'edit-document';

				if (!allowedScreen) {

					if (isTeacherRole) {
						router.replace('/(teacher-tabs)/profile');
						return;
					}

					if (isSchoolRole) {
						router.replace('/(school-tabs)/profile');
						return;
					}

				}
			}
			
			if (isTeacherRole && inSchoolTabs) {
				router.replace('/(teacher-tabs)');
			} else if (isSchoolRole && inTeacherTabs) {
				router.replace('/(school-tabs)');
			} else if (isPublicRoute) {
				if (isTeacherRole) {
					router.replace('/(teacher-tabs)');
				} else if (isSchoolRole) {
					router.replace('/(school-tabs)');
				} else {
					notify('Error', 'Your account role could not be recognized. Please log in again.', () => {
						logout();
						router.replace('/login');
					});
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
            <StripeProvider publishableKey="pk_test_51Te5YgFLd8rQO6t7tPiECI7FAat99Upn0xGdhtBj4i05zyCZwxpGXWNwo3DV9G6vHdQK4CHIBc4l0WgC8xwO1Jff00kK5xkVv2">
                <AuthProvider>
                    <SessionProvider>
                        <AppDialogProvider>
                            <RootNavigation />
                            <StatusBar style="dark" />
                        </AppDialogProvider>
                    </SessionProvider>
                </AuthProvider>
            </StripeProvider>
        </SafeAreaProvider>
    );
}