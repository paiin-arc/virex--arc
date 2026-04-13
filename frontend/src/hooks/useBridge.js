import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const API_BASE = 'http://localhost:8000/api';
const RELAYER_ADDRESS = '0xa010DAbE36CAbAf7a0ca9B532beD1f31De5E5ef9';

const USDC_ADDRESSES = {
    arc: '0x3600000000000000000000000000000000000000',
    ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    arbitrum: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    avalanche: '0x5425890298aed601595a70AB815c96711a31Bc65'
};

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

        try {
            setLoading(true);
            setStatus({ status: 'initializing', message: `Switching to ${source}...` });
            
            // 1. Ensure correct network
            if (ensureNetwork) await ensureNetwork(source);

            setStatus({ status: 'initializing', message: 'Confirming Deposit...' });

            const usdcAddress = USDC_ADDRESSES[source];
            const usdc = new ethers.Contract(
                usdcAddress,
                ["function transfer(address to, uint256 amount) public returns (bool)"],
                signer
            );

            // USDC uses 6 decimals
            const amtWei = ethers.utils.parseUnits(amount.toString(), 6);

            const tx = await usdc.transfer(RELAYER_ADDRESS, amtWei);
            setStatus({ status: 'depositing', message: 'Waiting for confirmation...' });
            const receipt = await tx.wait();

            setStatus({ status: 'pending', message: 'Notifying execution layer...' });

            const res = await fetch(`${API_BASE}/intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_chain: source,
                    dest_chain: dest,
                    amount: amount,
                    recipient: recipient,
                    user_deposit_hash: receipt.transactionHash
                })
            });

            if (!res.ok) throw new Error("Failed to create bridge intent");

            const { intent_id } = await res.json();
            pollStatus(intent_id);

        } catch (err) {
            console.error("Bridge failed", err);
            setStatus({ status: 'failed', error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return { quote, fetchQuote, initiateBridge, status, setStatus, loading, history };
};
