import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <View style={styles.container}>
            {/* Row circles + lines */}
            <View style={styles.rowCircles}>
                {steps.map((_, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <View style={[styles.line, isCompleted && styles.lineCompleted]} />
                            )}
                            <View style={[
                                styles.circle,
                                isCompleted && styles.circleCompleted,
                                isActive && styles.circleActive,
                            ]}>
                                <Text style={[styles.circleText, (isCompleted || isActive) && styles.circleTextActive]}>
                                    {isCompleted ? '✓' : index + 1}
                                </Text>
                            </View>
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Row labels */}
            <View style={styles.rowLabels}>
                {steps.map((label, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <Text key={index} style={[
                            styles.label,
                            isActive && styles.labelActive,
                            isCompleted && styles.labelCompleted,
                        ]} numberOfLines={1}>
                            {label}
                        </Text>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    rowCircles: {
        flexDirection: 'row',
        alignItems: 'center',
		paddingHorizontal: 70,
    },
    rowLabels: {
        flexDirection: 'row',
        marginTop: 6,
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
    },
    lineCompleted: {
        backgroundColor: Colors.secondary,
    },
    label: {
        flex: 1,
        fontSize: 11,
        color: Colors.textMuted,
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