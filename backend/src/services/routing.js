const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const arc = require('./arc');
const execution = require('./execution');

const intents_db = new Map();

class RoutingService {
    calculateQuote(amount) {
        const { fee, bridgeAmount } = execution.calculateAmounts(amount);
        return {
            original_amount: amount.toFixed(6),
            receive_amount: bridgeAmount,
            network_fee: fee,
            estimated_time_seconds: 45,
            solver_available: true
        };
    }

    createIntent(intentData) {
        const intent_id = uuidv4();
        const { fee, bridgeAmount } = execution.calculateAmounts(intentData.amount);
        const newIntent = {
            id: intent_id,
            input: intentData,
            amount_breakdown: {
                original: intentData.amount,
                fee: fee,
                bridge: bridgeAmount
            },
            status: 'pending',
            user_deposit_hash: intentData.user_deposit_hash || null,
            sourceTxHash: null,
            destinationTxHash: null,
            created_at: Date.now()
        };
        intents_db.set(intent_id, newIntent);
        
        console.log(`[ROUTING] New intent created: ${intent_id}. Triggering execution...`);
        
        // Start real bridging execution in the background
        this.processExecution(intent_id, intentData);
        
        return { intent_id, status: 'pending' };
    }

    async processExecution(intentId, data) {
        const intent = intents_db.get(intentId);
        if (!intent) return;

        try {
            intent.status = 'executing';
            console.log(`[EXECUTION] Processing intent ${intentId}...`);

            // Execute bridge via Arc App Kit
            const result = await execution.bridge(
                data.source_chain || 'arc',
                data.dest_chain || 'ethereum',
                data.amount,
                data.receiver
            );

            intent.sourceTxHash = result.sourceTxHash;
            intent.destinationTxHash = result.destinationTxHash;
            intent.status = 'bridging';

            console.log(`[EXECUTION] Bridge initiated for ${intentId}. Source Hash: ${intent.sourceTxHash}`);

            // If destinationTxHash is already present (unlikely for many bridges), complete it
            // Otherwise, we would poll here. For App Kit, it usually waits for completion or gives a way to track.
            // Simplified: If we have a destination hash, it's completed. 
            if (intent.destinationTxHash) {
                intent.status = 'completed';
            } else {
                // Background polling simulation (In production, App Kit or a webhook would handle this)
                this.pollForCompletion(intentId);
            }

        } catch (error) {
            console.error(`[EXECUTION] Intent ${intentId} failed:`, error);
            intent.status = 'failed';
            intent.error_message = error.message;
        }
    }

    async pollForCompletion(intentId) {
        const intent = intents_db.get(intentId);
        if (!intent || intent.status !== 'bridging') return;

        console.log(`[POLLING] Waiting for destination confirmation for ${intentId}...`);
        
        // Polling loop for CCTP completion (approx 15-30s on testnet)
        const pollInterval = setInterval(async () => {
            if (intent.status !== 'bridging' || !intent.destinationTxHash) return;
            
            const { bridgeAmount } = execution.calculateAmounts(intent.input.amount);

            const isVerified = await execution.verifyMintStatus(
                intent.input.dest_chain || 'ethereum',
                intent.destinationTxHash,
                intent.input.receiver,
                bridgeAmount
            );

            if (isVerified) {
                console.log(`[VERIFY] Intent ${intentId} confirmed on destination.`);
                intent.status = 'completed';
                clearInterval(pollInterval);
            } else {
                 console.log(`[VERIFY] Still awaiting on-chain confirmation for ${intentId}...`);
            }
        }, 5000);

        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            if (intent.status === 'bridging') {
                console.error(`[VERIFY] Intent ${intentId} timed out during bridging.`);
                intent.status = 'failed';
                intent.error_message = "Verification timeout: Bridge transaction not confirmed on-chain.";
            }
        }, 300000);
    }

    getIntentStatus(intent_id) {
        const intent = intents_db.get(intent_id);
        if (!intent) return null;

        return { 
            intent_id, 
            status: intent.status,
            error: intent.error_message,
            input: intent.input,
            amounts: intent.amount_breakdown, // Expose fee breakdown
            user_deposit_hash: intent.user_deposit_hash,
            sourceTxHash: intent.sourceTxHash,
            destinationTxHash: intent.destinationTxHash,
            explorerUrls: {
                source: this.getExplorerLink(intent.input.source_chain || 'arc', intent.sourceTxHash),
                destination: this.getExplorerLink(intent.input.dest_chain || 'ethereum', intent.destinationTxHash)
            }
        };
    }

    getExplorerLink(chain, hash) {
        if (!hash) return null;
        const base = config.explorers[chain] || 'https://etherscan.io';
        return `${base}/tx/${hash}`;
    }
}

module.exports = new RoutingService();
