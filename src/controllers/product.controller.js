import Product from '../models/product.model.js';
import { invalidateCache } from '../middlewares/cache.middleware.js';

// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE product → clear list cache
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await invalidateCache('/api/products'); // List is now stale
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE product → clear list + single cache
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await invalidateCache('/api/products');               // Clear list
    await invalidateCache(`/api/products/${req.params.id}`); // Clear single

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE product → clear list + single cache
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    await invalidateCache('/api/products');
    await invalidateCache(`/api/products/${req.params.id}`);

    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};