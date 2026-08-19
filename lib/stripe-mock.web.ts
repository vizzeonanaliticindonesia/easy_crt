// Mock untuk platform web — Stripe React Native tidak support web
import React from 'react';

type CreatePaymentMethodParams = {
    paymentMethodType: 'Card';
    paymentMethodData?: { billingDetails?: Record<string, unknown> };
};

type CreatePaymentMethodResult = {
    paymentMethod: { id: string } | null;
    error: { message: string } | null;
};

export const useStripe = () => ({
    createPaymentMethod: async (_params: CreatePaymentMethodParams): Promise<CreatePaymentMethodResult> => ({
        paymentMethod: null,
        error: { message: 'Stripe is not supported on web.' },
    }),
});

export type CardFieldDetails = { complete: boolean };

type CardFieldProps = {
    postalCodeEnabled?: boolean;
    placeholders?: { number?: string };
    cardStyle?: Record<string, unknown>;
    style?: Record<string, unknown>;
    onCardChange?: (details: CardFieldDetails) => void;
};

export const CardField = (_props: CardFieldProps) => null;

export const StripeProvider = ({
    children,
}: {
    children: React.ReactNode;
    publishableKey?: string;
}) => children;
