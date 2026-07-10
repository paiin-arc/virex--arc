import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Landmark, ShieldCheck, ArrowLeftRight, HelpCircle } from 'lucide-react';

const chainIcons = {
  arc: "/icons/arc.svg",
  arbitrum: "/icons/arb.png",
  avalanche: "/icons/avax.png",
  ethereum: "/icons/eth.png"
};

const tokenIcons = {
  usdc: "/icons/usdc.png"
};

const SafeIcon = ({ src, alt, className, fallbackIcon: FallbackIcon }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return <FallbackIcon className={className} />;
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
            onError={() => setHasError(true)}
        />
    );
};

const SUPPORTED_CHAINS = [
    { id: 'arc', name: 'Arc Testnet', color: 'text-virex-primary', bg: 'bg-virex-primary/20' },
    { id: 'arbitrum', name: 'Arbitrum Sepolia', color: 'text-blue-400', bg: 'bg-blue-400/20' },
    { id: 'avalanche', name: 'Avalanche Fuji', color: 'text-red-400', bg: 'bg-red-400/20' },
    { id: 'ethereum', name: 'Ethereum Sepolia', color: 'text-indigo-400', bg: 'bg-indigo-400/20' }
];

const ChainSelectorMenu = ({ onSelect, currentId, onClose }) => (
    <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 bg-virex-card border border-virex-border rounded-virex-inner shadow-2xl shadow-black/50">
        <div className="grid grid-cols-1 gap-1">
            {SUPPORTED_CHAINS.map(chain => (
                <button
                    key={chain.id}
                    onClick={() => { onSelect(chain.id); onClose(); }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                        currentId === chain.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-lg ${chain.bg} flex items-center justify-center ${chain.color} overflow-hidden p-1.5`}>
                        <SafeIcon src={chainIcons[chain.id]} alt={chain.name} className="w-full h-full object-contain drop-shadow-md" fallbackIcon={HelpCircle} />
                    </div>
                    <span className="text-sm font-bold">{chain.name}</span>
                </button>
            ))}
        </div>
    </div>
);

const TransferCard = ({ 
  onTransfer, 
  onQuoteFetch, 
  quote, 
  isConnected, 
  loading,
  currentBalance 
}) => {
  const [amount, setAmount] = useState("");
  const [sourceChainId, setSourceChainId] = useState("arc");
  const [destChainId, setDestChainId] = useState("arbitrum");
  const [address, setAddress] = useState("");
  const [selOpen, setSelOpen] = useState(null); // 'source' or 'dest'

  const sourceChain = SUPPORTED_CHAINS.find(c => c.id === sourceChainId);
  const destChain = SUPPORTED_CHAINS.find(c => c.id === destChainId);

  const RECEIVE_AMOUNT = quote ? parseFloat(quote.receive_amount).toFixed(2) : "--";
  const FEE_AMOUNT = quote ? parseFloat(quote.network_fee).toFixed(2) : "--";

  const handleSwap = () => {
    setSourceChainId(destChainId);
    setDestChainId(sourceChainId);
  };

  useEffect(() => {
    const amt = parseFloat(amount);
    if (amt > 0) {
      const timer = setTimeout(() => onQuoteFetch(amt, sourceChainId, destChainId), 500);
      return () => clearTimeout(timer);
    }
  }, [amount, sourceChainId, destChainId]);

  return (
    <div className="w-full max-w-[520px] mx-auto virex-card overflow-hidden">
      {/* Card Header */}
      <div className="px-6 pt-6 pb-4 border-b border-virex-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="virex-label">Cross-Chain Transfer</span>
            <h3 className="text-lg font-black text-white mt-0.5">Bridge USDC</h3>
          </div>
          <div className="flex items-center gap-1.5 text-virex-text-secondary">
            <ShieldCheck size={14} className="text-virex-success" />
            <span className="text-[10px] font-bold uppercase tracking-wider">CCTP Secured</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Chain Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative">
          <div 
            onClick={() => setSelOpen(selOpen === 'source' ? null : 'source')}
            className="w-full md:flex-1 p-3.5 virex-card-inner flex items-center gap-3 cursor-pointer hover:border-virex-border-hover transition-all group relative"
          >
            <div className={`w-9 h-9 rounded-xl ${sourceChain.bg} flex items-center justify-center ${sourceChain.color} overflow-hidden p-1.5`}>
              <SafeIcon src={chainIcons[sourceChain.id]} alt={sourceChain.name} className="w-full h-full object-contain drop-shadow-md" fallbackIcon={HelpCircle} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold text-virex-text-secondary tracking-wider">Source</span>
              <span className="text-sm font-bold flex items-center gap-1">
                  {sourceChain.name}
                  <ChevronDown size={12} className="text-virex-text-secondary group-hover:text-virex-primary transition-colors" />
              </span>
            </div>
            {selOpen === 'source' && (
                <ChainSelectorMenu 
                  onSelect={(id) => {
                      if (id === destChainId) handleSwap();
                      else setSourceChainId(id);
                  }} 
                  currentId={sourceChainId} 
                  onClose={() => setSelOpen(null)}
                />
            )}
          </div>

          <button 
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-virex-card border-2 border-virex-border flex items-center justify-center hover:border-virex-primary hover:bg-virex-primary/10 active:rotate-180 transition-all z-10 rotate-90 md:rotate-0 -my-2 md:my-0 shrink-0"
          >
            <ArrowLeftRight size={16} className="text-virex-text-secondary" />
          </button>

          <div 
            onClick={() => setSelOpen(selOpen === 'dest' ? null : 'dest')}
            className="w-full md:flex-1 p-3.5 virex-card-inner flex items-center gap-3 cursor-pointer hover:border-virex-border-hover transition-all group relative"
          >
            <div className={`w-9 h-9 rounded-xl ${destChain.bg} flex items-center justify-center ${destChain.color} overflow-hidden p-1.5`}>
              <SafeIcon src={chainIcons[destChain.id]} alt={destChain.name} className="w-full h-full object-contain drop-shadow-md" fallbackIcon={HelpCircle} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold text-virex-text-secondary tracking-wider">Destination</span>
              <span className="text-sm font-bold flex items-center gap-1">
                  {destChain.name}
                  <ChevronDown size={12} className="text-virex-text-secondary group-hover:text-virex-primary transition-colors" />
              </span>
            </div>
            {selOpen === 'dest' && (
                <ChainSelectorMenu 
                  onSelect={(id) => {
                      if (id === sourceChainId) handleSwap();
                      else setDestChainId(id);
                  }} 
                  currentId={destChainId} 
                  onClose={() => setSelOpen(null)}
                />
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="virex-card-inner p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="virex-label">Amount</span>
            <span className="text-xs text-virex-text-secondary font-medium">
              Available: <b className="text-white">{currentBalance} USDC</b>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl md:text-4xl font-black text-white outline-none placeholder:text-white/10 min-w-0"
            />
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.06] border border-virex-border rounded-virex-pill shrink-0">
              <SafeIcon src={tokenIcons.usdc} alt="USDC" className="w-5 h-5 object-contain rounded-full" fallbackIcon={HelpCircle} />
              <span className="text-sm font-bold">USDC</span>
            </div>
          </div>
        </div>

        {/* Destination Address */}
        <div className="space-y-2">
          <label className="virex-label">Destination Address</label>
          <div className="relative">
            <input 
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="virex-input pr-12 font-mono text-sm"
            />
            <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 text-virex-text-secondary" size={18} />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="virex-stat-cell">
            <span className="text-[9px] font-bold text-virex-text-secondary uppercase tracking-wider">Fee</span>
            <span className="text-sm font-black">{FEE_AMOUNT} USDC</span>
          </div>
          <div className="virex-stat-cell">
            <span className="text-[9px] font-bold text-virex-text-secondary uppercase tracking-wider">Receive</span>
            <span className="text-sm font-black text-virex-success">{RECEIVE_AMOUNT} USDC</span>
          </div>
          <div className="virex-stat-cell items-end">
            <span className="text-[9px] font-bold text-virex-text-secondary uppercase tracking-wider">Time</span>
            <span className="text-sm font-black">~45s</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          disabled={!isConnected || loading || !amount || parseFloat(amount) <= 0 || !address}
          onClick={() => onTransfer(amount, sourceChainId, destChainId, address)}
          className="virex-button group relative overflow-hidden disabled:opacity-30 disabled:hover:brightness-100 disabled:shadow-none"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? "Processing..." : `Send ${RECEIVE_AMOUNT} USDC to ${destChain.name.split(' ')[0]}`}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
      </div>
    </div>
  );
};

export default TransferCard;
