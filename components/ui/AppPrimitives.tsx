import React from 'react';
import {
	ActivityIndicator,
	KeyboardTypeOptions,
	Modal,
	Pressable,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View,
	ViewStyle,
	useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { Colors } from '@/constants/Colors';
import { SessionStatus } from '@/types';

type CardVariant = 'surface' | 'primaryTint' | 'secondaryTint' | 'warningTint';
type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'md' | 'lg';
type StatusTone = 'pending' | 'active' | 'complete' | 'declined' | 'primary' | 'secondary' | 'error' | 'neutral';
type ChipTone = 'primary' | 'secondary' | 'danger' | 'warning' | 'neutral';
type ChipVariant = 'outline' | 'soft';
type SectionHeadingSize = 'sm' | 'md' | 'lg';
type SectionHeadingTone = 'default' | 'muted';

type ResponsiveSpacing = {
	horizontal: number;
	topOffset: number;
	topBarVertical: number;
	sectionGap: number;
	cardPadding: number;
	bottomPadding: number;
	titleSize: number;
	iconButtonSize: number;
	iconGlyphSize: number;
	heroIconSize: number;
};

export type SessionStatusVisual = {
	label: string;
	color: string;
	bg: string;
};

export const SESSION_STATUS_VISUALS: Record<SessionStatus, SessionStatusVisual> = {
	pending: { label: 'Pending', color: Colors.statusPending, bg: Colors.warningBg },
	accepted: { label: 'Accepted', color: Colors.statusActive, bg: Colors.primaryBg },
	checked_in: { label: 'Checked In', color: Colors.statusActive, bg: Colors.primaryBg },
	attendance_confirmed: { label: 'Attendance Confirmed', color: Colors.statusActive, bg: Colors.primaryBg },
	completed: { label: 'Session Completed', color: Colors.secondary, bg: Colors.secondaryBg },
	completion_confirmed: { label: 'Completion Confirmed', color: Colors.statusComplete, bg: Colors.secondaryBg },
	invoice_sent: { label: 'Invoice Sent', color: Colors.statusPending, bg: Colors.warningBg },
	payment_uploaded: { label: 'Payment Uploaded', color: Colors.statusActive, bg: Colors.primaryBg },
	payment_confirmed: { label: 'Payment Confirmed', color: Colors.statusComplete, bg: Colors.secondaryBg },
	reviewed: { label: 'Reviewed', color: Colors.statusComplete, bg: Colors.secondaryBg },
	declined: { label: 'Declined', color: Colors.statusDeclined, bg: Colors.errorBg },
	open: { label: 'Open', color: Colors.statusActive, bg: Colors.primaryBg },
	closed: { label: 'Closed', color: Colors.statusComplete, bg: Colors.successBg },
};

const STATUS_TONE_VISUALS: Record<StatusTone, { color: string; bg: string }> = {
	pending: { color: Colors.statusPending, bg: Colors.warningBg },
	active: { color: Colors.statusActive, bg: Colors.primaryBg },
	complete: { color: Colors.statusComplete, bg: Colors.secondaryBg },
	declined: { color: Colors.statusDeclined, bg: Colors.errorBg },
	primary: { color: Colors.primary, bg: Colors.primaryBg },
	secondary: { color: Colors.secondary, bg: Colors.secondaryBg },
	error: { color: Colors.error, bg: Colors.errorBg },
	neutral: { color: Colors.textSecondary, bg: Colors.borderLight },
};

const CHIP_TONE_VISUALS: Record<ChipTone, { color: string; bg: string }> = {
	primary: { color: Colors.primary, bg: Colors.primaryBg },
	secondary: { color: Colors.secondary, bg: Colors.secondaryBg },
	danger: { color: Colors.error, bg: Colors.errorBg },
	warning: { color: Colors.warning, bg: Colors.warningBg },
	neutral: { color: Colors.textSecondary, bg: Colors.borderLight },
};

const SECTION_HEADING_SIZE_STYLES: Record<SectionHeadingSize, TextStyle> = {
	sm: { fontSize: 16, lineHeight: 21 },
	md: { fontSize: 18, lineHeight: 24 },
	lg: { fontSize: 20, lineHeight: 26 },
};

const SECTION_HEADING_TONE_STYLES: Record<SectionHeadingTone, TextStyle> = {
	default: { color: Colors.text },
	muted: { color: Colors.textSecondary },
};

export function getSessionStatusVisual(status: SessionStatus): SessionStatusVisual {
	return SESSION_STATUS_VISUALS[status] || {
		label: 'Unknown',
		color: Colors.textMuted,
		bg: Colors.borderLight,
	};
}

export function useResponsiveSpacing(): ResponsiveSpacing {
	const { height } = useWindowDimensions();

	if (height <= 680) {
		return {
			horizontal: 16,
			topOffset: 14,
			topBarVertical: 8,
			sectionGap: 12,
			cardPadding: 16,
			bottomPadding: 20,
			titleSize: 25,
			iconButtonSize: 38,
			iconGlyphSize: 20,
			heroIconSize: 64,
		};
	}

	if (height >= 900) {
		return {
			horizontal: 28,
			topOffset: 24,
			topBarVertical: 14,
			sectionGap: 18,
			cardPadding: 26,
			bottomPadding: 36,
			titleSize: 30,
			iconButtonSize: 44,
			iconGlyphSize: 24,
			heroIconSize: 78,
		};
	}

	return {
		horizontal: 24,
		topOffset: 20,
		topBarVertical: 12,
		sectionGap: 16,
		cardPadding: 22,
		bottomPadding: 28,
		titleSize: 28,
		iconButtonSize: 40,
		iconGlyphSize: 22,
		heroIconSize: 72,
	};
}

function toDateValue(value: DateType): Date | null {
	if (!value) return null;

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === 'object') {
		const dateLike = value as { toDate?: () => Date };
		if (typeof dateLike.toDate === 'function') {
			const resolved = dateLike.toDate();
			return Number.isNaN(resolved.getTime()) ? null : resolved;
		}
	}

	const parsed = new Date(value as string | number);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForField(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatTimeForField(date: Date): string {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

function parseDateField(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return null;
	}

	return parsed;
}

function parseTimeField(value: string): Date | null {
	const match = /^(\d{2}):(\d{2})$/.exec(value);
	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

	const parsed = new Date();
	parsed.setHours(hours, minutes, 0, 0);
	return parsed;
}

function getCardVariantStyle(variant: CardVariant): StyleProp<ViewStyle> {
	if (variant === 'primaryTint') {
		return {
			backgroundColor: Colors.primaryBg,
			borderColor: Colors.primary + '30',
		};
	}

	if (variant === 'secondaryTint') {
		return {
			backgroundColor: Colors.secondaryBg,
			borderColor: Colors.secondary + '30',
		};
	}

	if (variant === 'warningTint') {
		return {
			backgroundColor: Colors.warningBg,
			borderColor: Colors.warning + '30',
		};
	}

	return {
		backgroundColor: Colors.surface,
		borderColor: Colors.border,
	};
}

function getButtonVariantStyle(variant: ButtonVariant): {
	container: StyleProp<ViewStyle>;
	textColor: string;
	spinnerColor: string;
} {
	if (variant === 'secondary') {
		return {
			container: { backgroundColor: Colors.secondary },
			textColor: '#FFF',
			spinnerColor: '#FFF',
		};
	}

	if (variant === 'outline') {
		return {
			container: {
				backgroundColor: Colors.surface,
				borderWidth: 1,
				borderColor: Colors.border,
			},
			textColor: Colors.primary,
			spinnerColor: Colors.primary,
		};
	}

	return {
		container: { backgroundColor: Colors.primary },
		textColor: '#FFF',
		spinnerColor: '#FFF',
	};
}

export function AppIconButton({
	icon,
	onPress,
	size = 20,
	containerSize = 40,
	style,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
	size?: number;
	containerSize?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<Pressable
			style={({ pressed }) => [
				styles.iconButton,
				{
					width: containerSize,
					height: containerSize,
					borderRadius: containerSize / 2,
					opacity: pressed ? 0.75 : 1,
				},
				style,
			]}
			onPress={onPress}
		>
			<Ionicons name={icon} size={size} color={Colors.text} />
		</Pressable>
	);
}

export function AppTopBar({
	title,
	onBack,
	horizontalPadding = 16,
	verticalPadding = 12,
	iconButtonSize = 40,
	iconSize = 20,
}: {
	title: string;
	onBack: () => void;
	horizontalPadding?: number;
	verticalPadding?: number;
	iconButtonSize?: number;
	iconSize?: number;
}) {
	return (
		<View style={[styles.topBar, { paddingHorizontal: horizontalPadding, paddingVertical: verticalPadding }]}>
			<AppIconButton icon="arrow-back" onPress={onBack} containerSize={iconButtonSize} size={iconSize} />
			<Text style={styles.topTitle}>{title}</Text>
			<View style={{ width: iconButtonSize, height: iconButtonSize }} />
		</View>
	);
}

export function AppCard({
	children,
	variant = 'surface',
	padding = 20,
	style,
}: {
	children: React.ReactNode;
	variant?: CardVariant;
	padding?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.cardBase, getCardVariantStyle(variant), { padding }, style]}>
			{children}
		</View>
	);
}

export function AppButton({
	title,
	onPress,
	variant = 'primary',
	size = 'lg',
	loading = false,
	disabled = false,
	icon,
	style,
}: {
	title: string;
	onPress: () => void;
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	icon?: keyof typeof Ionicons.glyphMap;
	style?: StyleProp<ViewStyle>;
}) {
	const variantStyle = getButtonVariantStyle(variant);
	const vertical = size === 'md' ? 14 : 16;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.buttonBase,
				variantStyle.container,
				{
					paddingVertical: vertical,
					opacity: disabled || loading ? 0.7 : pressed ? 0.82 : 1,
				},
				style,
			]}
			onPress={onPress}
			disabled={disabled || loading}
		>
			{loading ? (
				<ActivityIndicator color={variantStyle.spinnerColor} />
			) : (
				<>
					<Text style={[styles.buttonText, { color: variantStyle.textColor }]}>{title}</Text>
					{icon ? <Ionicons name={icon} size={18} color={variantStyle.textColor} /> : null}
				</>
			)}
		</Pressable>
	);
}

export function AppPageHeader({
	title,
	subtitle,
	centered = false,
	titleStyle,
	subtitleStyle,
	style,
}: {
	title: string;
	subtitle?: string;
	centered?: boolean;
	titleStyle?: StyleProp<TextStyle>;
	subtitleStyle?: StyleProp<TextStyle>;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.pageHeader, centered && styles.pageHeaderCentered, style]}>
			<Text style={[styles.pageTitle, centered && styles.pageTitleCentered, titleStyle]}>{title}</Text>
			{subtitle ? (
				<Text style={[styles.pageSubtitle, centered && styles.pageTitleCentered, subtitleStyle]}>{subtitle}</Text>
			) : null}
		</View>
	);
}

export function AppSectionHeader({
	title,
	actionLabel,
	onActionPress,
	actionColor = Colors.primary,
	titleSize = 'md',
	titleTone = 'default',
	titleStyle,
	style,
}: {
	title: string;
	actionLabel?: string;
	onActionPress?: () => void;
	actionColor?: string;
	titleSize?: SectionHeadingSize;
	titleTone?: SectionHeadingTone;
	titleStyle?: StyleProp<TextStyle>;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.sectionHeader, style]}>
			<AppSectionTitle title={title} size={titleSize} tone={titleTone} style={titleStyle} />
			{actionLabel && onActionPress ? (
				<TouchableOpacity onPress={onActionPress} activeOpacity={0.75}>
					<Text style={[styles.sectionAction, { color: actionColor }]}>{actionLabel}</Text>
				</TouchableOpacity>
			) : null}
		</View>
	);
}

export function AppSectionTitle({
	title,
	size = 'md',
	tone = 'default',
	style,
}: {
	title: string;
	size?: SectionHeadingSize;
	tone?: SectionHeadingTone;
	style?: StyleProp<TextStyle>;
}) {
	return (
		<Text
			style={[
				styles.sectionTitleBase,
				SECTION_HEADING_SIZE_STYLES[size],
				SECTION_HEADING_TONE_STYLES[tone],
				style,
			]}
		>
			{title}
		</Text>
	);
}

export function AppStatusBadge({
	status,
	label,
	tone = 'neutral',
	showDot = false,
	size = 'md',
	color,
	backgroundColor,
	style,
	textStyle,
}: {
	status?: SessionStatus;
	label?: string;
	tone?: StatusTone;
	showDot?: boolean;
	size?: 'sm' | 'md';
	color?: string;
	backgroundColor?: string;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
}) {
	const statusVisual = status ? getSessionStatusVisual(status) : undefined;
	const toneVisual = STATUS_TONE_VISUALS[tone];
	const resolvedLabel = label || statusVisual?.label || 'Status';
	const resolvedColor = color || statusVisual?.color || toneVisual.color;
	const resolvedBg = backgroundColor || statusVisual?.bg || toneVisual.bg;
	const paddingVertical = size === 'sm' ? 5 : 6;
	const paddingHorizontal = size === 'sm' ? 9 : 11;
	const fontSize = size === 'sm' ? 11 : 12;
	const dotSize = size === 'sm' ? 6 : 8;

	return (
		<View
			style={[
				styles.statusBadge,
				{
					backgroundColor: resolvedBg,
					paddingVertical,
					paddingHorizontal,
				},
				style,
			]}
		>
			{showDot ? (
				<View
					style={[
						styles.statusBadgeDot,
						{
							backgroundColor: resolvedColor,
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
						},
					]}
				/>
			) : null}
			<Text style={[styles.statusBadgeText, { color: resolvedColor, fontSize }, textStyle]}>
				{resolvedLabel}
			</Text>
		</View>
	);
}

export function AppChip({
	label,
	selected = false,
	onPress,
	tone = 'primary',
	variant = 'outline',
	size = 'md',
	disabled = false,
	style,
	textStyle,
}: {
	label: string;
	selected?: boolean;
	onPress?: () => void;
	tone?: ChipTone;
	variant?: ChipVariant;
	size?: 'sm' | 'md';
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
}) {
	const toneVisual = CHIP_TONE_VISUALS[tone];
	const paddingVertical = size === 'sm' ? 6 : 9;
	const paddingHorizontal = size === 'sm' ? 12 : 16;
	const borderRadius = size === 'sm' ? 16 : 20;
	const fontSize = size === 'sm' ? 13 : 14;

	let bg = Colors.surface;
	let border = Colors.border;
	let text = Colors.text;

	if (selected) {
		bg = toneVisual.color;
		border = toneVisual.color;
		text = '#FFF';
	} else if (variant === 'soft') {
		bg = toneVisual.bg;
		border = toneVisual.color + '2B';
		text = toneVisual.color;
	}

	const chipBody = (
		<View
			style={[
				styles.chipBase,
				{
					paddingVertical,
					paddingHorizontal,
					borderRadius,
					backgroundColor: bg,
					borderColor: border,
				},
				style,
			]}
		>
			<Text style={[styles.chipBaseText, { color: text, fontSize }, selected && styles.chipBaseTextSelected, textStyle]}>
				{label}
			</Text>
		</View>
	);

	if (!onPress) return chipBody;

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			style={({ pressed }) => [styles.chipPressable, (pressed && !disabled) && styles.chipPressablePressed]}
		>
			{chipBody}
		</Pressable>
	);
}

type AppChipGroupItem = {
	id: string;
	label: string;
	selected?: boolean;
	onPress?: () => void;
	tone?: ChipTone;
	variant?: ChipVariant;
	disabled?: boolean;
};

export function AppChipGroup({
	items,
	horizontal = false,
	gap = 8,
	size = 'md',
	defaultTone = 'primary',
	defaultVariant = 'outline',
	style,
	contentContainerStyle,
	showsHorizontalScrollIndicator = false,
}: {
	items: AppChipGroupItem[];
	horizontal?: boolean;
	gap?: number;
	size?: 'sm' | 'md';
	defaultTone?: ChipTone;
	defaultVariant?: ChipVariant;
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	showsHorizontalScrollIndicator?: boolean;
}) {
	if (horizontal) {
		return (
			<ScrollView
				horizontal
				style={style}
				contentContainerStyle={[styles.chipGroupRow, { gap }, contentContainerStyle]}
				showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
			>
				{items.map((item) => (
					<AppChip
						key={item.id}
						label={item.label}
						selected={item.selected}
						onPress={item.onPress}
						tone={item.tone || defaultTone}
						variant={item.variant || defaultVariant}
						size={size}
						disabled={item.disabled}
					/>
				))}
			</ScrollView>
		);
	}

	return (
		<View style={[styles.chipGroupWrap, { gap }, style]}>
			{items.map((item) => (
				<AppChip
					key={item.id}
					label={item.label}
					selected={item.selected}
					onPress={item.onPress}
					tone={item.tone || defaultTone}
					variant={item.variant || defaultVariant}
					size={size}
					disabled={item.disabled}
				/>
			))}
		</View>
	);
}

export function AppEmptyState({
	icon,
	title,
	subtitle,
	iconSize = 44,
	iconColor = Colors.textMuted,
	padding = 20,
	style,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle: string;
	iconSize?: number;
	iconColor?: string;
	padding?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<AppCard padding={padding} style={[styles.emptyState, style]}>
			<Ionicons name={icon} size={iconSize} color={iconColor} />
			<Text style={styles.emptyStateTitle}>{title}</Text>
			<Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
		</AppCard>
	);
}

export function AppStatCard({
	icon,
	label,
	value,
	color,
	padding = 14,
	style,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	value: string | number;
	color: string;
	padding?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<AppCard padding={padding} style={[styles.statCard, style]}>
			<Ionicons name={icon} size={20} color={color} />
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</AppCard>
	);
}

export function AppInfoRow({
	icon,
	label,
	value,
	variant = 'inline',
	labelWidth,
	iconSize = 16,
	showBorder = true,
	style,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	value: string;
	variant?: 'inline' | 'stacked';
	labelWidth?: number;
	iconSize?: number;
	showBorder?: boolean;
	style?: StyleProp<ViewStyle>;
}) {
	const labelWidthStyle = labelWidth != null ? { width: labelWidth } : undefined;

	return (
		<View style={[styles.infoRowBase, showBorder && styles.infoRowBorder, style]}>
			<Ionicons name={icon} size={iconSize} color={Colors.textMuted} />
			{variant === 'stacked' ? (
				<View style={styles.infoStackedContent}>
					<Text style={styles.infoStackedLabel}>{label}</Text>
					<Text style={styles.infoStackedValue}>{value}</Text>
				</View>
			) : (
				<>
					<Text style={[styles.infoInlineLabel, labelWidthStyle]}>{label}</Text>
					<Text style={styles.infoInlineValue}>{value}</Text>
				</>
			)}
		</View>
	);
}

export function AppField({
	label,
	value,
	onChangeText,
	placeholder,
	icon,
	trailing,
	secureTextEntry,
	multiline,
	keyboardType,
	helperText,
	containerStyle,
	inputProps,
}: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	trailing?: React.ReactNode;
	secureTextEntry?: boolean;
	multiline?: boolean;
	keyboardType?: KeyboardTypeOptions;
	helperText?: string;
	containerStyle?: StyleProp<ViewStyle>;
	inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'multiline' | 'keyboardType'>;
}) {
	return (
		<View style={[styles.fieldGroup, containerStyle]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<View style={[styles.fieldWrap, multiline && styles.fieldWrapMultiline]}>
				{icon ? <Ionicons name={icon} size={18} color={Colors.textMuted} /> : null}
				<TextInput
					style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder || `Enter ${label.toLowerCase()}`}
					placeholderTextColor={Colors.textMuted}
					secureTextEntry={secureTextEntry}
					multiline={multiline}
					keyboardType={keyboardType}
					{...inputProps}
				/>
				{trailing}
			</View>
			{helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}
		</View>
	);
}

export function AppSearchSelectField({
	label,
	value,
	onChange,
	options,
	placeholder = 'Select an option',
	searchPlaceholder = 'Search...',
	helperText,
	emptyText = 'No options found.',
	containerStyle,
	closeOnSelect = false,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { label: string; value: string }[];
	placeholder?: string;
	searchPlaceholder?: string;
	helperText?: string;
	emptyText?: string;
	containerStyle?: StyleProp<ViewStyle>;
	closeOnSelect?: boolean;
}) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');

	const filteredOptions = React.useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return options;
		return options.filter((item) => item.label.toLowerCase().includes(normalized));
	}, [options, query]);

	const displayValue = React.useMemo(() => {
		if (!value) return '';
		const byValue = options.find((o) => String(o.value) === String(value));
		if (byValue) return byValue.label;
		const byLabel = options.find((o) => o.label === value);
		if (byLabel) return byLabel.label;
		return value;
	}, [options, value]);

	function closePicker() {
		setIsOpen(false);
		setQuery('');
	}

	return (
		<View style={[styles.fieldGroup, containerStyle]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				onPress={() => setIsOpen(true)}
				style={({ pressed }) => [styles.searchSelectTrigger, pressed && styles.searchSelectTriggerPressed]}
			>
				<Text style={[styles.searchSelectText, !displayValue && styles.searchSelectPlaceholder]}>
					{displayValue || placeholder}
				</Text>
				<Text style={styles.searchSelectAction}>Choose</Text>
			</Pressable>
			{helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}

			<Modal
				visible={isOpen}
				transparent
				animationType="fade"
				onRequestClose={() => { }}
			>
				<View style={styles.searchSelectModalRoot}>
					<View style={styles.searchSelectModalBackdrop} />
					<View style={styles.searchSelectModalCard}>
						<View style={styles.searchSelectModalHeader}>
							<Text style={styles.searchSelectModalTitle}>{label}</Text>
							<TouchableOpacity onPress={closePicker} activeOpacity={0.75}>
								<Text style={styles.searchSelectModalClose}>Close</Text>
							</TouchableOpacity>
						</View>

						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder={searchPlaceholder}
							placeholderTextColor={Colors.textMuted}
							style={styles.searchSelectInput}
							autoCapitalize="none"
							autoCorrect={false}
						/>

						<ScrollView
							style={styles.searchSelectResults}
							contentContainerStyle={styles.searchSelectResultsContent}
							keyboardShouldPersistTaps="handled"
						>
							{filteredOptions.length === 0 ? (
								<Text style={styles.searchSelectEmptyText}>{emptyText}</Text>
							) : (
								filteredOptions.map((item) => (
									<Pressable
										key={item.value}
										onPress={() => {
											onChange(item.value);
											if (closeOnSelect) {
												closePicker();
											}
										}}
										style={({ pressed }) => [
											styles.searchSelectOption,
											(String(value) === String(item.value) || value === item.label) && styles.searchSelectOptionSelected,
											pressed && styles.searchSelectOptionPressed,
										]}
									>
										<Text style={[styles.searchSelectOptionText, (String(value) === String(item.value) || value === item.label) && styles.searchSelectOptionTextSelected]}>
											{item.label}
										</Text>
										{(String(value) === String(item.value) || value === item.label) ? <Text style={styles.searchSelectOptionBadge}>Selected</Text> : null}
									</Pressable>
								))
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}

export function AppDateField({
	label,
	value,
	onChange,
	placeholder = 'Select date',
	minimumDate,
	helperText,
	containerStyle,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minimumDate?: string;
	helperText?: string;
	containerStyle?: StyleProp<ViewStyle>;
}) {
	const pickerStyles = useDefaultStyles();
	const [isOpen, setIsOpen] = React.useState(false);
	const selectedDate = parseDateField(value) || new Date();
	const minDate = minimumDate ? parseDateField(minimumDate) : undefined;

	return (
		<View style={[styles.fieldGroup, containerStyle]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				onPress={() => setIsOpen(true)}
				style={({ pressed }) => [styles.pickerFieldWrap, pressed && styles.pickerFieldWrapPressed]}
			>
				<Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
				<Text style={[styles.pickerFieldText, !value && styles.pickerFieldPlaceholder]}>
					{value || placeholder}
				</Text>
				<Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
			</Pressable>
			{helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}

			<Modal
				visible={isOpen}
				transparent
				animationType="fade"
				onRequestClose={() => { }}
			>
				<View style={styles.pickerModalRoot}>
					<View style={styles.pickerModalBackdrop} />
					<View style={styles.pickerModalCard}>
						<View style={styles.pickerModalHeader}>
							<Text style={styles.pickerModalTitle}>{label}</Text>
							<TouchableOpacity onPress={() => setIsOpen(false)} activeOpacity={0.75}>
								<Text style={styles.pickerModalAction}>Close</Text>
							</TouchableOpacity>
						</View>
						<DateTimePicker
							mode="single"
							date={selectedDate}
							minDate={minDate}
							maxDate={new Date(2100, 11, 31)}
							onChange={({ date }) => {
								const next = toDateValue(date);
								if (!next) return;
								onChange(formatDateForField(next));
								setIsOpen(false); // yg diubah
							}}
							styles={{
								...pickerStyles,

								// 🔥 TEXT UTAMA
								day_label: { color: '#111' },

								// 🔥 NAMA HARI (Mon Tue)
								weekday_label: { color: '#333' },

								// 🔥 BULAN (INI YANG DI SCREENSHOT)
								month_label: { color: '#111' },

								// 🔥 TAHUN
								year_label: { color: '#111' },

								// 🔥 HEADER (April 2020)
								month_selector_label: { color: '#111' },
								year_selector_label: { color: '#111' },

								// 🔥 SELECTED
								selected: { backgroundColor: '#16a34a' },
								selected_label: { color: '#fff' },

								// 🔥 TODAY
								today_label: { color: '#16a34a' },
								// 🔥 tombol next & prev
								button_next_image: { tintColor: '#000' },
								button_prev_image: { tintColor: '#000' },
							}}
						/>
					</View>
				</View>
			</Modal>
		</View>
	);
}

function AppTimePickerField({
	label,
	value,
	onChange,
	placeholder,
	containerStyle,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	containerStyle?: StyleProp<ViewStyle>;
}) {
	const pickerStyles = useDefaultStyles();
	const [isOpen, setIsOpen] = React.useState(false);
	const [selectedTime, setSelectedTime] = React.useState<Date>(() => parseTimeField(value) || new Date());

	React.useEffect(() => {
		if (isOpen) return;
		setSelectedTime(parseTimeField(value) || new Date());
	}, [isOpen, value]);

	function openPicker() {
		setSelectedTime(parseTimeField(value) || new Date());
		setIsOpen(true);
	}

	return (
		<View style={[styles.fieldGroup, containerStyle]}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				onPress={openPicker}
				style={({ pressed }) => [styles.pickerFieldWrap, pressed && styles.pickerFieldWrapPressed]}
			>
				<Ionicons name="time-outline" size={18} color={Colors.textMuted} />
				<Text style={[styles.pickerFieldText, !value && styles.pickerFieldPlaceholder]}>
					{value || placeholder}
				</Text>
				<Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
			</Pressable>

			<Modal
				visible={isOpen}
				transparent
				animationType="fade"
				onRequestClose={() => { }}
			>
				<View style={styles.pickerModalRoot}>
					<View style={styles.pickerModalBackdrop} />
					<View style={styles.pickerModalCard}>
						<View style={styles.pickerModalHeader}>
							<Text style={styles.pickerModalTitle}>{label}</Text>
							<TouchableOpacity onPress={() => setIsOpen(false)} activeOpacity={0.75}>
								<Text style={styles.pickerModalAction}>Close</Text>
							</TouchableOpacity>
						</View>
						<DateTimePicker
							key={`${label}-${isOpen ? 'open' : 'closed'}-${selectedTime.toISOString()}`}
							mode="single"
							date={selectedTime}
							timePicker
							use12Hours={false}
							initialView="time"
							hideHeader
							hideWeekdays
							onChange={({ date }) => {
								const next = toDateValue(date);
								if (!next) return;
								setSelectedTime(next);
								onChange(formatTimeForField(next));
								setIsOpen(false);
							}}
							styles={pickerStyles}
						/>
					</View>
				</View>
			</Modal>
		</View>
	);
}

export function AppTimeRow({
	startValue,
	endValue,
	onStartChange,
	onEndChange,
	startLabel = 'Start Time',
	endLabel = 'End Time',
	startPlaceholder = '09:00',
	endPlaceholder = '12:00',
	style,
}: {
	startValue: string;
	endValue: string;
	onStartChange: (value: string) => void;
	onEndChange: (value: string) => void;
	startLabel?: string;
	endLabel?: string;
	startPlaceholder?: string;
	endPlaceholder?: string;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.timeRow, style]}>
			<AppTimePickerField
				label={startLabel}
				value={startValue}
				onChange={onStartChange}
				placeholder={startPlaceholder}
				containerStyle={styles.timeField}
			/>
			<AppTimePickerField
				label={endLabel}
				value={endValue}
				onChange={onEndChange}
				placeholder={endPlaceholder}
				containerStyle={styles.timeField}
			/>
		</View>
	);
}

export function AppUploadArea({
	label,
	description,
	onPress,
	tone = 'primary',
	icon = 'cloud-upload-outline',
	iconSize = 26,
	disabled = false,
	style,
}: {
	label: string;
	description?: string;
	onPress: () => void;
	tone?: 'primary' | 'secondary';
	icon?: keyof typeof Ionicons.glyphMap;
	iconSize?: number;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}) {
	const tintVariant = tone === 'secondary' ? 'secondaryTint' : 'primaryTint';
	const accentColor = tone === 'secondary' ? Colors.secondary : Colors.primary;

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			style={({ pressed }) => [
				styles.uploadAreaPressable,
				(disabled || pressed) && { opacity: disabled ? 0.6 : 0.84 },
			]}
		>
			<AppCard
				variant={tintVariant}
				padding={24}
				style={[
					styles.uploadArea,
					{
						borderColor: accentColor,
					},
					style,
				]}
			>
				<Ionicons name={icon} size={iconSize} color={accentColor} />
				<Text style={[styles.uploadAreaLabel, { color: accentColor }]}>{label}</Text>
				{description ? <Text style={styles.uploadAreaDescription}>{description}</Text> : null}
			</AppCard>
		</Pressable>
	);
}

export function AppDocumentRow({
	name,
	onRemove,
	variant = 'surface',
	style,
}: {
	name: string;
	onRemove?: () => void;
	variant?: 'surface' | 'plain';
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.documentRow, variant === 'surface' && styles.documentRowSurface, style]}>
			<Ionicons name="document-outline" size={18} color={Colors.textSecondary} />
			<Text style={styles.documentRowText} numberOfLines={1}>{name}</Text>
			{onRemove ? (
				<TouchableOpacity onPress={onRemove} activeOpacity={0.7}>
					<Ionicons name="close-circle" size={20} color={Colors.error} />
				</TouchableOpacity>
			) : null}
		</View>
	);
}

export function AppSummaryRow({
	label,
	value,
	showBorder = true,
	style,
}: {
	label: string;
	value: string;
	showBorder?: boolean;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.summaryRow, showBorder && styles.summaryRowBorder, style]}>
			<Text style={styles.summaryRowLabel}>{label}</Text>
			<Text style={styles.summaryRowValue}>{value}</Text>
		</View>
	);
}

export function AppSummaryList({
	items,
	style,
}: {
	items: { label: string; value: string }[];
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[styles.summaryList, style]}>
			{items.map((item, index) => (
				<AppSummaryRow
					key={`${item.label}-${index}`}
					label={item.label}
					value={item.value}
					showBorder={index < items.length - 1}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	iconButton: {
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	topTitle: {
		fontSize: 18,
		fontWeight: '700' as const,
		color: Colors.text,
	},
	cardBase: {
		borderRadius: 14,
		borderWidth: 1,
	},
	buttonBase: {
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '700' as const,
	},
	pageHeader: {
		marginBottom: 24,
		gap: 6,
	},
	pageHeaderCentered: {
		alignItems: 'center',
	},
	pageTitle: {
		fontSize: 28,
		fontWeight: '800' as const,
		color: Colors.text,
	},
	pageTitleCentered: {
		textAlign: 'center',
	},
	pageSubtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionTitleBase: {
		fontWeight: '700' as const,
	},
	sectionAction: {
		fontSize: 14,
		fontWeight: '600' as const,
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: 999,
	},
	statusBadgeDot: {},
	statusBadgeText: {
		fontWeight: '700' as const,
	},
	chipPressable: {
		alignSelf: 'flex-start',
	},
	chipPressablePressed: {
		opacity: 0.8,
	},
	chipBase: {
		borderWidth: 1,
		alignSelf: 'flex-start',
	},
	chipBaseText: {
		fontWeight: '500' as const,
	},
	chipBaseTextSelected: {
		fontWeight: '600' as const,
	},
	chipGroupWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	chipGroupRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: 4,
	},
	emptyState: {
		alignItems: 'center',
	},
	emptyStateTitle: {
		fontSize: 16,
		fontWeight: '600' as const,
		color: Colors.text,
		marginTop: 12,
	},
	emptyStateSubtitle: {
		fontSize: 13,
		color: Colors.textSecondary,
		marginTop: 4,
		textAlign: 'center',
	},
	statCard: {
		alignItems: 'center',
		gap: 4,
	},
	statValue: {
		fontSize: 22,
		fontWeight: '800' as const,
		color: Colors.text,
	},
	statLabel: {
		fontSize: 11,
		fontWeight: '500' as const,
		color: Colors.textSecondary,
	},
	infoRowBase: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
	},
	infoRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: Colors.borderLight,
	},
	infoInlineLabel: {
		fontSize: 13,
		color: Colors.textMuted,
	},
	infoInlineValue: {
		flex: 1,
		fontSize: 14,
		fontWeight: '500' as const,
		color: Colors.text,
	},
	infoStackedContent: {
		flex: 1,
	},
	infoStackedLabel: {
		fontSize: 12,
		color: Colors.textMuted,
	},
	infoStackedValue: {
		fontSize: 14,
		fontWeight: '500' as const,
		color: Colors.text,
		marginTop: 1,
	},
	fieldGroup: {
		gap: 6,
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	fieldWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.border,
		paddingHorizontal: 14,
		gap: 10,
		height: 50,
	},
	fieldWrapMultiline: {
		height: 100,
		alignItems: 'flex-start',
		paddingTop: 12,
	},
	searchSelectTrigger: {
		height: 50,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.border,
		backgroundColor: Colors.surface,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	searchSelectTriggerPressed: {
		opacity: 0.82,
	},
	searchSelectText: {
		flex: 1,
		fontSize: 15,
		color: Colors.text,
	},
	searchSelectPlaceholder: {
		color: Colors.textMuted,
	},
	searchSelectAction: {
		fontSize: 13,
		fontWeight: '700' as const,
		color: Colors.primary,
	},
	searchSelectModalRoot: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	searchSelectModalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(15, 23, 42, 0.45)',
	},
	searchSelectModalCard: {
		backgroundColor: Colors.surface,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: Colors.border,
		padding: 14,
		gap: 10,
		maxHeight: '74%',
	},
	searchSelectModalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	searchSelectModalTitle: {
		fontSize: 16,
		fontWeight: '700' as const,
		color: Colors.text,
	},
	searchSelectModalClose: {
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.primary,
	},
	searchSelectInput: {
		height: 46,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: Colors.border,
		paddingHorizontal: 12,
		fontSize: 15,
		color: Colors.text,
		backgroundColor: Colors.background,
	},
	searchSelectResults: {
		maxHeight: 320,
	},
	searchSelectResultsContent: {
		gap: 8,
		paddingBottom: 4,
	},
	searchSelectOption: {
		borderRadius: 10,
		borderWidth: 1,
		borderColor: Colors.border,
		backgroundColor: Colors.background,
		paddingHorizontal: 12,
		paddingVertical: 11,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	searchSelectOptionSelected: {
		borderColor: Colors.primary,
		backgroundColor: Colors.primaryBg,
	},
	searchSelectOptionPressed: {
		opacity: 0.84,
	},
	searchSelectOptionText: {
		fontSize: 14,
		color: Colors.text,
		flex: 1,
	},
	searchSelectOptionTextSelected: {
		fontWeight: '700' as const,
		color: Colors.primary,
	},
	searchSelectOptionBadge: {
		fontSize: 12,
		fontWeight: '700' as const,
		color: Colors.primary,
	},
	searchSelectEmptyText: {
		fontSize: 13,
		color: Colors.textSecondary,
		paddingHorizontal: 2,
		paddingVertical: 8,
	},
	pickerFieldWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.border,
		paddingHorizontal: 14,
		gap: 10,
		height: 50,
	},
	pickerFieldWrapPressed: {
		opacity: 0.8,
	},
	pickerFieldText: {
		flex: 1,
		fontSize: 15,
		color: Colors.text,
	},
	pickerFieldPlaceholder: {
		color: Colors.textMuted,
	},
	pickerModalRoot: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	pickerModalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(15, 23, 42, 0.45)',
	},
	pickerModalCard: {
		backgroundColor: Colors.surface,
		borderRadius: 16,
		padding: 14,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	pickerModalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	pickerModalTitle: {
		fontSize: 16,
		fontWeight: '700' as const,
		color: Colors.text,
	},
	pickerModalAction: {
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.primary,
	},
	fieldInput: {
		flex: 1,
		fontSize: 15,
		color: Colors.text,
	},
	fieldInputMultiline: {
		textAlignVertical: 'top',
	},
	fieldHelper: {
		fontSize: 12,
		color: Colors.textMuted,
	},
	timeRow: {
		flexDirection: 'row',
		gap: 12,
	},
	timeField: {
		flex: 1,
		color: Colors.text,
	},
	uploadAreaPressable: {
		width: '100%',
	},
	uploadArea: {
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: 2,
		borderStyle: 'dashed',
		gap: 8,
	},
	uploadAreaLabel: {
		fontSize: 15,
		fontWeight: '600' as const,
	},
	uploadAreaDescription: {
		fontSize: 13,
		color: Colors.textSecondary,
		textAlign: 'center',
		lineHeight: 18,
	},
	documentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		padding: 12,
	},
	documentRowSurface: {
		backgroundColor: Colors.surface,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	documentRowText: {
		flex: 1,
		fontSize: 14,
		color: Colors.text,
	},
	summaryList: {
		backgroundColor: Colors.background,
		borderRadius: 12,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 10,
		gap: 12,
	},
	summaryRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: Colors.borderLight,
	},
	summaryRowLabel: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	summaryRowValue: {
		flex: 1,
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.text,
		textAlign: 'right',
	},
});
