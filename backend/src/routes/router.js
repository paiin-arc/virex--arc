const express = require('express');
const router = express.Router();
const routingService = require('../services/routing');

// Quote endpoint
router.get('/quote', (req, res) => {
    const { source_chain, dest_chain, amount } = req.query;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    
    const quote = routingService.calculateQuote(parseFloat(amount));
    res.json(quote);
});

// Intent submission endpoint
router.post('/intent', (req, res) => {
    const intentData = req.body;
    if (!intentData.receiver || !intentData.amount) {
        return res.status(400).json({ error: 'Invalid intent data' });
    }
    
    const result = routingService.createIntent(intentData);
    res.json(result);
});

// Intent status endpoint
router.get('/intent/:id/status', (req, res) => {
    const status = routingService.getIntentStatus(req.params.id);
    if (!status) return res.status(404).json({ error: 'Intent not found' });
    
    res.json(status);
});

module.exports = router;
