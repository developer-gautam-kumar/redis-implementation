import express from 'express';
import cacheMiddleware from '../middlewares/cache.middleware.js';
import protect from '../middlewares/auth.middleware.js';
import {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct
} from '../controllers/product.controller.js';

const router = express.Router();

// Public routes — responses are cached
router.get('/',     cacheMiddleware(120), getProducts);      // cached 2 min
router.get('/:id',  cacheMiddleware(120), getProductById);   // cached 2 min

// Protected routes — require login
router.post('/',        protect, createProduct);
router.put('/:id',      protect, updateProduct);
router.delete('/:id',   protect, deleteProduct);

export default router;