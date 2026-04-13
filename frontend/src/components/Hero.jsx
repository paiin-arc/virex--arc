import React from 'react';

const Hero = () => {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-virex-primary/10 border border-virex-primary/20 text-virex-primary text-[10px] font-bold uppercase tracking-widest mb-4">
        <span className="flex h-1.5 w-1.5 rounded-full bg-virex-primary animate-ping" />
        Cross-Chain Transfer
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
        Move <span className="bg-clip-text text-transparent bg-accent-gradient">USDC</span> Across Chains
      </h1>
      <p className="text-virex-text-secondary text-lg font-medium max-w-md mx-auto">
        Fast. Secure. Gasless on destination.
      </p>
    </div>
  );
};

export default Hero;
