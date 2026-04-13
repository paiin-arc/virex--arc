const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes/router');

const app = express();

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`Virex Backend running at http://localhost:${PORT}`);
    console.log('Press CTRL+C to stop');
});
