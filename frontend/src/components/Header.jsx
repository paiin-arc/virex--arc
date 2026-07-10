import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, ChevronDown, CheckCircle2, ShieldCheck, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WALLETS = [
    { id: 'metamask', name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
    { id: 'okx', name: 'OKX Wallet', icon: 'https://www.okx.com/cdn/assets/imgs/221/9E9A9C9B4B8B4B8B.png' },
    { id: 'rabby', name: 'Rabby Wallet', icon: 'https://rabby.io/assets/images/logo.svg' },
    { id: 'coinbase', name: 'Coinbase', icon: 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4' }
];

const WalletIcon = ({ src, alt }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return <Wallet className="w-6 h-6 text-virex-text-secondary" />;
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-contain"
            onError={(e) => {
                console.warn(`[WalletModal] Failed to load icon for ${alt} from ${src}. Falling back to default icon.`);
                setHasError(true);
            }}
        />
    );
};

const WalletModal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const isInstalled = (id) => {
        if (id === 'metamask') return window.ethereum?.isMetaMask;
        if (id === 'okx') return !!window.okxwallet;
        if (id === 'rabby') return !!window.rabby;
        return false;
    };

    const handleWalletSelect = (walletId) => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && !isInstalled(walletId)) {
            const dappUrl = encodeURIComponent(window.location.href.replace(/^https?:\/\//, ''));
            const fullUrl = encodeURIComponent(window.location.href);

            if (walletId === 'metamask') {
                window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
                return;
            } else if (walletId === 'okx') {
                window.location.href = `https://www.okx.com/web3/dapp/details?dappUrl=${fullUrl}`;
                return;
            } else if (walletId === 'coinbase') {
                window.location.href = `https://go.cb-w.com/dapp?cb_url=${fullUrl}`;
                return;
            } else {
                alert(`Please open this site inside your ${walletId} app browser.`);
                return;
            }
        }

        onSelect(walletId);
        onClose();
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
                className="relative w-full max-w-md bg-virex-card border border-virex-border rounded-[32px] overflow-hidden shadow-2xl"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-virex-text-primary">Connect Wallet</h2>
                            <p className="text-virex-text-secondary text-sm">Choose your preferred Web3 wallet</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-virex-card-inner rounded-full border border-transparent hover:border-virex-border transition-colors">
                            <X size={20} className="text-virex-text-secondary" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {WALLETS.map(wallet => (
                            <button
                                key={wallet.id}
                                onClick={() => handleWalletSelect(wallet.id)}
                                className="group flex items-center justify-between p-4 bg-virex-card-inner border border-virex-border rounded-2xl hover:bg-virex-border hover:border-virex-secondary/40 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-virex-border p-2 flex items-center justify-center group-hover:bg-virex-secondary/10 transition-colors">
                                        <WalletIcon src={wallet.icon} alt={wallet.name} />
                                    </div>
                                    <div>
                                        <span className="block text-virex-text-primary font-bold">{wallet.name}</span>
                                        {isInstalled(wallet.id) && (
                                            <span className="text-[10px] text-virex-success font-black uppercase tracking-wider">Installed</span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-virex-border flex items-center justify-center group-hover:border-virex-secondary group-hover:bg-virex-secondary/10 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-virex-text-secondary group-hover:bg-virex-secondary" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-virex-primary/5 border border-virex-primary/10 rounded-2xl flex items-start gap-3">
                        <ShieldCheck className="text-virex-primary shrink-0" size={18} />
                        <p className="text-[11px] text-virex-text-secondary leading-relaxed">
                            Open this site inside your wallet app or use the options above to connect. 
                            Connecting your wallet is secure and does not give us access to your private keys or funds.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Header = ({ provider, address, balance, eurcBalance, isConnected, onConnect, onDisconnect, isBridging, onMenuClick }) => {
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
      <div className="flex items-center justify-between glass-effect rounded-[22px] px-4 md:px-6 py-3 shadow-sm gap-2">
        
        {/* Animated Line & Live Block Info */}
        <div className="flex items-center gap-3 md:gap-4">
            <button 
                onClick={onMenuClick} 
                className="lg:hidden p-1.5 text-virex-text-secondary hover:text-virex-text-primary hover:bg-virex-card-inner rounded-lg border border-transparent hover:border-virex-border transition-all"
            >
                <Menu size={20} />
            </button>
            
            <div className="w-12 md:w-24 hidden sm:flex items-center">
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
                <div className={`hidden sm:block text-[12px] font-medium tracking-wide transition-opacity duration-500 ${isBridging ? 'text-[#a1b4d6] opacity-100' : 'text-[#8a9bbd] opacity-70'}`}>
                    {networkName} &bull; #{blockNumber}
                </div>
            )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {isConnected && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-virex-card-inner border border-virex-border rounded-full">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-virex-text-secondary uppercase tracking-widest font-semibold">Balance</span>
                <span className="text-xs font-black text-virex-text-primary">{balance} USDC</span>
                <span className="text-xs font-black text-virex-text-primary">{eurcBalance} EURC</span>
              </div>
              <div className="w-[1px] h-6 bg-virex-border" />
              <div className="flex flex-col">
                <span className="text-[10px] text-virex-text-secondary uppercase tracking-widest font-semibold text-right">Arc Testnet</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-1.5 h-1.5 rounded-full bg-virex-success animate-pulse" />
                  <span className="text-xs font-black text-virex-text-primary">Verified</span>
                </div>
              </div>
            </div>
          )}

          {!isConnected ? (
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-accent-gradient rounded-full font-bold text-xs md:text-sm text-white shadow-lg shadow-virex-primary/20 hover:shadow-virex-primary/40 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Wallet size={16} className="hidden sm:block" />
              Connect<span className="hidden sm:inline"> Wallet</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 md:px-4 md:py-2.5 bg-virex-card-inner border border-virex-border rounded-full flex items-center gap-2 group cursor-pointer hover:border-virex-secondary transition-all">
                <div className="w-5 h-5 rounded-full bg-virex-secondary/15 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-virex-secondary" />
                </div>
                <span className="text-[11px] md:text-xs font-bold text-virex-text-primary">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <ChevronDown size={14} className="text-virex-text-secondary group-hover:text-virex-secondary transition-colors hidden sm:block" />
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
