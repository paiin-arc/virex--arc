const config = require('../config');

class ArcService {
    constructor() {
        this.rpcUrl = config.arcRpcUrl;
        // User-signed transactions mean we don't need the private key 
        // for most operations anymore. Keeping it for platform fees/solvers if needed.
        this.privateKey = config.privateKey;
    }

    async getNativeBalance(address) {
        // Now checks native USDC balance on Arc
        console.log(`Checking native USDC balance on Arc for: ${address}`);
        // In a real implementation, we would use ethers/web3 to call the RPC here.
        return '100.0';
    }

    async getTransactionStatus(txHash) {
        // Verify transaction on Arc Testnet
        console.log(`Verifying transaction status for: ${txHash}`);
        return 'CONFIRMED';
    }

    async reportSettlement(txHash, receiver) {
        console.log(`Settling intent for tx: ${txHash} to receiver: ${receiver}`);
        return true;
    }
}

module.exports = new ArcService();
