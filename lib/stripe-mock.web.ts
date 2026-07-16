// Mock untuk platform web — Stripe React Native tidak support web
export const useStripe = () => ({
    createPaymentMethod: async () => ({
        paymentMethod: null,
        error: { message: 'Stripe is not supported on web.' },
    }),
});

export const CardField = () => null;
export const StripeProvider = ({ children }: { children: React.ReactNode }) => children;