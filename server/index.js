const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
const deliveryProofDir = path.join(uploadsDir, 'delivery-proofs');
if (!fs.existsSync(deliveryProofDir)) {
  fs.mkdirSync(deliveryProofDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Routes
const categoryRoutes = require('./routes/categories');
const sellerRoutes = require('./routes/sellers');
const productRoutes = require('./routes/products');
const searchRoutes = require('./routes/search');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const sellerApplicationRoutes = require('./routes/sellerApplications');
const { router: authRoutes } = require('./routes/auth');
const sellerManagementRoutes = require('./routes/sellerManagement');
const { router: buyerAuthRoutes } = require('./routes/buyerAuth');
const buyerManagementRoutes = require('./routes/buyerManagement');
const { router: deliveryAuthRoutes } = require('./routes/deliveryAuth');
const deliveryManagementRoutes = require('./routes/deliveryManagement');

app.use('/api/categories', categoryRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller-applications', sellerApplicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/seller', sellerManagementRoutes);
app.use('/api/buyer-auth', buyerAuthRoutes);
app.use('/api/buyer', buyerManagementRoutes);
app.use('/api/delivery-auth', deliveryAuthRoutes);
app.use('/api/delivery', deliveryManagementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KudiMall API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🟢 KudiMall API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
