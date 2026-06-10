const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const pembayaranController = require('../controllers/pembayaran.controller');

router.get('/my-payments', verifyToken, pembayaranController.getMyPembayaran);
router.get('/', verifyToken, pembayaranController.getPembayaran);
router.get('/:id', verifyToken, pembayaranController.detailPembayaran);
router.post('/', verifyToken, pembayaranController.createPembayaran);
router.put('/:id/confirm', verifyToken, pembayaranController.confirmPayment);

module.exports = router;