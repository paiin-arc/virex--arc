import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, ChevronDown, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WALLETS = [
    { id: 'metamask', name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Awareness_Icons_RGB_orange.svg' },
    { id: 'okx', name: 'OKX Wallet', icon: 'https://static.okx.com/cdn/assets/imgs/221/9E9A9C9B4B8B4B8B.png' },
    { id: 'rabby', name: 'Rabby Wallet', icon: 'https://rabby.io/assets/images/logo.png' },
    { id: 'coinbase', name: 'Coinbase', icon: 'https://images.ctfassets.net/q5ulk4bp65r7/3rFFRi1Hoo7CjJ9S7S8S8O/427848c0846067ae96773531b262a4d0/coinbase-white.png' }
];

const WalletModal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const isInstalled = (id) => {
        if (id === 'metamask') return window.ethereum?.isMetaMask;
        if (id === 'okx') return !!window.okxwallet;
        if (id === 'rabby') return !!window.rabby;
        return false;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#111827] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white">Connect Wallet</h2>
                            <p className="text-virex-text-secondary text-sm">Choose your preferred Web3 wallet</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} className="text-virex-text-secondary" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {WALLETS.map(wallet => (
                            <button
                                key={wallet.id}
                                onClick={() => { onSelect(wallet.id); onClose(); }}
                                className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-virex-primary/40 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 p-2 flex items-center justify-center group-hover:bg-virex-primary/10 transition-colors">
                                        <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <span className="block text-white font-bold">{wallet.name}</span>
                                        {isInstalled(wallet.id) && (
                                            <span className="text-[10px] text-virex-success font-black uppercase tracking-wider">Installed</span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-virex-primary group-hover:bg-virex-primary/10 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-virex-text-secondary group-hover:bg-virex-primary" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-virex-primary/5 border border-virex-primary/10 rounded-2xl flex items-start gap-3">
                        <ShieldCheck className="text-virex-primary shrink-0" size={18} />
                        <p className="text-[11px] text-virex-text-secondary leading-relaxed">
                            Connecting your wallet is secure and does not give us access to your private keys or funds. 
                            You will always be asked to sign each transaction personally.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Header = ({ provider, address, balance, isConnected, onConnect, onDisconnect, isBridging }) => {
  const [showModal, setShowModal] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    if (!provider) return;

    let isSubscribed = true;

    const fetchBlock = async () => {
      try {
        const block = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        
        if (isSubscribed) {
          setBlockNumber(block);
          
          let name = network.name;
          // Chain IDs match standard routing profiles
          if (network.chainId === 5042002) name = 'Arc'; 
          else if (network.chainId === 421614) name = 'Arbitrum';
          else if (network.chainId === 43113) name = 'Avalanche';
          else if (network.chainId === 11155111) name = 'Ethereum';
          else name = name.charAt(0).toUpperCase() + name.slice(1);
          
          setNetworkName(name);
        }
      } catch (err) {
        console.error("Failed to fetch header block state", err);
      }
    };

    fetchBlock();

    // Dynamically query blocks: 4s if bridging active, 8s casual idle
    const interval = setInterval(fetchBlock, isBridging ? 4000 : 8000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [provider, isBridging]);

  return (
    <header className="py-6 mb-12">
      <style>
        {`
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        `}
      </style>
      <div className="flex items-center justify-between glass-effect rounded-[22px] px-6 py-3 border border-white/[0.08] shadow-xl">
        
        {/* Animated Line & Live Block Info */}
        <div className="flex items-center gap-4">
            <div className="w-16 md:w-24 flex items-center">
                <div 
                    className={`h-[3px] w-full rounded-full bg-gradient-to-r from-[#00c6ff] via-[#7f00ff] to-[#00c6ff] bg-[length:200%_auto] transition-all duration-700 ease-in-out ${
                        isBridging 
                          ? 'opacity-100 shadow-[0_0_12px_rgba(127,0,255,0.5)] scale-100' 
                          : 'opacity-30 scale-95'
                    }`}
                    style={{
                        animation: `gradient-flow ${isBridging ? '1.5s' : '4s'} linear infinite`
                    }}
                />
            </div>
            
            {blockNumber && (
                <div className={`text-[12px] font-medium tracking-wide transition-opacity duration-500 ${isBridging ? 'text-[#a1b4d6] opacity-100' : 'text-[#8a9bbd] opacity-70'}`}>
                    {networkName} &bull; #{blockNumber}
                </div>
            )}
        </div>

        <div className="flex items-center gap-6">
          {isConnected && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-virex-text-secondary uppercase tracking-widest font-semibold">Balance</span>
                <span className="text-xs font-black text-white">{balance} USDC</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] text-virex-text-secondary uppercase tracking-widest font-semibold text-right">Arc Testnet</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-1.5 h-1.5 rounded-full bg-virex-success animate-pulse" />
                  <span className="text-xs font-black text-white">Verified</span>
                </div>
              </div>
            </div>
          )}

          {!isConnected ? (
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-accent-gradient rounded-full font-bold text-sm text-white shadow-lg shadow-virex-primary/20 hover:shadow-virex-primary/40 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 group cursor-pointer hover:border-virex-primary transition-all">
                <div className="w-5 h-5 rounded-full bg-virex-primary/20 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-virex-primary" />
                </div>
                <span className="text-xs font-bold text-white">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <ChevronDown size={14} className="text-virex-text-secondary group-hover:text-virex-primary transition-colors" />
              </div>
              
              <button 
                onClick={onDisconnect}
                className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                title="Disconnect Wallet"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
            <WalletModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                onSelect={(type) => onConnect(type)} 
            />
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
