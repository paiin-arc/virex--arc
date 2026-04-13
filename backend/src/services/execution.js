const { AppKit } = require('@circle-fin/app-kit');
const { createViemAdapterFromPrivateKey } = require('@circle-fin/adapter-viem-v2');
const { ethers } = require('ethers');
const config = require('../config');

class ExecutionService {
    constructor() {
        if (!config.privateKey) {
            throw new Error("[EXECUTION] Missing PRIVATE_KEY in configuration.");
        }

        // Initialize Viem Adapter
        this.viemAdapter = createViemAdapterFromPrivateKey({
            privateKey: config.privateKey
        });

        // Initialize App Kit
        this.kit = new AppKit();
        
        // USDC Addresses for verification
        this.usdcAddresses = {
            'ethereum': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
            'arbitrum': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arb Sepolia
            'avalanche': '0x5425890298aed601595a70AB815c96711a31Bc65', // Fuji
            'arc': '0x3600000000000000000000000000000000000000' // Arc native representation
        };

        console.log("[EXECUTION] App Kit initialized with Viem adapter.");
    }

    /**
     * Calculates fee and bridge amounts with USDC precision (6 decimals)
     * @param {number|string} amount Input amount
     * @returns {{fee: string, bridgeAmount: string}}
     */
    calculateAmounts(amount) {
        const amountWei = ethers.parseUnits(amount.toString(), 6);
        const feeWei = (amountWei * 2n) / 100n; // Use BigInt for 2%
        const bridgeAmountWei = amountWei - feeWei;

        return {
            fee: ethers.formatUnits(feeWei, 6),
            bridgeAmount: ethers.formatUnits(bridgeAmountWei, 6)
        };
    }

    /**
     * Executes a cross-chain USDC bridge using Arc App Kit
     * @param {string} from Internal chain name
     * @param {string} to Internal chain name
     * @param {string|number} amount Original amount
     * @param {string} recipient Destination address
     */
    async bridge(from, to, amount, recipient) {
        const { fee, bridgeAmount } = this.calculateAmounts(amount);
        const fromChain = config.chains[from];
        const toChain = config.chains[to];

        if (!fromChain || !toChain) {
            throw new Error(`[EXECUTION] Invalid chain mapping: ${from} -> ${fromChain}, ${to} -> ${toChain}`);
        }

        console.log(`[EXECUTION] Original: ${amount}, Fee: ${fee}, Bridging: ${bridgeAmount}`);
        console.log(`[EXECUTION] Dest: ${toChain}, Recipient: ${recipient}`);

        try {
            const result = await this.kit.bridge({
                from: { 
                    adapter: this.viemAdapter, 
                    chain: fromChain 
                },
                to: { 
                    adapter: this.viemAdapter, 
                    chain: toChain,
                    recipientAddress: recipient
                },
                amount: bridgeAmount, // Bridging the NET amount
            });

            console.log("[EXECUTION] Bridge result received:", JSON.stringify(result, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value, 2));
            
            // Extract hashes from steps for reliability
            const sourceTxHash = result.steps?.find(s => s.name === "burn")?.txHash || result.sourceTxHash || null;
            const mintTxHash = result.steps?.find(s => s.name === "mint")?.txHash || result.destinationTxHash || null;
            
            return {
                sourceTxHash,
                destinationTxHash: mintTxHash,
                status: 'bridging'
            };
        } catch (error) {
            console.error("[EXECUTION] Bridge failed:", error);
            throw error;
        }
    }

    /**
     * Verifies USDC minting on the destination chain
     * @param {string} chain Chain name ('ethereum', 'arbitrum', etc.)
     * @param {string} txHash Mint transaction hash
     * @param {string} recipient User address
     * @param {number} expectedAmount Human-readable amount
     */
    async verifyMintStatus(chain, txHash, recipient, expectedAmount) {
        if (!txHash) return false;

        const rpcUrl = config[`${chain}RpcUrl`] || config.arcRpcUrl;
        if (!rpcUrl) {
            console.error(`[VERIFY] No RPC URL found for chain: ${chain}`);
            return false;
        }

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status !== 1) {
                console.log(`[VERIFY] Receipt not found or failed for tx: ${txHash}`);
                return false;
            }

            // Transfer(address from, address to, uint256 value)
            const transferEventHash = ethers.id("Transfer(address,address,uint256)");
            const usdcAddress = this.usdcAddresses[chain];

            const transferLog = receipt.logs.find(log => {
                const isTransfer = log.topics[0] === transferEventHash;
                const matchesUSDC = usdcAddress ? (log.address.toLowerCase() === usdcAddress.toLowerCase()) : true;
                
                // Decode recipient (topic 2 for indexed 'to' in standard ERC20)
                const toAddress = ethers.AbiCoder.defaultAbiCoder().decode(['address'], log.topics[2])[0];
                const matchesRecipient = toAddress.toLowerCase() === recipient.toLowerCase();

                return isTransfer && matchesUSDC && matchesRecipient;
            });

            if (transferLog) {
                const value = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], transferLog.data)[0];
                const expectedValueBase = ethers.parseUnits(expectedAmount.toString(), 6); // USDC uses 6 decimals

                // Verification check
                const confirmed = value === expectedValueBase;
                
                if (confirmed) {
                    console.log({
                        mintTx: txHash,
                        recipient: recipient,
                        amount: expectedAmount,
                        verified: true
                    });
                } else {
                    console.warn(`[VERIFY] Amount mismatch! Log: ${value.toString()}, Expected: ${expectedValueBase.toString()}`);
                }

                return confirmed;
            }

            console.warn(`[VERIFY] No USDC Transfer log found for recipient ${recipient} in tx ${txHash}`);
            return false;

        } catch (error) {
            console.error(`[VERIFY] Verification failed for tx ${txHash}:`, error.message);
            return false;
        }
    }
}

module.exports = new ExecutionService();
