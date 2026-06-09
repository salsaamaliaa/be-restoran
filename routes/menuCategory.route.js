const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const menuCategoryController = require('../controllers/menuCategory.controller');

router.get('/', menuCategoryController.getCategories);
router.post('/', verifyAdmin, menuCategoryController.createCategory);
router.put('/:id', verifyAdmin, menuCategoryController.updateCategory);
router.delete('/:id', verifyAdmin, menuCategoryController.deleteCategory);

module.exports = router;