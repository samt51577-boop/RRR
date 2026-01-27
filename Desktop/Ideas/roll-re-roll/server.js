require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handicapRoutes = require('./routes/handicapRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simplistic request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.static(__dirname)); // Serve static files from current directory

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', time: new Date().toISOString() });
});

// Mount routes
app.use('/api/handicaps', handicapRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Roll Re-Roll Server Running!`);
    console.log(`Endpoint: http://localhost:${PORT}`);
    console.log(`User: ${process.env.GHIN_USERNAME || 'Default'}`);
    console.log(`========================================`);
});

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
