import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Dashboard Summary & Analytics
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Check overdue first
    const now = new Date();
    await prisma.invoice.updateMany({
      where: {
        userId,
        status: { in: ['UNPAID', 'SENT'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
    const unpaidInvoices = invoices.filter((i) => ['UNPAID', 'SENT', 'DRAFT'].includes(i.status)).length;
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE').length;
    const partiallyPaidInvoices = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;

    const totalRevenue = Math.round(invoices.reduce((sum, i) => sum + i.amountPaid, 0) * 100) / 100;
    const pendingPayments = Math.round(invoices.reduce((sum, i) => sum + i.balanceDue, 0) * 100) / 100;
    const totalBilled = Math.round(invoices.reduce((sum, i) => sum + i.grandTotal, 0) * 100) / 100;

    // Recent 5 invoices
    const recentInvoices = invoices.slice(0, 6);

    // Monthly revenue breakdown for the past 6 months
    const monthlyMap = new Map<string, { month: string; billed: number; received: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, { month: label, billed: 0, received: 0 });
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key)!;
        item.billed = Math.round((item.billed + inv.grandTotal) * 100) / 100;
      }

      inv.payments.forEach((p) => {
        const pd = new Date(p.paymentDate);
        const pKey = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(pKey)) {
          const item = monthlyMap.get(pKey)!;
          item.received = Math.round((item.received + p.amount) * 100) / 100;
        }
      });
    });

    const monthlyRevenue = Array.from(monthlyMap.values());

    // Status distribution
    const statusDistribution = [
      { status: 'Paid', count: paidInvoices, color: '#10B981' },
      { status: 'Partially Paid', count: partiallyPaidInvoices, color: '#F59E0B' },
      { status: 'Unpaid / Sent', count: unpaidInvoices, color: '#3B82F6' },
      { status: 'Overdue', count: overdueInvoices, color: '#EF4444' },
    ];

    // Recent Activity feed
    const activities: Array<{
      id: string;
      type: 'invoice_created' | 'payment_received' | 'invoice_overdue';
      title: string;
      description: string;
      date: Date;
      amount?: number;
      currencySymbol?: string;
    }> = [];

    invoices.forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'invoice_created',
        title: `Invoice ${inv.invoiceNumber} created`,
        description: `Billed ${inv.currencySymbol}${inv.grandTotal.toLocaleString()} to ${inv.clientName || 'Client'}`,
        date: inv.createdAt,
        amount: inv.grandTotal,
        currencySymbol: inv.currencySymbol,
      });

      inv.payments.forEach((p) => {
        activities.push({
          id: `pay-${p.id}`,
          type: 'payment_received',
          title: `Payment received for ${inv.invoiceNumber}`,
          description: `Received ${inv.currencySymbol}${p.amount.toLocaleString()} via ${p.paymentMethod}`,
          date: p.paymentDate,
          amount: p.amount,
          currencySymbol: inv.currencySymbol,
        });
      });
    });

    // Sort recent activity descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentActivity = activities.slice(0, 6);

    res.json({
      metrics: {
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        partiallyPaidInvoices,
        totalRevenue,
        pendingPayments,
        totalBilled,
      },
      recentInvoices,
      monthlyRevenue,
      statusDistribution,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard metrics.' });
  }
});

export default router;

