require('dotenv').config();

const config = {
    port: process.env.PORT || 8000,
    circleApiKey: process.env.CIRCLE_API_KEY || '',
    kitKey: process.env.KIT_KEY || '',
    privateKey: process.env.PRIVATE_KEY || '',
    arcRpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
    ethRpcUrl: process.env.ETH_RPC_URL || '',
    arbitrumRpcUrl: process.env.ARBITRUM_RPC_URL || '',
    polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
    feePercentage: 0.02,
    feeFlat: 0, // Flat fee removed for 2% model
    minTransferAmount: 1.0, 
    explorers: {
        ethereum: process.env.EXPLORER_BASE_URL_ETH || 'https://sepolia.etherscan.io',
        arbitrum: process.env.EXPLORER_BASE_URL_ARB || 'https://sepolia.arbiscan.io',
        avalanche: process.env.EXPLORER_BASE_URL_AVAX || 'https://testnet.snowscan.xyz',
        arc: process.env.EXPLORER_BASE_URL_ARC || 'https://testnet.arcscan.app'
    },
    // App Kit chain mapping
    chains: {
        arc: 'Arc_Testnet',
        ethereum: 'Ethereum_Sepolia',
        arbitrum: 'Arbitrum_Sepolia',
        avalanche: 'Avalanche_Fuji'
    }
};

// Simple validation
const requiredKeys = ['circleApiKey', 'privateKey', 'kitKey'];
requiredKeys.forEach(key => {
    if (!config[key] && process.env.NODE_ENV === 'production') {
        console.warn(`WARNING: Missing required config key: ${key}`);
    }
});

module.exports = config;
