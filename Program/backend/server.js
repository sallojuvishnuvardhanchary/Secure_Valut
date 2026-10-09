import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { getEnvDiagnostics } from './config/loadEnv.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import credentialRoutes from './routes/credentialRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting credentials from frontend Vite dev server
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Safe environment diagnostics endpoint (reports ONLY boolean configured status, never reveals secrets)
app.get('/api/diagnostic', (req, res) => {
  const diag = getEnvDiagnostics();
  res.status(200).json({
    status: 'ok',
    envFileExists: diag.envFileExists,
    loadedFrom: diag.loadedPath,
    smtpConfigured: diag.allConfigured,
    variables: {
      GMAIL_USER: {
        configured: diag.variables.GMAIL_USER.configured,
        isPlaceholder: diag.variables.GMAIL_USER.isPlaceholder,
      },
      GMAIL_APP_PASSWORD: {
        configured: diag.variables.GMAIL_APP_PASSWORD.configured,
        isPlaceholder: diag.variables.GMAIL_APP_PASSWORD.isPlaceholder,
        hasExpectedLength: diag.variables.GMAIL_APP_PASSWORD.hasExpectedAppPasswordLength,
      },
    },
    message: diag.allConfigured
      ? 'Gmail SMTP environment variables are properly configured.'
      : 'Gmail SMTP environment variables are missing or incomplete in backend/.env.',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/users', userRoutes);

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  const diag = getEnvDiagnostics();
  console.log(`[SecureVault Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[SecureVault Server] Health check available at http://localhost:${PORT}/api/health`);
  console.log(`[SecureVault Server] Diagnostics available at http://localhost:${PORT}/api/diagnostic`);
  console.log(
    `[Email Diagnostics] GMAIL_USER: ${diag.variables.GMAIL_USER.configured ? 'Configured' : 'NOT Configured (empty/placeholder)'} | GMAIL_APP_PASSWORD: ${diag.variables.GMAIL_APP_PASSWORD.configured ? `Configured (${diag.variables.GMAIL_APP_PASSWORD.length} chars)` : 'NOT Configured (empty/placeholder)'}`
  );
});
