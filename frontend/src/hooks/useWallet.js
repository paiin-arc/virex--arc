import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const CHAIN_CONFIGS = {
    arc: {
        chainId: "0x4CEF52",
        chainName: "Arc Testnet",
        rpcUrls: ["https://rpc.testnet.arc.network"],
        nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
        blockExplorerUrls: ["https://testnet.arcscan.app"]
    },
    arbitrum: {
        chainId: "0x66EEE", // 421614
        chainName: "Arbitrum Sepolia",
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.arbiscan.io"]
    },
    avalanche: {
        chainId: "0xA869", // 43113
        chainName: "Avalanche Fuji",
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
        blockExplorerUrls: ["https://testnet.snowscan.xyz"]
    },
    ethereum: {
        chainId: "0xAA36A7", // 11155111
        chainName: "Ethereum Sepolia",
        rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.etherscan.io"]
    }
};

const getInjectedProvider = () => {
    const savedWallet = localStorage.getItem("selectedWallet");
    let eth = window.ethereum;

    if (savedWallet === 'okx' && window.okxwallet) return window.okxwallet;
    
    if (window.ethereum?.providers) {
        if (savedWallet === 'rabby') {
            eth = window.ethereum.providers.find(p => p.isRabby) || window.ethereum;
        } else if (savedWallet === 'metamask') {
            eth = window.ethereum.providers.find(p => p.isMetaMask && !p.isRabby) || window.ethereum;
        }
    } else if (savedWallet === 'rabby' && window.rabby) {
        eth = window.rabby;
    }

    return eth;
};

export const useWallet = () => {
    const [address, setAddress] = useState(null);
    const [balance, setBalance] = useState("0.00");
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);

    const refreshBalance = useCallback(async (prov, addr) => {
        if (!prov || !addr) return;
        try {
            const bal = await prov.getBalance(addr);
            const network = await prov.getNetwork();
            const decimals = network.chainId === 5042002 ? 18 : 18; // Use correct decimals per chain if needed
            setBalance(parseFloat(ethers.utils.formatUnits(bal, 18)).toFixed(4));
        } catch (err) {
            console.error("Balance refresh failed", err);
        }
    }, []);

    const connect = async (walletType = 'metamask') => {
        // Persist first so getInjectedProvider can resolve the correct instance generically
        localStorage.setItem("selectedWallet", walletType);
        
        const eth = getInjectedProvider();

        if (!eth) {
            alert(`${walletType.toUpperCase()} wallet not found!`);
            return;
        }

        console.log("Using provider:", eth.isRabby ? "Rabby" : (eth.isMetaMask ? "MetaMask" : walletType));

        try {
            const prov = new ethers.providers.Web3Provider(eth);
            const accounts = await eth.request({ method: 'eth_requestAccounts' });
            const sig = prov.getSigner();
            
            setProvider(prov);
            setSigner(sig);
            setAddress(accounts[0]);
            setIsConnected(true);
            
            await refreshBalance(prov, accounts[0]);
        } catch (err) {
            console.error("Connection failed", err);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setBalance("0.00");
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
        localStorage.removeItem("selectedWallet");
    };

    const switchNetwork = async (chainKey) => {
        const config = CHAIN_CONFIGS[chainKey];
        const targetEth = getInjectedProvider();
        if (!targetEth || !config) throw new Error("Wallet or chain config not found");
        
        try {
            await targetEth.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (err) {
            if (err.code === 4902) {
                await targetEth.request({
                    method: 'wallet_addEthereumChain',
                    params: [config],
                });
            } else {
                throw err;
            }
        }
    };

    const ensureNetwork = async (chainKey) => {
        if (!provider || !chainKey) return { provider, signer };
        const config = CHAIN_CONFIGS[chainKey];
        const { chainId } = await provider.getNetwork();
        
        if (chainId !== parseInt(config.chainId, 16)) {
            await switchNetwork(chainKey);
            
            // Add fallback handling and verification if network switch fails
            await new Promise(r => setTimeout(r, 1000));
            
            // Recreate ethers provider and signer completely fresh to prevent "underlying network changed"
            const targetEth = getInjectedProvider();
            const newProvider = new ethers.providers.Web3Provider(targetEth);
            const newNetwork = await newProvider.getNetwork();
            
            if (newNetwork.chainId !== parseInt(config.chainId, 16)) {
                throw new Error(`Failed to ensure network ${config.chainName}`);
            }
            
            const newSigner = newProvider.getSigner();
            
            // Update React state
            setProvider(newProvider);
            setSigner(newSigner);
            
            // Safely refresh balance using the updated provider
            if (address) {
                refreshBalance(newProvider, address);
            }
            
            // Return fresh instances directly to resolving function closure
            return { provider: newProvider, signer: newSigner };
        }
        
        return { provider, signer };
    };

    useEffect(() => {
        const saved = localStorage.getItem("selectedWallet");
        if (saved) connect(saved);
        
        // Listen for underlying network changes dynamically
        const handleChainChanged = () => {
            const targetEth = getInjectedProvider();
            // Re-instantiating the provider is the safest approach in Ethers v5 without throwing NETWORK_ERROR
            if (targetEth) {
                 const newProvider = new ethers.providers.Web3Provider(targetEth);
                 setProvider(newProvider);
                 setSigner(newProvider.getSigner());
                 if (address) refreshBalance(newProvider, address);
            }
        };

        const currentProvider = getInjectedProvider();
        if (currentProvider) {
            currentProvider.on('chainChanged', handleChainChanged);
        }

        return () => {
             const cleanupProvider = getInjectedProvider();
             if (cleanupProvider?.removeListener) {
                 cleanupProvider.removeListener('chainChanged', handleChainChanged);
             }
        };
    }, [address, refreshBalance]);

    return { address, balance, isConnected, provider, signer, connect, disconnect, ensureNetwork, refreshBalance };
};
