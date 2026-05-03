import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const RELAYER_ADDRESS = '0xa010dabe36cabaf7a0ca9b532bed1f31de5e5ef9';

const USDC_ADDRESSES = {
    arc: '0x3600000000000000000000000000000000000000',
    ethereum: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    arbitrum: '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
    avalanche: '0x5425890298aed601595a70ab815c96711a31bc65'
};

const TOKEN_MESSENGERS = {
    arc: RELAYER_ADDRESS, // Mock CCTP messenger for Arc Testnet
    ethereum: '0x9f3b8679c73c2fef8b59b4f3c15248593d4f8674',
    arbitrum: '0x9f3b8679c73c2fef8b59b4f3c15248593d4f8674',
    avalanche: '0xeb08f243e5d3fcff26b9e3b25fe7902ebb143eeb'
};

const DESTINATION_DOMAINS = {
    ethereum: 0,
    avalanche: 1,
    arbitrum: 3,
    arc: 4 // Custom domain for Arc in demo
};

function normalizeAddress(addr) {
    try {
        return ethers.utils.getAddress(addr);
    } catch {
        throw new Error("Invalid address: " + addr);
    }
}

export const useBridge = (signer, address, { ensureNetwork, provider } = {}) => {
    const [quote, setQuote] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem("bridgeHistory");
        return saved ? JSON.parse(saved) : [];
    });

    const saveToHistory = useCallback((tx) => {
        setHistory(prev => {
            if (prev.find(h => h.intent_id === tx.intent_id)) return prev;
            const record = {
                ...tx,
                timestamp: Date.now()
            };
            const updated = [record, ...prev].slice(0, 5);
            localStorage.setItem("bridgeHistory", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const fetchQuote = useCallback(async (amount, source, dest) => {
        try {
            const res = await fetch(`${API_BASE}/quote?amount=${amount}&source=${source}&dest=${dest}`);
            if (!res.ok) {
                throw new Error(`Quote fetch failed with status ${res.status}`);
            }
            const data = await res.json();
            setQuote(data);
        } catch (err) {
            console.error("Quote fetch failed", err);
        }
    }, []);

    const pollStatus = (intentId) => {
        if (!intentId) return;
        
        const iv = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/intent/${intentId}/status`);
                if (!res.ok) throw new Error("Status check failed");
                const data = await res.json();
                
                setStatus(prev => ({
                    ...prev,
                    ...data
                }));
                
                if (data.sourceTxHash) saveToHistory(data);
                
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(iv);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
        return iv;
    };

    const initiateBridge = async (amount, source, dest, recipient) => {
        if (!signer || !address) return;

        // 1. Proper validation before API call (Circle Skills Best Practice)
        if (!amount || isNaN(amount) || amount <= 0) {
            console.error("Validation failed: Invalid amount");
            setStatus({ status: 'failed', error: 'Invalid amount provided for bridge transfer' });
            return;
        }

        // Circle Best Practice: Always warn when exceeding safety thresholds (e.g., >100 USDC).
        if (parseFloat(amount) > 100) {
            console.warn("Safety warning: Bridging an amount greater than 100 USDC");
        }

        if (!source || !dest) {
            console.error("Validation failed: Missing source or destination chain");
            setStatus({ status: 'failed', error: 'Source and destination chains must be specified' });
            return;
        }

        if (source === dest) {
            console.error("Validation failed: Source and destination must be different");
            setStatus({ status: 'failed', error: 'Source and destination chains must not be the same' });
            return;
        }

        // Circle Best Practice: ALWAYS validate all inputs (addresses, amounts) before submitting bridge operations.
        if (!recipient || !ethers.utils.isAddress(recipient)) {
            console.error("Validation failed: Invalid recipient EVM address");
            setStatus({ status: 'failed', error: 'A valid recipient address is required' });
            return;
        }

        try {
            setLoading(true);
            const directionLabel = `${source.charAt(0).toUpperCase() + source.slice(1)} → ${dest.charAt(0).toUpperCase() + dest.slice(1)}`;
            setStatus({ status: 'initializing', message: `[${directionLabel}] Switching wallet to ${source}...` });
            
            // 1. Ensure correct network (Source Chain) and handle fresh provider/signer
            let activeSigner = signer;
            if (ensureNetwork) {
                try {
                    const result = await ensureNetwork(source);
                    if (result?.signer) activeSigner = result.signer;
                } catch (err) {
                    throw new Error(`Failed to switch to ${source} network: ${err.message}`);
                }
            }

            if (!activeSigner) throw new Error("No valid signer after network switch");

            setStatus({ status: 'initializing', message: `[${directionLabel}] Requesting USDC Token Approval...` });

            // Normalize all addresses for safe ethers calls
            const normalizedRecipient = normalizeAddress(recipient);
            const usdcAddress = normalizeAddress(USDC_ADDRESSES[source]);
            const messengerAddress = normalizeAddress(TOKEN_MESSENGERS[source] || RELAYER_ADDRESS);
            const normalizedRelayer = normalizeAddress(RELAYER_ADDRESS);

            const usdc = new ethers.Contract(
                usdcAddress,
                [
                    "function approve(address spender, uint256 amount) public returns (bool)",
                    "function transfer(address to, uint256 amount) public returns (bool)"
                ],
                activeSigner
            );

            // USDC uses 6 decimals
            const amtWei = ethers.utils.parseUnits(amount.toString(), 6);

            // CCTP Flow step 1: Approve TokenMessenger
            const approveTx = await usdc.approve(messengerAddress, amtWei);
            setStatus({ status: 'depositing', message: `[${directionLabel}] Waiting for Approval confirmation...` });
            await approveTx.wait();

            setStatus({ status: 'depositing', message: `[${directionLabel}] Burning USDC on ${source}...` });

            let receipt;
            if (messengerAddress === normalizedRelayer) {
                // Mock burn fallback for Arc Devnet / Demo using Relayer
                const tx = await usdc.transfer(normalizedRelayer, amtWei);
                setStatus({ status: 'depositing', message: `[${directionLabel}] Waiting for Burn execution...` });
                receipt = await tx.wait();
            } else {
                // Real CCTP App Kit flow: depositForBurn
                const messenger = new ethers.Contract(
                    messengerAddress,
                    ["function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64)"],
                    activeSigner
                );
                
                const destDomain = DESTINATION_DOMAINS[dest] !== undefined ? DESTINATION_DOMAINS[dest] : 0;
                
                // CCTP requires mint recipient as bytes32
                const mintRecipientBytes32 = ethers.utils.zeroPad(normalizedRecipient, 32);
                
                const tx = await messenger.depositForBurn(amtWei, destDomain, mintRecipientBytes32, usdcAddress);
                setStatus({ status: 'depositing', message: `[${directionLabel}] Waiting for Burn execution...` });
                receipt = await tx.wait();
            }

            setStatus({ status: 'pending', message: `[${directionLabel}] Attesting & Minting on ${dest}...` });

            const res = await fetch(`${API_BASE}/intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_chain: source,
                    dest_chain: dest,
                    amount: amount,
                    // FIX: Backend expects 'receiver', not 'recipient'
                    receiver: normalizedRecipient, 
                    user_deposit_hash: receipt.transactionHash
                })
            });

            if (!res.ok) {
                // Improved Error Handling: Log full backend response
                let errorDetails = "Failed to create bridge intent";
                const errorText = await res.text();
                try {
                    const errData = JSON.parse(errorText);
                    errorDetails = errData.error || JSON.stringify(errData);
                } catch (e) {
                    errorDetails = errorText;
                }
                
                console.error("Backend Intent Creation Error Response:", errorDetails, "Status:", res.status);
                throw new Error(`API Error ${res.status}: ${errorDetails}`);
            }

            const { intent_id } = await res.json();
            pollStatus(intent_id);

        } catch (err) {
            // Improved Error Handling: Log the full stack and exact error
            console.error("Bridge execution intercepted:", err);
            
            if (err.code === 4001 || err.message?.includes("User denied") || err.message?.includes("rejected")) {
                setStatus({ status: 'failed', error: 'Transaction rejected by user' });
            } else {
                setStatus({ status: 'failed', error: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return { quote, fetchQuote, initiateBridge, status, setStatus, loading, history };
};
