import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { sequelize } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting (stricter defaults; customizable via envs)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW_MS || String(15 * 60 * 1000)),
  max: parseInt(process.env.RATE_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    detail: 'Rate limit exceeded. Please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(compression());
// CORS: restrict to configured frontend URL; dev fallback only when unset
const allowedOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined);
app.use(cors({
  origin: (origin, callback) => {
    if (!allowedOrigin) {
      return callback(new Error('CORS not configured: FRONTEND_URL is required in non-dev environments'));
    }
    if (!origin || origin === allowedOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ force: false });
      console.log('📊 Database synchronized');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;