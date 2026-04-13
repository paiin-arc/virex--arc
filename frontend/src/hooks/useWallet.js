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
        let eth = window.ethereum;
        
        // Target specific providers
        if (walletType === 'okx' && window.okxwallet) eth = window.okxwallet;
        else if (walletType === 'rabby' && window.rabby) eth = window.rabby;
        else if (walletType === 'metamask') {
            // Find metamask among multi-provider setups
            if (window.ethereum?.providers) {
                eth = window.ethereum.providers.find(p => p.isMetaMask);
            } else if (!window.ethereum?.isMetaMask && window.okxwallet) {
                // If ethereum is hijacked by OKX, and user specifically asked for metamask
                alert("MetaMask not found or hidden by another wallet extension.");
                return;
            }
        }

        if (!eth) {
            alert(`${walletType.toUpperCase()} wallet not found!`);
            return;
        }

        try {
            const prov = new ethers.providers.Web3Provider(eth);
            const accounts = await eth.request({ method: 'eth_requestAccounts' });
            const sig = prov.getSigner();
            
            setProvider(prov);
            setSigner(sig);
            setAddress(accounts[0]);
            setIsConnected(true);
            localStorage.setItem("selectedWallet", walletType);
            
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
        if (!window.ethereum || !config) return;
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (err) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [config],
                });
            }
        }
    };

    const ensureNetwork = async (chainKey) => {
        if (!provider || !chainKey) return;
        const config = CHAIN_CONFIGS[chainKey];
        const { chainId } = await provider.getNetwork();
        
        if (chainId !== parseInt(config.chainId, 16)) {
            await switchNetwork(chainKey);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem("selectedWallet");
        if (saved) connect(saved);
    }, []);

    return { address, balance, isConnected, provider, signer, connect, disconnect, ensureNetwork, refreshBalance };
};
