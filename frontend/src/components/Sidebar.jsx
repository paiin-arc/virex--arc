import React, { useState } from 'react';
import { ExternalLink, Layers, Navigation, ShieldCheck, X, ArrowRightLeft } from 'lucide-react';
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

const Sidebar = ({ userAddress, history, isOpen, onClose }) => {
    // Get the most recent successfully bridged/burn transaction hash
    const latestBurnTx = history?.find(h => h.sourceTxHash)?.sourceTxHash;

    const [swapAmount, setSwapAmount] = useState('');
    const [isSwapping, setIsSwapping] = useState(false);

    const handleSwap = async (e) => {
        e.preventDefault();
        if (!swapAmount || isNaN(swapAmount) || Number(swapAmount) <= 0) return;
        
        setIsSwapping(true);
        try {
            if (!window.ethereum) {
                throw new Error("No browser wallet (e.g., MetaMask) found.");
            }

            // Create adapter from the user's browser wallet
            const adapter = await createViemAdapterFromProvider({
                provider: window.ethereum,
            });

            // Initialize the App Kit
            const kit = new AppKit();

            const result = await kit.swap({
              from: { 
                  adapter: adapter, 
                  chain: "Arc_Testnet" 
              },
              tokenIn: "USDC",
              tokenOut: "EURC",
              amountIn: swapAmount,
              config: { 
                  kitKey: import.meta.env.VITE_KIT_KEY,
                  slippageBps: 300 // 3% slippage
              },
            });
            
            console.log(`Swapped ${swapAmount} USDC for EURC`, result);
            setSwapAmount('');
            alert('Swap successful!');
        } catch (error) {
            console.error("Swap failed", error);
            alert(`Swap failed: ${error?.message || error}`);
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen w-60 bg-[#0b0f1a] border-r border-[#1a2235] flex flex-col pt-8 pb-6 px-4 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Close Button Mobile */}
            <button
                onClick={onClose}
                className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
                <X size={20} />
            </button>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-10 mt-2 lg:mt-0">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <img
                        src="/virex-app-logo.png"
                        alt="Virex Logo"
                        className="w-14 h-14 object-contain relative z-10"
                    />
                </div>
                <h1 className="mt-4 text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Virex</h1>
            </div>

            {/* Navigation / Links Section */}
            <div className="flex-1 space-y-8">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Tools</h3>
                    <nav className="space-y-1">
                        <a
                            href="https://testnet.arcscan.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2235] transition-all group"
                        >
                            <Navigation size={18} className="text-blue-400 group-hover:text-blue-300" />
                            <span className="text-sm font-medium">Arc Explorer</span>
                            <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2235] transition-all group"
                        >
                            <Layers size={18} className="text-purple-400 group-hover:text-purple-300" />
                            <span className="text-sm font-medium">USDC Faucet</span>
                            <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </nav>
                </div>

                {/* Swap Section */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Swap (Arc Testnet)</h3>
                    <div className="px-2">
                        <form onSubmit={handleSwap} className="bg-[#1a2235] p-3 rounded-xl border border-white/5 space-y-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            
                            {/* Input: USDC */}
                            <div className="space-y-1 relative z-10">
                                <label className="text-[10px] text-gray-400 font-medium ml-1">Pay USDC</label>
                                <div className="flex items-center bg-[#0b0f1a] rounded-lg p-2 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="any"
                                        placeholder="0.00" 
                                        className="w-full bg-transparent text-sm text-white outline-none"
                                        value={swapAmount}
                                        onChange={(e) => setSwapAmount(e.target.value)}
                                    />
                                    <span className="text-xs text-blue-400 font-bold ml-2">USDC</span>
                                </div>
                            </div>

                            {/* Arrow icon */}
                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="bg-[#1a2235] p-1 rounded-full border border-white/5 shadow-sm text-gray-400">
                                    <ArrowRightLeft size={14} className="rotate-90" />
                                </div>
                            </div>

                            {/* Output: EURC (Mock estimation 1:0.92) */}
                            <div className="space-y-1 relative z-10">
                                <label className="text-[10px] text-gray-400 font-medium ml-1">Receive EURC</label>
                                <div className="flex items-center bg-[#0b0f1a] rounded-lg p-2 border border-white/5">
                                    <input 
                                        type="text" 
                                        readOnly
                                        placeholder="0.00" 
                                        className="w-full bg-transparent text-sm text-gray-300 outline-none cursor-not-allowed"
                                        value={swapAmount ? (Number(swapAmount) * 0.92).toFixed(2) : ''}
                                    />
                                    <span className="text-xs text-purple-400 font-bold ml-2">EURC</span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!swapAmount || Number(swapAmount) <= 0 || isSwapping}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                            >
                                {isSwapping ? 'Swapping...' : 'Swap'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Wallet Aware Section */}
                {(userAddress || latestBurnTx) && (
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Your Activity</h3>
                        <nav className="space-y-1">
                            {userAddress && (
                                <a
                                    href={`https://testnet.arcscan.app/address/${userAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2235] transition-all group"
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                    <span className="text-sm font-medium truncate">View My Wallet</span>
                                    <ExternalLink size={14} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}

                            {latestBurnTx && (
                                <a
                                    href={`https://testnet.arcscan.app/tx/${latestBurnTx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2235] transition-all group"
                                >
                                    <ShieldCheck size={18} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-sm font-medium truncate">Last Burn TX</span>
                                    <ExternalLink size={14} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-6 border-t border-[#1a2235]">
                <a
                    href="https://x.com/paiin_ip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a2235] transition-all group"
                >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-400 transition-colors shrink-0">
                        <img
                            src="/paiin-pfp.jpg"
                            alt="paiin_ip"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to unavatar if the local file isn't found
                                if (!e.target.src.includes('unavatar')) {
                                    e.target.src = "https://unavatar.io/twitter/paiin_ip";
                                }
                            }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Created by</span>
                        <span className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors">paiin_ip</span>
                        <span className="text-[9px] text-blue-400/80 mt-0.5 font-medium">Follow</span>
                    </div>
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
