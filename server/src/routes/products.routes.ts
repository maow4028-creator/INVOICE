import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// List products
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });
    res.json({ products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// Create product
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, unitPrice, defaultTax, type } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Product or Service name is required.' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        description: description?.trim() || '',
        unitPrice: parseFloat(unitPrice) || 0,
        defaultTax: parseFloat(defaultTax) || 0,
        type: type === 'Product' ? 'Product' : 'Service',
      },
    });

    res.status(201).json({ message: 'Product / Service created successfully.', product });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

// Update product
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, unitPrice, defaultTax, type } = req.body;

    const existing = await prisma.product.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) || 0 : undefined,
        defaultTax: defaultTax !== undefined ? parseFloat(defaultTax) || 0 : undefined,
        type: type !== undefined ? (type === 'Product' ? 'Product' : 'Service') : undefined,
      },
    });

    res.json({ message: 'Product updated successfully.', product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

export default router;

