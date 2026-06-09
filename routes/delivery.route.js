const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin, verifyDriver } = require('../middlewares/auth');
const deliveryController = require('../controllers/delivery.controller');

router.get('/', verifyToken, deliveryController.getOrders);
router.get('/my-deliveries', verifyToken, deliveryController.getMyDeliveries);
router.get('/drivers', verifyAdmin, deliveryController.getAllDrivers);
router.get('/:id', verifyToken, deliveryController.detailOrder);
router.post('/', verifyToken, deliveryController.createOrder);
router.put('/:id/status', verifyAdmin, deliveryController.updateOrderStatus);
router.put('/:id/assign', verifyAdmin, deliveryController.assignDriver);
router.put('/:id/take', verifyToken, deliveryController.takeOrder);
router.put('/:id/complete', verifyToken, deliveryController.completeDelivery);

router.get('/export/pdf', verifyToken, deliveryController.exportOrdersPdf);

module.exports = router;