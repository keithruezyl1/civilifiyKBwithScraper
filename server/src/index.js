import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import kbRouter from './routes/kb.js';
import chatRouter from './routes/chat.js';
import authRouter from './routes/auth.js';
import plansRouter from './routes/plans.js';
import notificationsRouter from './routes/notifications.js';
import scrapingRouter from './routes/scraping.js';
import setupDatabase from './setup-db.js';

const app = express();

// Temporarily allow all origins to fix CORS issue
app.use(cors({ 
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] 
}));
app.use(bodyParser.json({ limit: '2mb' }));

// Authentication middleware removed - no login required

// Public routes (no authentication required)
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);

// All routes are now public (no authentication required)
app.use('/api/kb', kbRouter);
app.use('/api/chat', chatRouter);
app.use('/api/plans', plansRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/scraping', scrapingRouter);

const port = process.env.PORT || 4000;

// Start server with database setup
async function startServer() {
  try {
    console.log('Starting server setup...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('PGSSL:', process.env.PGSSL);
    console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
    console.log('CORS: Allowing all origins');
    
    // Run database setup first
    console.log('Running database setup...');
    await setupDatabase();
    console.log('Database setup completed successfully');
    
    // Then start the server
    app.listen(port, () => {
      console.log(`KB Vector Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();



