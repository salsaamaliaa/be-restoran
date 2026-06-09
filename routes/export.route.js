const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const exportController = require('../controllers/export.controller');
const pembayaranController = require('../controllers/pembayaran.controller');
const deliveryController = require('../controllers/delivery.controller');
const reservationController = require('../controllers/reservation.controller');

// Pesanan exports
router.get('/pesanan/pdf', verifyToken, exportController.exportPDF);

// Pembayaran exports
router.get('/pembayaran/pdf', verifyToken, pembayaranController.exportPembayaranPdf);

// Delivery exports
router.get('/delivery/pdf', verifyToken, deliveryController.exportOrdersPdf);

// Reservation exports
router.get('/reservations/pdf', verifyToken, reservationController.exportReservationsPdf);

module.exports = router;