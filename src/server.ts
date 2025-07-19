import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();
import { setupDiscordNamespace } from './namespaces/discordNamespace';
import { DiscordBot } from './services/discordBot.service';
import { createHealthRouter } from './routes/health.route';
import { setupGlobalErrorHandlers } from './middleware/errorHandler';
import authRouter from './routes/auth.route';


// Create Express app
const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Socket.IO Server configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: parseInt(process.env['SOCKET_PING_TIMEOUT'] || '60000'),
  pingInterval: parseInt(process.env['SOCKET_PING_INTERVAL'] || '25000'),
  upgradeTimeout: 30000,
  maxHttpBufferSize: parseInt(process.env['SOCKET_MAX_HTTP_BUFFER_SIZE'] || '1000000'),
  allowEIO3: true
});


//Routes configuration
app.use('/api', createHealthRouter(io));
app.use('/api/auth', authRouter);

// Basic route for testing
app.get('/', (_req, res) => {
  res.json({
    message: 'Discord Stream Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
  _next()
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize services and start server
async function initialize() {
  try {
    const discordNamespace = io.of('/discord')
    console.log('🚀 Initializing Discord Stream Backend...');


    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize Discord bot
    const discordBot = new DiscordBot(discordNamespace)
    const botToken = process.env['DISCORD_BOT_TOKEN'];

    if (!botToken) {
      console.warn('⚠️  No Discord bot token provided. Bot functionality will be disabled.');
    } else {
      await discordBot.initialize(botToken);
      console.log('✅ Discord bot initialized');
    }

    // Setup Socket.IO namespaces
    setupDiscordNamespace(discordNamespace, discordBot);

    // Start server
    const PORT = parseInt(process.env['PORT'] || '3001');
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready`);
      console.log(`🔗 Frontend URL: ${process.env['FRONTEND_URL'] || "http://localhost:3000"}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
      console.log(`📈 Status: http://localhost:${PORT}/api/status`);
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
initialize(); 