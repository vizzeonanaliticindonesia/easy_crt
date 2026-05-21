import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useResponsiveSpacing } from '@/components/ui/AppPrimitives';

interface StepIndicatorProps {
	steps: string[];
	currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
	const spacing = useResponsiveSpacing();

	return (
		<View style={[styles.container, { paddingHorizontal: spacing.horizontal }]}>
			{steps.map((label, index) => {
				const isActive = index === currentStep;
				const isCompleted = index < currentStep;
				return (
					<View key={index} style={styles.stepContainer}>
						<View style={styles.stepRow}>
							<View
								style={[
									styles.circle,
									isCompleted && styles.circleCompleted,
									isActive && styles.circleActive,
								]}
							>
								<Text
									style={[
										styles.circleText,
										(isCompleted || isActive) && styles.circleTextActive,
									]}
								>
									{isCompleted ? '\u2713' : index + 1}
								</Text>
							</View>
							{index < steps.length - 1 && (
								<View style={[styles.line, isCompleted && styles.lineCompleted]} />
							)}
						</View>
						<Text
							style={[
								styles.label,
								isActive && styles.labelActive,
								isCompleted && styles.labelCompleted,
							]}
							numberOfLines={1}
						>
							{label}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 0,
		paddingVertical: 14,
	},
	stepContainer: {
		flex: 1,
		alignItems: 'center',
	},
	stepRow: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		justifyContent: 'center',
	},
	circle: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: Colors.borderLight,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: Colors.border,
	},
	circleActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	circleCompleted: {
		backgroundColor: Colors.secondary,
		borderColor: Colors.secondary,
	},
	circleText: {
		fontSize: 12,
		fontWeight: '700' as const,
		color: Colors.textMuted,
	},
	circleTextActive: {
		color: '#FFF',
	},
	line: {
		flex: 1,
		height: 2,
		backgroundColor: Colors.border,
		marginHorizontal: 6,
	},
	lineCompleted: {
		backgroundColor: Colors.secondary,
	},
	label: {
		fontSize: 11,
		color: Colors.textMuted,
		marginTop: 6,
		textAlign: 'center',
	},
	labelActive: {
		color: Colors.primary,
		fontWeight: '600' as const,
	},
	labelCompleted: {
		color: Colors.secondary,
	},
});
