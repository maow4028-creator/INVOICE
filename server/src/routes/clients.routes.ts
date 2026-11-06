import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// List all clients for user with aggregates
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      include: {
        invoices: {
          select: {
            id: true,
            grandTotal: true,
            amountPaid: true,
            balanceDue: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enrichedClients = clients.map((client) => {
      const totalInvoices = client.invoices.length;
      const totalBilled = client.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalPaid = client.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalPending = client.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

      const { invoices, ...rest } = client;
      return {
        ...rest,
        totalInvoices,
        totalBilled,
        totalPaid,
        totalPending,
      };
    });

    res.json({ clients: enrichedClients });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Failed to fetch clients.' });
  }
});

// Create client
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessName,
      name,
      email,
      phone,
      billingAddress,
      shippingAddress,
      gstin,
      pan,
      notes,
    } = req.body;

    if (!name && !businessName) {
      res.status(400).json({ message: 'Client name or business name is required.' });
      return;
    }

    const client = await prisma.client.create({
      data: {
        userId: req.userId!,
        businessName: businessName?.trim() || '',
        name: name?.trim() || businessName?.trim() || 'Valued Client',
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        billingAddress: billingAddress?.trim() || '',
        shippingAddress: shippingAddress?.trim() || '',
        gstin: gstin?.trim() || '',
        pan: pan?.trim() || '',
        notes: notes?.trim() || '',
      },
    });

    res.status(201).json({ message: 'Client created successfully.', client });
  } catch (error: any) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Failed to create client.' });
  }
});

// Get single client with full invoice history
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: { id, userId: req.userId },
      include: {
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
      },
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found.' });
      return;
    }

    const totalBilled = client.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = client.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const balanceDue = client.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    // Extract all payments across client's invoices
    const allPayments = client.invoices.flatMap((inv) =>
      inv.payments.map((p) => ({
        ...p,
        invoiceNumber: inv.invoiceNumber,
      }))
    );

    res.json({
      client,
      stats: {
        totalInvoices: client.invoices.length,
        totalBilled,
        totalPaid,
        balanceDue,
      },
      paymentHistory: allPayments,
    });
  } catch (error: any) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ message: 'Failed to fetch client details.' });
  }
});

// Update client
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      businessName,
      name,
      email,
      phone,
      billingAddress,
      shippingAddress,
      gstin,
      pan,
      notes,
    } = req.body;

    const existing = await prisma.client.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Client not found.' });
      return;
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        businessName: businessName !== undefined ? businessName.trim() : undefined,
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        billingAddress: billingAddress !== undefined ? billingAddress.trim() : undefined,
        shippingAddress: shippingAddress !== undefined ? shippingAddress.trim() : undefined,
        gstin: gstin !== undefined ? gstin.trim() : undefined,
        pan: pan !== undefined ? pan.trim() : undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
      },
    });

    res.json({ message: 'Client updated successfully.', client: updated });
  } catch (error: any) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Failed to update client.' });
  }
});

// Delete client
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.client.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Client not found.' });
      return;
    }

    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Failed to delete client.' });
  }
});

export default router;

