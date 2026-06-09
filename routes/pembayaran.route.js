const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const pembayaranController = require('../controllers/pembayaran.controller');

router.get('/my-payments', verifyToken, pembayaranController.getMyPembayaran);
router.get('/', verifyToken, pembayaranController.getPembayaran);
router.get('/check/:pesanan_id', verifyToken, pembayaranController.checkPembayaranByPesanan);
router.get('/:id', verifyToken, pembayaranController.detailPembayaran);
router.post('/', verifyToken, pembayaranController.createPembayaran);
router.post('/bulk', verifyToken, pembayaranController.createBulkPembayaran);
router.put('/:id/confirm', verifyToken, pembayaranController.confirmPayment);
router.put('/:id/status', verifyAdmin, pembayaranController.updatePaymentStatus);

router.get('/export/pdf', verifyToken, pembayaranController.exportPembayaranPdf);

module.exports = router;