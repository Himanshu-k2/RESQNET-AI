import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedInitialData } from './config/seedData.js';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration supporting local dev, mobile testing, and deployed origins
const allowedOrigins = process.env.CLIENT_URL || process.env.CORS_ORIGIN;
const originList = allowedOrigins
  ? allowedOrigins.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Localhost or 127.0.0.1
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Local network IPs for mobile testing (192.168.x.x, 10.x.x.x, 172.x.x.x)
      if (/^https?:\/\/(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./.test(origin)) {
        return callback(null, true);
      }

      // Configured production client URLs
      if (originList.includes(origin) || originList.includes('*')) {
        return callback(null, true);
      }

      // Fallback: allow origin to support deployed frontends
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'RESQNET AI Backend API',
    phase: 'Phase 6: Simulation Mode & Community Safety Network Active',
    aiProvider: process.env.GEMINI_API_KEY ? 'Google Gemini API' : 'Rule-based Heuristic Fallback Engine',
    model: process.env.AI_MODEL || 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 RESQNET AI Server running on PORT: ${PORT}`);
      console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
      console.log(`🧠 AI Endpoints: http://localhost:${PORT}/api/ai/*`);
      console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics/overview`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
