const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const menuController = require('../controllers/menu.controller');

router.get('/', menuController.getMenus);
router.get('/:id', menuController.detailMenu);
router.post('/', verifyAdmin, upload.single('image'), menuController.createMenu);
router.put('/:id', verifyAdmin, upload.single('image'), menuController.updateMenu);
router.delete('/:id', verifyAdmin, menuController.deleteMenu);

module.exports = router;