import React, { useMemo, useState } from 'react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    Clipboard,
    Copy,
    ExternalLink,
    Landmark,
    LoaderCircle,
    ArrowDownToLine,
    Send,
    ShieldCheck,
    X,
} from 'lucide-react';

const shortAddress = (address) => (
    address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not connected'
);

const PaymentCard = ({
    address,
    isConnected,
    paymentBalance,
    estimate,
    error,
    isPreparing,
    isSending,
    onPrepare,
    onConfirm,
    onReset,
}) => {
    const requestedRecipient = useMemo(() => (
        new URLSearchParams(window.location.search).get('recipient') || ''
    ), []);
    const [mode, setMode] = useState('send');
    const [recipient, setRecipient] = useState(requestedRecipient);
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [review, setReview] = useState(null);
    const [receipt, setReceipt] = useState(null);
    const [copied, setCopied] = useState(false);

    const paymentRequest = useMemo(() => {
        if (!address) return '';
        const params = new URLSearchParams({ recipient: address, chain: 'Arc_Testnet', token: 'USDC' });
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }, [address]);

    const copyText = async (value) => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    const handlePrepare = async () => {
        try {
            const prepared = await onPrepare({ recipient, amount, reference });
            setReview(prepared);
        } catch {
            setReview(null);
        }
    };

    const handleConfirm = async () => {
        try {
            const result = await onConfirm();
            setReview(null);
            setReceipt(result);
            setRecipient('');
            setAmount('');
            setReference('');
        } catch {
            // The hook exposes the user-safe error in the card.
        }
    };

    const closeReview = () => {
        setReview(null);
        onReset();
    };

    return (
        <section className="w-full max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        <Building2 size={15} />
                        Arc Payments
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1">Send and receive USDC</h2>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-virex-text-secondary">
                    <ShieldCheck size={14} className="text-virex-success" />
                    App Kit verified flow
                </div>
            </div>

            <div className="virex-card overflow-hidden">
                <div className="grid grid-cols-2 p-1.5 bg-black/30 border-b border-white/[0.06]">
                    {[
                        { id: 'send', label: 'Send payment', icon: Send },
                        { id: 'receive', label: 'Receive payment', icon: ArrowDownToLine },
                    ].map(({ id, label, icon }) => {
                        const TabIcon = icon;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    setMode(id);
                                    setReceipt(null);
                                    onReset();
                                }}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                                    mode === id
                                        ? 'bg-white/10 text-white shadow-inner'
                                        : 'text-virex-text-secondary hover:text-white'
                                }`}
                            >
                                <TabIcon size={16} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {mode === 'send' ? (
                    <div className="p-5 md:p-7 space-y-5">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-400/[0.05] border border-cyan-300/10">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-virex-text-secondary">Available</span>
                                <span className="text-xl font-black text-white">{Number(paymentBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-virex-text-secondary">Network</span>
                                <span className="text-sm font-bold text-cyan-300">Arc Testnet</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-virex-text-secondary px-1">Recipient</label>
                            <div className="relative">
                                <input
                                    value={recipient}
                                    onChange={(event) => setRecipient(event.target.value.trim())}
                                    placeholder="0x..."
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="virex-input pr-12 font-mono text-sm"
                                />
                                <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 text-virex-text-secondary" size={18} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-[1fr_0.9fr] gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-virex-text-secondary px-1">Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.000001"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                        placeholder="0.00"
                                        className="virex-input pr-20 text-lg font-black"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-cyan-300">USDC</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-virex-text-secondary px-1">Payment reference</label>
                                <div className="relative">
                                    <input
                                        value={reference}
                                        onChange={(event) => setReference(event.target.value.slice(0, 80))}
                                        placeholder="Invoice 1042"
                                        className="virex-input pr-12"
                                    />
                                    <Clipboard className="absolute right-4 top-1/2 -translate-y-1/2 text-virex-text-secondary" size={17} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {receipt && (
                            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col sm:flex-row sm:items-center gap-3">
                                <CheckCircle2 className="text-green-400 shrink-0" size={22} />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-black text-white">Payment settled</div>
                                    <div className="text-xs text-green-300/80 truncate">{receipt.txHash}</div>
                                </div>
                                <a
                                    href={receipt.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
                                >
                                    Arcscan <ExternalLink size={13} />
                                </a>
                            </div>
                        )}

                        <button
                            type="button"
                            disabled={!isConnected || isPreparing || !recipient || !amount}
                            onClick={handlePrepare}
                            className="virex-button disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isPreparing ? (
                                <span className="flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" /> Estimating payment</span>
                            ) : (
                                <span className="flex items-center gap-2">Review payment <ArrowRight size={18} /></span>
                            )}
                        </button>

                        <p className="text-center text-[10px] font-semibold text-virex-text-secondary">
                            Wallet authorization is always required. Payment references are stored locally and are not written onchain.
                        </p>
                    </div>
                ) : (
                    <div className="p-5 md:p-8">
                        <div className="max-w-lg mx-auto text-center space-y-5">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-virex-primary/20 border border-cyan-300/20 flex items-center justify-center">
                                <ArrowDownToLine size={28} className="text-cyan-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Receive USDC on Arc</h3>
                                <p className="text-sm text-virex-text-secondary mt-1">Share your verified wallet address or payment link with a customer.</p>
                            </div>

                            <div className="p-4 bg-black/30 border border-white/10 rounded-2xl text-left">
                                <span className="block text-[10px] uppercase tracking-widest font-black text-virex-text-secondary mb-2">Receiving wallet</span>
                                <div className="flex items-center gap-3">
                                    <code className="text-sm text-white break-all flex-1">{address || 'Connect a wallet to receive payments'}</code>
                                    <button
                                        type="button"
                                        disabled={!address}
                                        onClick={() => copyText(address)}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30"
                                        aria-label="Copy receiving address"
                                    >
                                        {copied ? <CheckCircle2 size={17} className="text-green-400" /> : <Copy size={17} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={!paymentRequest}
                                onClick={() => copyText(paymentRequest)}
                                className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] font-bold text-sm disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                <Copy size={16} />
                                Copy payment link
                            </button>

                            <div className="grid grid-cols-3 gap-2 text-left">
                                {[
                                    ['Asset', 'USDC'],
                                    ['Network', 'Arc Testnet'],
                                    ['Wallet', shortAddress(address)],
                                ].map(([label, value]) => (
                                    <div key={label} className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                                        <span className="block text-[9px] uppercase font-black tracking-wider text-virex-text-secondary">{label}</span>
                                        <span className="block mt-1 text-xs font-bold truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {review && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button type="button" aria-label="Close payment review" onClick={closeReview} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md virex-card p-6 shadow-2xl">
                        <button type="button" onClick={closeReview} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                        <div className="mb-6">
                            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-300">Final authorization</div>
                            <h3 className="text-2xl font-black mt-1">Review payment</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-virex-primary/10 border border-cyan-300/10 text-center">
                                <span className="text-4xl font-black">{review.amount}</span>
                                <span className="ml-2 text-sm font-black text-cyan-300">USDC</span>
                            </div>
                            {[
                                ['To', review.recipient],
                                ['Reference', review.reference || 'None'],
                                ['Network fee', `~${Number(estimate?.feeFormatted || 0).toFixed(6)} USDC`],
                                ['Settlement', 'Arc deterministic finality'],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.06]">
                                    <span className="text-xs font-bold text-virex-text-secondary">{label}</span>
                                    <span className={`text-xs font-bold text-right break-all ${label === 'To' ? 'font-mono' : ''}`}>{value}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={isSending}
                            onClick={handleConfirm}
                            className="virex-button mt-6 disabled:opacity-50"
                        >
                            {isSending ? (
                                <span className="flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" /> Confirm in wallet</span>
                            ) : (
                                `Authorize ${review.amount} USDC`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default PaymentCard;
