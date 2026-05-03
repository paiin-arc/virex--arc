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
    <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 glass-effect rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
    <div className="w-full max-w-[500px] mx-auto virex-card p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Chain Selector */}
      <div className="flex items-center justify-between gap-4 p-2 bg-black/20 rounded-[22px] border border-white/5 relative">
        <div 
          onClick={() => setSelOpen(selOpen === 'source' ? null : 'source')}
          className="flex-1 p-3 bg-virex-card border border-white/10 rounded-xl flex items-center gap-3 cursor-pointer hover:border-virex-primary transition-all group"
        >
          <div className={`w-8 h-8 rounded-lg ${sourceChain.bg} flex items-center justify-center ${sourceChain.color} overflow-hidden p-1.5`}>
            <SafeIcon src={chainIcons[sourceChain.id]} alt={sourceChain.name} className="w-full h-full object-contain drop-shadow-md" fallbackIcon={HelpCircle} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-virex-text-secondary tracking-tighter">Source</span>
            <span className="text-sm font-bold flex items-center gap-1">
                {sourceChain.name}
                <ChevronDown size={12} className="text-virex-text-secondary group-hover:text-virex-primary" />
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
            className="w-10 h-10 rounded-full bg-virex-primary flex items-center justify-center shadow-lg shadow-virex-primary/40 hover:scale-110 active:rotate-180 transition-all z-10"
        >
          <ArrowLeftRight size={18} className="text-white" />
        </button>

        <div 
          onClick={() => setSelOpen(selOpen === 'dest' ? null : 'dest')}
          className="flex-1 p-3 bg-virex-card border border-white/10 rounded-xl flex items-center gap-3 cursor-pointer hover:border-virex-primary transition-all group"
        >
          <div className={`w-8 h-8 rounded-lg ${destChain.bg} flex items-center justify-center ${destChain.color} overflow-hidden p-1.5`}>
            <SafeIcon src={chainIcons[destChain.id]} alt={destChain.name} className="w-full h-full object-contain drop-shadow-md" fallbackIcon={HelpCircle} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-virex-text-secondary tracking-tighter">Destination</span>
            <span className="text-sm font-bold flex items-center gap-1">
                {destChain.name}
                <ChevronDown size={12} className="text-virex-text-secondary group-hover:text-virex-primary" />
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
      <div className="space-y-4">
        <div className="relative group">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-6xl md:text-7xl font-black text-center text-white outline-none placeholder:text-white/5"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 cursor-pointer transition-colors">
            <SafeIcon src={tokenIcons.usdc} alt="USDC" className="w-5 h-5 object-contain rounded-full" fallbackIcon={HelpCircle} />
            <span className="text-sm font-bold">USDC</span>
            <ChevronDown size={14} className="text-virex-text-secondary" />
          </div>
        </div>
        <div className="flex justify-center">
            <span className="text-xs text-virex-text-secondary font-medium">Available: <b className="text-virex-text-primary">{currentBalance} USDC</b></span>
        </div>
      </div>

      {/* Destination Address */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-virex-text-secondary px-1">Destination Address</label>
        <div className="relative">
          <input 
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-medium focus:border-virex-primary transition-all pr-12"
          />
          <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 text-virex-text-secondary" size={18} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-virex-text-secondary uppercase">Fee</span>
          <span className="text-sm font-bold">{FEE_AMOUNT} USDC</span>
        </div>
        <div className="flex flex-col gap-1 border-x border-white/5 px-3">
          <span className="text-[9px] font-bold text-virex-text-secondary uppercase">Receive</span>
          <span className="text-sm font-bold text-virex-success">{RECEIVE_AMOUNT} USDC</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[9px] font-bold text-virex-text-secondary uppercase">Time</span>
          <span className="text-sm font-bold">~45s</span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        disabled={!isConnected || loading || !amount || parseFloat(amount) <= 0 || !address}
        onClick={() => onTransfer(amount, sourceChainId, destChainId, address)}
        className="virex-button group relative overflow-hidden disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? "Processing..." : `Send ${RECEIVE_AMOUNT} USDC to ${destChain.name.split(' ')[0]}`}
          {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>

      <div className="flex items-center justify-center gap-2 text-virex-text-secondary opacity-50">
        <ShieldCheck size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Secured by Circle CCTP</span>
      </div>
    </div>
  );
};

export default TransferCard;
