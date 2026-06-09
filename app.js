const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth.route');
const menuRoutes = require('./routes/menu.route');
const menuCategoryRoutes = require('./routes/menuCategory.route');
const pesananRoutes = require('./routes/pesanan.route');
const pembayaranRoutes = require('./routes/pembayaran.route');
const tableRoutes = require('./routes/table.route');
const reservationRoutes = require('./routes/reservation.route');
const deliveryRoutes = require('./routes/delivery.route');
const exportRoutes = require('./routes/export.route');

// Register routes
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);
app.use('/menuCategories', menuCategoryRoutes);
app.use('/pesanan', pesananRoutes);
app.use('/pembayaran', pembayaranRoutes);
app.use('/tables', tableRoutes);
app.use('/reservations', reservationRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/export', exportRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({ message: 'Restoran API is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;