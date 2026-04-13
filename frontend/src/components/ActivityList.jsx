import React from 'react';
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react';

const ActivityList = ({ history }) => {
  if (!history || !Array.isArray(history) || history.length === 0) return null;

  return (
    <div className="w-full max-w-[500px] mx-auto mt-12 space-y-4">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-2 text-virex-text-secondary">
          <Clock size={16} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Recent Activity</h2>
        </div>
        <button className="text-[10px] font-bold text-virex-primary uppercase hover:underline">View All</button>
      </div>

      <div className="space-y-2">
        {history.map((tx, i) => (
          <div key={tx.intent_id || i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-virex-success/10 flex items-center justify-center text-virex-success">
                    <CheckCircle2 size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{tx.amounts?.bridge || tx.amount} USDC</span>
                    <span className="text-[10px] font-medium text-virex-text-secondary uppercase tracking-tighter">
                        {(tx.input?.source_chain || tx.source || 'UNK').toUpperCase()} → {(tx.input?.dest_chain || tx.dest || 'UNK').toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    tx.status === 'completed' ? 'bg-virex-success/10 text-virex-success' : 'bg-virex-primary/10 text-virex-primary'
                }`}>
                    {tx.status}
                </div>
                <a 
                  href={tx.explorerUrls?.destination || tx.explorerUrls?.source} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-virex-text-secondary hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
