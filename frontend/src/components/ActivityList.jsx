import React from 'react';
import { ExternalLink, CheckCircle2, Clock, XCircle, ArrowRightLeft, Route, AlertCircle, Send } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const getRelativeTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

const ActivityList = ({ history }) => {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return (
      <div className="w-full h-full min-h-[350px] bg-white/20 backdrop-blur-md border border-virex-border rounded-virex p-6 flex flex-col items-center justify-center text-center">
        <Clock size={32} className="text-virex-text-secondary/50 mb-3 animate-pulse" />
        <span className="text-sm font-bold text-virex-text-secondary">No recent transactions</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/20 backdrop-blur-md border border-virex-border rounded-virex p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-virex-border">
        <div className="flex items-center gap-2 text-virex-text-primary">
          <Clock size={16} className="text-virex-secondary" />
          <h2 className="text-xs font-black uppercase tracking-widest">Transfers</h2>
        </div>
        <span className="text-[10px] font-bold text-virex-text-secondary/60">
          {history.length} total
        </span>
      </div>

      {/* Explorer Table Header */}
      <div className="hidden sm:grid grid-cols-[1.1fr_1fr_1.8fr_1fr_0.3fr] gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-virex-text-secondary/80 border-b border-virex-border/60">
        <div>Time</div>
        <div>Type</div>
        <div>Routing / Details</div>
        <div className="text-right">Value</div>
        <div></div>
      </div>

      {/* Rows Container */}
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {history.map((tx, i) => {
            const isSwap = tx.type === 'swap';
            const isSend = tx.type === 'send';
            const isFailed = tx.status === 'failed';
            const isPending = tx.status === 'pending' || tx.status === 'depositing' || tx.status === 'initializing';

            return (
              <Motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={tx.id || i}
                className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr_1.8fr_1fr_0.3fr] items-center gap-3 sm:gap-2 p-3 bg-white/30 hover:bg-white/60 border border-virex-border/40 hover:border-virex-border rounded-xl transition-all group relative overflow-hidden"
              >
                {/* Time column */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    isFailed ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                    isPending ? 'bg-yellow-500 animate-pulse' :
                    'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  }`} />
                  <span className="text-xs font-bold text-sky-600/90 whitespace-nowrap">
                    {getRelativeTime(tx.timestamp)}
                  </span>
                </div>

                {/* Type column */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/60 border border-virex-border text-virex-text-secondary select-none tracking-wider">
                    {isSwap ? 'Swap' : isSend ? 'Send' : 'Bridge'}
                  </span>
                </div>

                {/* Routing / Details column */}
                <div className="text-xs font-semibold text-virex-text-primary/95 truncate">
                  {isSwap ? (
                    <span className="flex items-center gap-1">
                      USDC <ArrowRightLeft size={10} className="text-virex-text-secondary" /> EURC
                    </span>
                  ) : isSend ? (
                    <span className="font-mono text-[11px] flex items-center gap-1">
                      → {tx.recipient ? `${tx.recipient.slice(0, 6)}...${tx.recipient.slice(-4)}` : 'Recipient'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 uppercase text-[10px] font-bold text-virex-secondary">
                      {tx.source || 'UNK'} → {tx.dest || 'UNK'}
                    </span>
                  )}
                </div>

                {/* Value column */}
                <div className="text-right flex items-center justify-end gap-1.5 sm:text-right">
                  <span className={`text-xs font-black ${isFailed ? 'text-red-500/80 line-through' : 'text-virex-text-primary'}`}>
                    {isSwap ? tx.amountIn : tx.amount || '0'}
                  </span>
                  <span className="text-[10px] font-black text-virex-text-secondary">
                    {isSwap ? (tx.direction === 'USDC_TO_EURC' ? 'USDC' : 'EURC') : 'USDC'}
                  </span>
                </div>

                {/* Tx explorer link */}
                <div className="flex justify-end">
                  {(tx.explorerUrls?.destination || tx.explorerUrls?.source || tx.txHash) && !isFailed ? (
                    <a
                      href={
                        tx.explorerUrls?.destination ||
                        tx.explorerUrls?.source ||
                        (tx.txHash ? `https://testnet.arcscan.app/tx/${tx.txHash}` : '#')
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/70 rounded-md border border-transparent hover:border-virex-border text-virex-text-secondary hover:text-virex-text-primary transition-all"
                    >
                      <ExternalLink size={13} />
                    </a>
                  ) : isFailed ? (
                    <div className="group/err relative cursor-help">
                      <AlertCircle size={13} className="text-red-500" />
                      <div className="absolute right-0 bottom-full mb-1 hidden group-hover/err:block bg-red-500 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg max-w-[120px] z-20">
                        {tx.error || 'Failed'}
                      </div>
                    </div>
                  ) : null}
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
