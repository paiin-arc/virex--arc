const config = require('../config');

const generateExplorerUrl = (chainId, txHash) => {
    let baseUrl;

    switch (chainId) {
        case 11155111: // ETH Sepolia
            baseUrl = config.explorers.eth;
            break;
        case 421614:  // ARB Sepolia
            baseUrl = config.explorers.arb;
            break;
        case 80002:   // POL Amoy
            baseUrl = config.explorers.pol;
            break;
        case 100:     // Arc Testnet Placeholder
            baseUrl = config.explorers.arc;
            break;
        default:
            baseUrl = config.explorers.eth;
    }

    return `${baseUrl}/tx/${txHash}`;
};

module.exports = { generateExplorerUrl };
