import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { AppButton, AppCard } from '@/components/ui/AppPrimitives';
import { ConfirmDialogOptions, registerDialogPresenter } from '@/lib/dialogs';

type DialogEntry = {
	id: number;
	type: 'notice' | 'confirm';
	title: string;
	message: string;
	confirmText: string;
	cancelText: string;
	destructive: boolean;
	onOk?: () => void;
	resolve?: (result: boolean) => void;
};

function makeDialogId() {
	return Date.now() + Math.random();
}

export default function AppDialogProvider({ children }: { children: React.ReactNode }) {
	const [queue, setQueue] = React.useState<DialogEntry[]>([]);
	const activeDialog = queue[0];

	const dismissCurrent = React.useCallback(() => {
		setQueue((prev) => prev.slice(1));
	}, []);

	const showConfirm = React.useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			setQueue((prev) => [
				...prev,
				{
					id: makeDialogId(),
					type: 'confirm',
					title: options.title,
					message: options.message,
					confirmText: options.confirmText || 'OK',
					cancelText: options.cancelText || 'Cancel',
					destructive: options.destructive || false,
					resolve,
				},
			]);
		});
	}, []);

	const showNotice = React.useCallback((title: string, message: string, onOk?: () => void) => {
		setQueue((prev) => [
			...prev,
			{
				id: makeDialogId(),
				type: 'notice',
				title,
				message,
				confirmText: 'OK',
				cancelText: 'Cancel',
				destructive: false,
				onOk,
			},
		]);
	}, []);

	React.useEffect(() => {
		registerDialogPresenter({
			confirm: showConfirm,
			notify: showNotice,
		});

		return () => {
			registerDialogPresenter(null);
		};
	}, [showConfirm, showNotice]);

	const handleConfirm = React.useCallback(() => {
		if (!activeDialog) return;

		activeDialog.resolve?.(true);
		activeDialog.onOk?.();
		dismissCurrent();
	}, [activeDialog, dismissCurrent]);

	const handleCancel = React.useCallback(() => {
		if (!activeDialog) return;

		activeDialog.resolve?.(false);
		dismissCurrent();
	}, [activeDialog, dismissCurrent]);

	return (
		<>
			{children}
			<Modal visible={Boolean(activeDialog)} transparent animationType="fade" onRequestClose={() => { }}>
				<View style={styles.overlay}>
					<View style={styles.dialogWrap}>
						{activeDialog ? (
							<AppCard padding={20} style={styles.dialogCard}>
								<Text style={styles.title}>{activeDialog.title}</Text>
								<Text style={styles.message}>{activeDialog.message}</Text>

								{activeDialog.type === 'confirm' ? (
									<View style={styles.actionRow}>
										<AppButton
											title={activeDialog.cancelText}
											onPress={handleCancel}
											variant="outline"
											size="md"
											style={styles.actionHalf}
										/>
										<AppButton
											title={activeDialog.confirmText}
											onPress={handleConfirm}
											size="md"
											style={[styles.actionHalf, activeDialog.destructive && styles.destructiveButton]}
										/>
									</View>
								) : (
									<AppButton
										title={activeDialog.confirmText}
										onPress={handleConfirm}
										variant="secondary"
										size="md"
									/>
								)}
							</AppCard>
						) : null}
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.52)',
		justifyContent: 'center',
		paddingHorizontal: 18,
	},
	dialogWrap: {
		width: '100%',
		maxWidth: 460,
		alignSelf: 'center',
	},
	dialogCard: {
		borderRadius: 16,
		borderColor: Colors.border,
	},
	title: {
		fontSize: 19,
		fontWeight: '800' as const,
		color: Colors.text,
		marginBottom: 8,
	},
	message: {
		fontSize: 14,
		lineHeight: 21,
		color: Colors.textSecondary,
		marginBottom: 18,
	},
	actionRow: {
		flexDirection: 'row',
		gap: 10,
	},
	actionHalf: {
		flex: 1,
	},
	destructiveButton: {
		backgroundColor: Colors.error,
	},
});
