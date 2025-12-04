import express from 'express';

const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', worker: true, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ message: 'Uvote Backend API on Cloudflare Workers', health: '/health' });
});

export default app;
