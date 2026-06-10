const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');

// Import controllers
const pesananController = require('../controllers/pesanan.controller');

// Pesanan PDF only
router.get('/pesanan/pdf', verifyToken, pesananController.exportPesananPdf);

module.exports = router;