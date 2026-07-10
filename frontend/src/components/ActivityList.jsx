import React from 'react';
import { ExternalLink, CheckCircle2, Clock, XCircle, ArrowRightLeft, Route, AlertCircle, Send } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const ActivityList = ({ history }) => {
  if (!history || !Array.isArray(history) || history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 mb-12 space-y-6">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-3 text-virex-text-secondary">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Clock size={16} className="text-blue-400" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Recent Activity
          </h2>
        </div>
      </div>

      <div className="space-y-3 relative">
        {/* Decorative background glow behind the list */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <AnimatePresence initial={false}>
          {history.map((tx, i) => {
            const isSwap = tx.type === 'swap';
            const isSend = tx.type === 'send';
            const isFailed = tx.status === 'failed';
            const isPending = tx.status === 'pending' || tx.status === 'depositing' || tx.status === 'initializing';

            return (
              <Motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                key={tx.id || i} 
                className={`relative overflow-hidden p-4 sm:p-5 bg-[#0b0f1a]/80 backdrop-blur-xl border transition-all duration-300 group rounded-[20px] ${
                    isFailed ? 'border-red-500/20 hover:border-red-500/40 shadow-[0_4px_20px_rgba(239,68,68,0.05)]' :
                    isPending ? 'border-yellow-500/20 hover:border-yellow-500/40 shadow-[0_4px_20px_rgba(234,179,8,0.05)]' :
                    'border-white/10 hover:border-virex-primary/40 hover:shadow-[0_4px_25px_rgba(37,99,235,0.1)]'
                }`}
              >
                {/* Subtle gradient background for each card */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${
                    isFailed ? 'from-red-500/5 to-transparent' :
                    isPending ? 'from-yellow-500/5 to-transparent' :
                    'from-blue-500/5 via-purple-500/5 to-transparent'
                }`} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left Section: Icon & Details */}
                  <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                          isFailed ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          isPending ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                          {isFailed ? <XCircle size={22} /> : 
                           isPending ? <Clock size={22} className="animate-pulse" /> : 
                           <CheckCircle2 size={22} />}
                      </div>

                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 uppercase tracking-widest">
                                  {isSwap ? 'Swap' : isSend ? 'Payment' : 'Bridge'}
                              </span>
                              
                              {/* Metadata Title (e.g. 100 USDC -> 92 EURC) */}
                              <span className="text-sm font-bold text-white flex items-center gap-2">
                                  {isSwap ? (
                                      <>
                                          {tx.amountIn} {tx.direction === 'USDC_TO_EURC' ? 'USDC' : 'EURC'}
                                          <ArrowRightLeft size={14} className="text-virex-text-secondary" />
                                          {tx.amountOut ? `${tx.amountOut} ${tx.direction === 'USDC_TO_EURC' ? 'EURC' : 'USDC'}` : '?'}
                                      </>
                                  ) : isSend ? (
                                      <>
                                          {tx.amount || '0'} USDC
                                          <Send size={14} className="text-virex-text-secondary" />
                                          <span className="font-mono text-xs">
                                            {tx.recipient ? `${tx.recipient.slice(0, 6)}...${tx.recipient.slice(-4)}` : 'recipient'}
                                          </span>
                                      </>
                                  ) : (
                                      <>
                                          {tx.amounts?.bridge || tx.amount || '0'} USDC
                                          <Route size={14} className="text-virex-text-secondary" />
                                          <span className="uppercase text-xs font-semibold text-virex-primary">
                                            {tx.source || 'UNK'} → {tx.dest || 'UNK'}
                                          </span>
                                      </>
                                  )}
                              </span>
                          </div>

                          {/* Subtext / Error handling */}
                          {isFailed ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-red-400/80 max-w-sm truncate">
                                  <AlertCircle size={12} />
                                  <span>{tx.error || 'Transaction failed'}</span>
                              </div>
                          ) : (
                              <>
                                  {isSend && tx.reference && (
                                      <span className="text-[11px] text-gray-400 truncate max-w-sm">
                                          Ref: {tx.reference}
                                      </span>
                                  )}
                                  <span className="text-[10px] font-medium text-virex-text-secondary uppercase tracking-wider">
                                      {new Date(tx.timestamp).toLocaleString()}
                                      {tx.txHash && ` • TX: ${tx.txHash.slice(0,6)}...${tx.txHash.slice(-4)}`}
                                  </span>
                              </>
                          )}
                      </div>
                  </div>

                  {/* Right Section: Status Badge & Link */}
                  <div className="flex items-center gap-3 sm:ml-auto shrink-0">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${
                          isFailed ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          isPending ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                          'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                          {tx.status}
                      </div>
                      
                      {(tx.explorerUrls?.destination || tx.explorerUrls?.source || tx.txHash) && !isFailed && (
                        <a 
                          href={
                              tx.explorerUrls?.destination || 
                              tx.explorerUrls?.source || 
                              (tx.txHash ? `https://testnet.arcscan.app/tx/${tx.txHash}` : '#')
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-virex-text-secondary hover:text-white hover:bg-white/10 hover:border-virex-primary/50 transition-all group/link"
                        >
                          <ExternalLink size={16} className="group-hover/link:scale-110 transition-transform" />
                        </a>
                      )}
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityList;
