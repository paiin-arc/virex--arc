import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TransferCard from './components/TransferCard';
import ActivityList from './components/ActivityList';
import ProgressOverlay from './components/ProgressOverlay';
import Sidebar from './components/Sidebar';
import PaymentCard from './components/PaymentCard';
import { useWallet } from './hooks/useWallet';
import { useBridge } from './hooks/useBridge';
import { useActivity } from './hooks/useActivity';
import { useSend } from './hooks/useSend';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-virex-bg flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-virex-text-secondary max-w-md mb-6">{this.state.error?.message || 'A rendering error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="virex-button !w-auto">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { 
    address, 
    balance, 
    eurcBalance,
    isConnected, 
    connect, 
    disconnect, 
    signer,
    refreshBalance,
    provider,
    ensureNetwork
  } = useWallet();

  const { history, addActivity } = useActivity();

  const { 
    quote, 
    fetchQuote, 
    initiateBridge, 
    status, 
    setStatus,
    loading 
  } = useBridge(signer, address, { ensureNetwork, provider, addActivity });

  const {
    estimate: sendEstimate,
    paymentBalance,
    isPreparing: isPreparingPayment,
    isSending: isSendingPayment,
    error: sendError,
    preparePayment,
    confirmPayment,
    resetPayment
  } = useSend({
    address,
    provider,
    ensureNetwork,
    addActivity,
    refreshBalance
  });

  return (
    <ErrorBoundary>
        <div className="min-h-screen pb-20 overflow-x-hidden flex">
          {/* Background Orbs */}
          <div className="fixed -top-24 -left-24 w-96 h-96 bg-virex-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-virex-secondary/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <Sidebar 
            userAddress={address} 
            history={history} 
            addActivity={addActivity}
            ensureNetwork={ensureNetwork}
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />

          <div className="flex-1 lg:ml-60 flex flex-col min-h-screen w-full transition-all duration-300">
              <Header 
                provider={provider}
                address={address || ''} 
                balance={balance || '0.00'} 
                eurcBalance={eurcBalance || '0.00'}
                isConnected={isConnected} 
                onConnect={connect}
                onDisconnect={disconnect}
                isBridging={loading}
                onMenuClick={() => setIsSidebarOpen(true)}
              />

          <main className="container mx-auto px-4">
            <Hero />

            <PaymentCard
              address={address}
              isConnected={isConnected}
              paymentBalance={paymentBalance}
              estimate={sendEstimate}
              error={sendError}
              isPreparing={isPreparingPayment}
              isSending={isSendingPayment}
              onPrepare={preparePayment}
              onConfirm={confirmPayment}
              onReset={resetPayment}
            />
            
            <TransferCard 
              isConnected={isConnected}
              loading={loading}
              quote={quote}
              currentBalance={balance || '0.00'}
              onQuoteFetch={fetchQuote}
              onTransfer={initiateBridge}
            />

            <ActivityList history={history || []} />
          </main>

          <ProgressOverlay 
            status={status} 
            onClose={() => {
              setStatus(null);
              if (address && provider) refreshBalance(provider, address);
            }} 
          />

              <footer className="mt-20 text-center text-[10px] font-bold text-virex-text-secondary uppercase tracking-[0.2em] opacity-30">
                Powered by Circle CCTP • Secured by Arc App Kit
              </footer>
          </div>
        </div>
    </ErrorBoundary>
  );
}

export default App;
