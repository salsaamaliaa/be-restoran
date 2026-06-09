const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const reservationController = require('../controllers/reservation.controller');

router.get('/', verifyToken, reservationController.getReservations);
router.post('/', verifyToken, reservationController.createReservation);
router.put('/:id/status', verifyToken, reservationController.updateReservationStatus);

router.get('/export/pdf', verifyToken, reservationController.exportReservationsPdf);

module.exports = router;