import { Alert, Platform } from 'react-native';

export type ConfirmDialogOptions = {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	destructive?: boolean;
};

type DialogPresenter = {
	confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
	notify: (title: string, message: string, onOk?: () => void) => void;
};

let activePresenter: DialogPresenter | null = null;

export function registerDialogPresenter(presenter: DialogPresenter | null) {
	activePresenter = presenter;
}

function getWebDialogApi(): { alert?: (message: string) => void; confirm?: (message: string) => boolean } {
	return globalThis as unknown as { alert?: (message: string) => void; confirm?: (message: string) => boolean };
}

export async function confirmDialog({
	title,
	message,
	confirmText = 'OK',
	cancelText = 'Cancel',
	destructive = false,
}: ConfirmDialogOptions): Promise<boolean> {
	if (activePresenter) {
		return activePresenter.confirm({ title, message, confirmText, cancelText, destructive });
	}

	if (Platform.OS === 'web') {
		const webDialog = getWebDialogApi();
		if (typeof webDialog.confirm === 'function') {
			return webDialog.confirm(`${title}\n\n${message}`);
		}
		return false;
	}

	return new Promise<boolean>((resolve) => {
		Alert.alert(
			title,
			message,
			[
				{ text: cancelText, style: 'cancel', onPress: () => resolve(false) },
				{
					text: confirmText,
					style: destructive ? 'destructive' : 'default',
					onPress: () => resolve(true),
				},
			],
			{ cancelable: false }
		);
	});
}

export function notify(title: string, message: string, onOk?: () => void) {
	if (activePresenter) {
		activePresenter.notify(title, message, onOk);
		return;
	}

	if (Platform.OS === 'web') {
		const webDialog = getWebDialogApi();
		if (typeof webDialog.alert === 'function') {
			webDialog.alert(`${title}\n\n${message}`);
		}
		onOk?.();
		return;
	}

	if (onOk) {
		Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
		return;
	}

	Alert.alert(title, message);
}
