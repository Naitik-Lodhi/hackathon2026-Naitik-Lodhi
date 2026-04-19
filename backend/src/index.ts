import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import ticketRoutes from './routes/ticketRoutes';
import { runMigrations } from './db/migrate';
import { startAgent } from './services/ticketService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', ticketRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'ShopWave Agent API is running', 
    endpoints: {
      health: '/health',
      tickets: '/api'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start app
const init = async () => {
    try {
        console.log('Running database migrations...');
        await runMigrations();
        
        console.log('Starting autonomous agent poller...');
        startAgent();
        
        app.listen(PORT, () => {
            console.log(`Backend server running on port ${PORT}`);
        });
    } catch(err) {
        console.error('Failed to initialize application', err);
        process.exit(1);
    }
}

init();
 
 
 
 
