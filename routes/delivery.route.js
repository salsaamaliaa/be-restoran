const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin, verifyDriver } = require('../middlewares/auth');
const deliveryController = require('../controllers/delivery.controller');

router.get('/', verifyToken, deliveryController.getOrders);
router.get('/drivers', verifyAdmin, deliveryController.getAllDrivers);
router.post('/', verifyToken, deliveryController.createOrder);
router.put('/:id/assign', verifyAdmin, deliveryController.assignDriver);
// Driver bisa update status (on_delivery, delivered), admin bisa semua
router.put('/:id/status', verifyDriver, deliveryController.updateOrderStatus);
router.get('/export/pdf', verifyToken, deliveryController.exportDeliveryPdf);

module.exports = router;