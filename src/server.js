const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Import routes
const productRoutes = require('./routes/products');
const variantRoutes = require('./routes/variants');
const colorRoutes = require('./routes/colors');
const styleRoutes = require('./routes/styles');
const collectionRoutes = require('./routes/collections');
const brandRoutes = require('./routes/brands');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/variants`, variantRoutes);
app.use(`/api/${API_VERSION}/colors`, colorRoutes);
app.use(`/api/${API_VERSION}/styles`, styleRoutes);
app.use(`/api/${API_VERSION}/collections`, collectionRoutes);
app.use(`/api/${API_VERSION}/brands`, brandRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Unique constraint violation',
      message: 'A record with this data already exists.'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      message: 'The requested record does not exist.'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`🚀 Fashion Ecommerce API is running on port ${PORT}`);
//   console.log(`📚 API Documentation: http://localhost:${PORT}/api/${API_VERSION}`);
//   console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
// });

module.exports = app;
