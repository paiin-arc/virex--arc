import React from 'react';
import { ExternalLink, Layers, Navigation, ShieldCheck } from 'lucide-react';

const Sidebar = ({ userAddress, history }) => {
    // Get the most recent successfully bridged/burn transaction hash
    const latestBurnTx = history?.find(h => h.sourceTxHash)?.sourceTxHash;

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0b0f1a] border-r border-[#1a2235] flex flex-col pt-8 pb-6 px-4 z-50">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-10">
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
        </aside>
    );
};

export default Sidebar;
