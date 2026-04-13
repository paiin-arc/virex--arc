import React from 'react';
import { X, CheckCircle2, Loader2, Circle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Step = ({ label, status, hash, explorerUrl, isActive }) => {
    const isCompleted = status === 'success' || status === 'completed' || status === 'bridging';
    const isLoading = isActive && !isCompleted && status !== 'failed';

    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            isActive ? 'bg-virex-primary/5 border-virex-primary/20' : 'bg-transparent border-white/5 opacity-40'
        } ${status === 'failed' && isActive ? 'border-red-500/50 bg-red-500/5' : ''}`}>
            <div className="flex items-center gap-3">
                {status === 'failed' && isActive ? (
                    <X className="text-red-500" size={20} />
                ) : isCompleted ? (
                    <CheckCircle2 className="text-virex-success" size={20} />
                ) : isLoading ? (
                    <Loader2 className="animate-spin text-virex-primary" size={20} />
                ) : (
                    <Circle className="text-virex-text-secondary" size={20} />
                )}
                
                <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-virex-text-secondary'}`}>{label}</span>
                    {hash && (
                        <span className="text-[10px] font-mono text-virex-text-secondary truncate w-32">
                            {hash.slice(0, 10)}...
                        </span>
                    )}
                </div>
            </div>

            {explorerUrl && (
                <a 
                    href={explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded-lg text-virex-text-secondary transition-colors"
                >
                    <ExternalLink size={14} />
                </a>
            )}
        </div>
    );
};

const ProgressOverlay = ({ status, onClose }) => {
    if (!status || typeof status !== 'object') return null;

    // Map internal status codes to UI steps
    const currentStatus = status.status || 'unknown';
    const isFailed = currentStatus === 'failed';
    
    const steps = [
        { key: 'burn', label: 'Burn (Arc Testnet)', activeStates: ['depositing', 'pending', 'executing', 'bridging', 'completed', 'failed'] },
        { key: 'attestation', label: 'Circle Attestation', activeStates: ['bridging', 'completed'] },
        { key: 'mint', label: 'Mint (Arbitrum)', activeStates: ['completed'] }
    ];

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-virex-bg/90 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-[440px] virex-card p-8 relative"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-virex-text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-10">
                        <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl ${
                            isFailed ? 'bg-red-500 shadow-red-500/20' : 'bg-accent-gradient shadow-virex-primary/40'
                        }`}>
                            {isFailed ? (
                                <X className="text-white" size={32} />
                            ) : currentStatus === 'completed' ? (
                                <CheckCircle2 className="text-white" size={32} />
                            ) : (
                                <Loader2 className="text-white animate-spin" size={32} />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">
                            {isFailed ? 'Transfer Failed' : currentStatus === 'completed' ? 'Transfer Complete!' : 'Processing Transfer'}
                        </h2>
                        <p className="text-virex-text-secondary text-sm font-medium">
                            {status.error || status.message || 'Your assets are being moved securely.'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {steps.map((s, i) => {
                            const isActive = s.activeStates.includes(currentStatus);
                            const isSuccessful = currentStatus === 'completed' || (s.key === 'burn' && (currentStatus === 'bridging' || status.sourceTxHash));
                            
                            let stepStatus = isActive ? 'loading' : 'pending';
                            if (isSuccessful) stepStatus = 'success';
                            if (currentStatus === 'failed') stepStatus = 'failed';

                            return (
                                <Step 
                                    key={s.key}
                                    label={s.label}
                                    status={stepStatus}
                                    isActive={isActive}
                                    hash={s.key === 'burn' ? status.sourceTxHash : s.key === 'mint' ? status.destinationTxHash : null}
                                    explorerUrl={s.key === 'burn' ? status.explorerUrls?.source : s.key === 'mint' ? status.explorerUrls?.destination : null}
                                />
                            );
                        })}
                    </div>

                    {currentStatus === 'completed' && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={onClose}
                            className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                            Done
                        </motion.button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProgressOverlay;
