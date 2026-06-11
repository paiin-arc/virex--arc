import { useState, useCallback } from 'react';

export const useActivity = () => {
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem("virexHistory");
        return saved ? JSON.parse(saved) : [];
    });

    const addActivity = useCallback((tx) => {
        setHistory(prev => {
            // Determine a unique ID for the transaction
            const id = tx.intent_id || tx.txHash || tx.id || Math.random().toString(36).substr(2, 9);
            
            // Check if record exists (by ID, or by intent_id / txHash if present)
            const existingIndex = prev.findIndex(h => 
                (h.id && h.id === id) || 
                (tx.intent_id && h.intent_id === tx.intent_id) || 
                (tx.txHash && h.txHash === tx.txHash)
            );

            const newRecord = {
                ...tx,
                id,
                timestamp: tx.timestamp || Date.now()
            };

            let updated;
            if (existingIndex >= 0) {
                // Update existing record
                updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...newRecord };
            } else {
                // Prepend new record
                updated = [newRecord, ...prev].slice(0, 15); // Keep last 15
            }
            
            localStorage.setItem("virexHistory", JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { history, addActivity };
};
