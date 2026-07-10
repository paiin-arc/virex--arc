import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ALIAS = 'Arc_Testnet';
const ARC_EXPLORER = 'https://testnet.arcscan.app';
const ARC_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const USDC_DECIMALS = 6;

let appKitPromise;

const loadPaymentSdk = async () => {
    if (!appKitPromise) {
        appKitPromise = Promise.all([
            import('@circle-fin/app-kit'),
            import('@circle-fin/adapter-viem-v2'),
        ]).then(([{ AppKit }, { createViemAdapterFromProvider }]) => ({
            appKit: new AppKit(),
            createViemAdapterFromProvider,
        }));
    }

    return appKitPromise;
};

const usdcAbi = [
    'function balanceOf(address owner) view returns (uint256)',
];

const getErrorMessage = (error) => {
    if (error?.code === 4001 || error?.message?.toLowerCase().includes('rejected')) {
        return 'Payment was rejected in the wallet.';
    }

    return error?.shortMessage || error?.reason || error?.message || 'Payment failed.';
};

const validateAmount = (amount) => {
    const normalized = String(amount || '').trim();
    if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
        throw new Error('Enter a valid USDC amount with no more than 6 decimal places.');
    }

    if (ethers.utils.parseUnits(normalized, USDC_DECIMALS).lte(0)) {
        throw new Error('Payment amount must be greater than zero.');
    }

    return normalized;
};

export const useSend = ({ address, provider, ensureNetwork, addActivity, refreshBalance }) => {
    const [estimate, setEstimate] = useState(null);
    const [paymentBalance, setPaymentBalance] = useState('0.00');
    const [isPreparing, setIsPreparing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const preparedPayment = useRef(null);

    const loadBalances = useCallback(async (provider, owner) => {
        const usdc = new ethers.Contract(ARC_USDC_ADDRESS, usdcAbi, provider);
        const [tokenBalance, gasBalance] = await Promise.all([
            usdc.balanceOf(owner),
            provider.getBalance(owner),
        ]);

        const formattedTokenBalance = ethers.utils.formatUnits(tokenBalance, USDC_DECIMALS);
        setPaymentBalance(formattedTokenBalance);

        return { tokenBalance, gasBalance, formattedTokenBalance };
    }, []);

    useEffect(() => {
        if (!provider || !address) {
            setPaymentBalance('0.00');
            return;
        }

        let active = true;
        const refreshIfOnArc = async () => {
            try {
                const network = await provider.getNetwork();
                if (network.chainId !== ARC_CHAIN_ID) return;
                const balances = await loadBalances(provider, address);
                if (active) setPaymentBalance(balances.formattedTokenBalance);
            } catch (err) {
                console.warn('Arc payment balance refresh failed', err);
            }
        };

        refreshIfOnArc();
        return () => {
            active = false;
        };
    }, [address, loadBalances, provider]);

    const preparePayment = useCallback(async ({ recipient, amount, reference }) => {
        setIsPreparing(true);
        setError('');
        setEstimate(null);
        preparedPayment.current = null;

        try {
            if (!address) {
                throw new Error('Connect your wallet before creating a payment.');
            }

            if (!ensureNetwork) {
                throw new Error('Wallet network management is unavailable.');
            }

            if (!ethers.utils.isAddress(recipient)) {
                throw new Error('Enter a valid EVM recipient address.');
            }

            const normalizedRecipient = ethers.utils.getAddress(recipient);
            const normalizedSender = ethers.utils.getAddress(address);
            if (normalizedRecipient === normalizedSender) {
                throw new Error('Recipient must be different from the connected wallet.');
            }

            const normalizedAmount = validateAmount(amount);
            const { provider } = await ensureNetwork('arc');
            if (!provider) {
                throw new Error('Could not connect to Arc Testnet.');
            }

            const network = await provider.getNetwork();
            if (network.chainId !== ARC_CHAIN_ID) {
                throw new Error('Switch your wallet to Arc Testnet to continue.');
            }

            const injectedProvider = provider.provider;
            if (!injectedProvider?.request) {
                throw new Error('The selected wallet does not expose an EIP-1193 provider.');
            }

            const { appKit, createViemAdapterFromProvider } = await loadPaymentSdk();
            const adapter = await createViemAdapterFromProvider({
                provider: injectedProvider,
                capabilities: { addressContext: 'user-controlled' },
            });

            const params = {
                from: { adapter, chain: ARC_CHAIN_ALIAS },
                to: normalizedRecipient,
                amount: normalizedAmount,
                token: 'USDC',
            };

            const [gasEstimate, balances] = await Promise.all([
                appKit.estimateSend(params),
                loadBalances(provider, normalizedSender),
            ]);

            const amountBaseUnits = ethers.utils.parseUnits(normalizedAmount, USDC_DECIMALS);
            if (balances.tokenBalance.lt(amountBaseUnits)) {
                throw new Error(`Insufficient USDC balance. Available: ${balances.formattedTokenBalance} USDC.`);
            }

            const feeBaseUnits = ethers.BigNumber.from(gasEstimate.fee);
            if (balances.gasBalance.lt(feeBaseUnits)) {
                throw new Error('Insufficient native USDC to pay the Arc network fee.');
            }

            const prepared = {
                params,
                provider,
                recipient: normalizedRecipient,
                amount: normalizedAmount,
                reference: String(reference || '').trim().slice(0, 80),
                estimate: {
                    ...gasEstimate,
                    feeFormatted: ethers.utils.formatUnits(feeBaseUnits, 18),
                },
                appKit,
            };

            preparedPayment.current = prepared;
            setEstimate(prepared.estimate);
            return prepared;
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            throw new Error(message);
        } finally {
            setIsPreparing(false);
        }
    }, [address, ensureNetwork, loadBalances]);

    const confirmPayment = useCallback(async () => {
        const prepared = preparedPayment.current;
        if (!prepared) {
            throw new Error('Review the payment before sending it.');
        }

        setIsSending(true);
        setError('');

        try {
            const result = await prepared.appKit.send(prepared.params);
            if (result.state !== 'success' || !result.txHash) {
                throw new Error(result.errorMessage || 'Arc did not confirm the payment.');
            }

            const explorerUrl = result.explorerUrl || `${ARC_EXPLORER}/tx/${result.txHash}`;
            const activity = {
                type: 'send',
                status: 'completed',
                amount: prepared.amount,
                recipient: prepared.recipient,
                reference: prepared.reference,
                txHash: result.txHash,
                explorerUrls: { destination: explorerUrl },
            };

            addActivity?.(activity);
            await Promise.all([
                loadBalances(prepared.provider, address),
                refreshBalance?.(prepared.provider, address),
            ]);

            preparedPayment.current = null;
            setEstimate(null);
            return { ...activity, explorerUrl };
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            addActivity?.({
                type: 'send',
                status: 'failed',
                amount: prepared.amount,
                recipient: prepared.recipient,
                reference: prepared.reference,
                error: message,
            });
            throw new Error(message);
        } finally {
            setIsSending(false);
        }
    }, [addActivity, address, loadBalances, refreshBalance]);

    const resetPayment = useCallback(() => {
        preparedPayment.current = null;
        setEstimate(null);
        setError('');
    }, []);

    return {
        estimate,
        paymentBalance,
        isPreparing,
        isSending,
        error,
        preparePayment,
        confirmPayment,
        resetPayment,
    };
};
