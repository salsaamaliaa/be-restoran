const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const pesananController = require('../controllers/pesanan.controller');
const exportController = require('../controllers/export.controller');

router.get('/', verifyToken, pesananController.getPesanan);
router.post('/', verifyToken, pesananController.createPesanan);
router.put('/:id/status', verifyToken, pesananController.updateStatusPesanan);
router.put('/:id/meja', verifyToken, pesananController.updateNomorMeja);
router.delete('/:id', verifyToken, pesananController.deletePesanan);

router.get('/export/pdf', verifyToken, exportController.exportPDF);

module.exports = router;