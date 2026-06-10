const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middlewares/auth');
const tableController = require('../controllers/table.controller');

router.get('/', tableController.getTables);
router.post('/', verifyAdmin, tableController.createTable);
router.put('/:id', verifyAdmin, tableController.updateTable);
router.delete('/:id', verifyAdmin, tableController.deleteTable);

module.exports = router;