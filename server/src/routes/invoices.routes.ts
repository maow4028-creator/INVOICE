import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to check and mark overdue invoices
const checkAndUpdateOverdue = async (userId: string) => {
  const now = new Date();
  await prisma.invoice.updateMany({
    where: {
      userId,
      status: { in: ['UNPAID', 'SENT'] },
      dueDate: { lt: now },
    },
    data: {
      status: 'OVERDUE',
    },
  });
};

// Helper to compute line and grand totals accurately
const calculateInvoiceTotals = (
  items: Array<{
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    discount?: number;
  }>,
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue: number = 0,
  shipping: number = 0,
  additionalCharges: number = 0,
  amountPaid: number = 0
) => {
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxRate = Number(item.taxPercentage) || 0;
    const itemDiscount = Number(item.discount) || 0;

    const baseAmount = Math.max(0, qty * price - itemDiscount);
    const itemTax = (baseAmount * taxRate) / 100;
    const lineTotal = Math.round((baseAmount + itemTax) * 100) / 100;

    subtotal += Math.round(baseAmount * 100) / 100;
    taxTotal += Math.round(itemTax * 100) / 100;

    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      taxPercentage: taxRate,
      discount: itemDiscount,
      total: lineTotal,
      sortOrder: index,
    };
  });

  // Calculate invoice-level discount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Math.round(((subtotal * (Number(discountValue) || 0)) / 100) * 100) / 100;
  } else {
    discountAmount = Math.round((Number(discountValue) || 0) * 100) / 100;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const ship = Math.round((Number(shipping) || 0) * 100) / 100;
  const extra = Math.round((Number(additionalCharges) || 0) * 100) / 100;

  const grandTotal = Math.round(Math.max(0, subtotal - discountAmount + taxTotal + ship + extra) * 100) / 100;
  const paid = Math.round((Number(amountPaid) || 0) * 100) / 100;
  const balanceDue = Math.round(Math.max(0, grandTotal - paid) * 100) / 100;

  return {
    subtotal,
    taxTotal,
    discountAmount,
    grandTotal,
    amountPaid: paid,
    balanceDue,
    processedItems,
  };
};

// Get Next Invoice Number
router.get('/next-number', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    });

    const prefix = settings?.invoicePrefix || 'INV-2026-';
    const nextNum = settings?.nextInvoiceNumber || 1001;

    res.json({
      prefix,
      nextNumber: nextNum,
      formattedInvoiceNumber: `${prefix}${nextNum}`,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to generate next invoice number.' });
  }
});

// List Invoices with Filter, Search, Pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    await checkAndUpdateOverdue(userId);

    const {
      status,
      search,
      clientId,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = { userId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { clientName: { contains: q } },
        { clientEmail: { contains: q } },
        { businessName: { contains: q } },
      ];
    }

    const orderBy: any = {};
    if (['invoiceDate', 'dueDate', 'grandTotal', 'createdAt', 'invoiceNumber'].includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          items: true,
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error: any) {
    console.error('Error listing invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices.' });
  }
});

// Get Single Invoice
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        client: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    res.json({ invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Failed to fetch invoice.' });
  }
});

// Create Invoice
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      invoiceNumber,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientGstin,
      clientPan,
      businessName,
      businessLogo,
      businessEmail,
      businessPhone,
      businessAddress,
      businessGstin,
      businessPan,
      bankDetails,
      upiId,
      invoiceDate,
      dueDate,
      paymentTerms,
      currency,
      currencySymbol,
      status,
      template,
      accentColor,
      fontFamily,
      items = [],
      discountType,
      discountValue,
      shipping,
      additionalCharges,
      amountPaid = 0,
      notes,
      terms,
      paymentInstructions,
      thankYouMessage,
    } = req.body;

    if (!invoiceNumber) {
      res.status(400).json({ message: 'Invoice number is required.' });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'At least one item is required.' });
      return;
    }

    // Check duplicate invoice number
    const existingInv = await prisma.invoice.findFirst({
      where: { userId, invoiceNumber: invoiceNumber.trim() },
    });
    if (existingInv) {
      res.status(400).json({ message: `Invoice number '${invoiceNumber}' already exists.` });
      return;
    }

    // Calculate totals
    const calculated = calculateInvoiceTotals(
      items,
      discountType || 'percentage',
      discountValue || 0,
      shipping || 0,
      additionalCharges || 0,
      amountPaid || 0
    );

    // Determine initial status if not explicitly provided
    let invoiceStatus = status || 'UNPAID';
    if (calculated.balanceDue <= 0 && calculated.grandTotal > 0) {
      invoiceStatus = 'PAID';
    } else if (calculated.amountPaid > 0 && calculated.balanceDue > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    const invDate = invoiceDate ? new Date(invoiceDate) : new Date();
    const dDate = dueDate ? new Date(dueDate) : new Date(invDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        invoiceNumber: invoiceNumber.trim(),
        clientId: clientId || null,
        clientName: clientName || '',
        clientEmail: clientEmail || '',
        clientPhone: clientPhone || '',
        clientAddress: clientAddress || '',
        clientGstin: clientGstin || '',
        clientPan: clientPan || '',
        businessName: businessName || '',
        businessLogo: businessLogo || '',
        businessEmail: businessEmail || '',
        businessPhone: businessPhone || '',
        businessAddress: businessAddress || '',
        businessGstin: businessGstin || '',
        businessPan: businessPan || '',
        bankDetails: bankDetails || '',
        upiId: upiId || '',
        invoiceDate: invDate,
        dueDate: dDate,
        paymentTerms: paymentTerms || 'Due on Receipt',
        currency: currency || 'INR',
        currencySymbol: currencySymbol || '₹',
        status: invoiceStatus,
        template: template || 'modern-blue',
        accentColor: accentColor || '#123B5D',
        fontFamily: fontFamily || 'Inter',
        subtotal: calculated.subtotal,
        discountType: discountType || 'percentage',
        discountValue: Number(discountValue) || 0,
        discountAmount: calculated.discountAmount,
        taxTotal: calculated.taxTotal,
        shipping: Number(shipping) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        grandTotal: calculated.grandTotal,
        amountPaid: calculated.amountPaid,
        balanceDue: calculated.balanceDue,
        notes: notes || '',
        terms: terms || '',
        paymentInstructions: paymentInstructions || '',
        thankYouMessage: thankYouMessage || 'Thank you for your business!',
        items: {
          create: calculated.processedItems.map((item) => ({
            name: item.name || 'Item',
            description: item.description || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxPercentage: item.taxPercentage,
            discount: item.discount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Increment next invoice number in settings
    await prisma.userSettings.updateMany({
      where: { userId },
      data: {
        nextInvoiceNumber: {
          increment: 1,
        },
      },
    });

    res.status(201).json({ message: 'Invoice created successfully.', invoice });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Failed to create invoice.', error: error.message });
  }
});

// Update Invoice
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { payments: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const {
      invoiceNumber,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientGstin,
      clientPan,
      businessName,
      businessLogo,
      businessEmail,
      businessPhone,
      businessAddress,
      businessGstin,
      businessPan,
      bankDetails,
      upiId,
      invoiceDate,
      dueDate,
      paymentTerms,
      currency,
      currencySymbol,
      status,
      template,
      accentColor,
      fontFamily,
      items = [],
      discountType,
      discountValue,
      shipping,
      additionalCharges,
      notes,
      terms,
      paymentInstructions,
      thankYouMessage,
    } = req.body;

    // Check duplicate invoiceNumber if changed
    if (invoiceNumber && invoiceNumber.trim() !== existing.invoiceNumber) {
      const dup = await prisma.invoice.findFirst({
        where: { userId, invoiceNumber: invoiceNumber.trim(), NOT: { id } },
      });
      if (dup) {
        res.status(400).json({ message: `Invoice number '${invoiceNumber}' is already used.` });
        return;
      }
    }

    // Sum existing payments
    const totalPaymentsRecorded = existing.payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate totals
    const calculated = calculateInvoiceTotals(
      items,
      discountType || existing.discountType as any,
      discountValue !== undefined ? discountValue : existing.discountValue,
      shipping !== undefined ? shipping : existing.shipping,
      additionalCharges !== undefined ? additionalCharges : existing.additionalCharges,
      totalPaymentsRecorded
    );

    let updatedStatus = status || existing.status;
    if (totalPaymentsRecorded >= calculated.grandTotal && calculated.grandTotal > 0) {
      updatedStatus = 'PAID';
    } else if (totalPaymentsRecorded > 0 && calculated.balanceDue > 0) {
      updatedStatus = 'PARTIALLY_PAID';
    } else if (updatedStatus === 'PAID' && calculated.balanceDue > 0) {
      updatedStatus = 'UNPAID';
    }

    // Transaction to update invoice and replace items
    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.update({
        where: { id },
        data: {
          invoiceNumber: invoiceNumber ? invoiceNumber.trim() : existing.invoiceNumber,
          clientId: clientId !== undefined ? clientId || null : existing.clientId,
          clientName: clientName !== undefined ? clientName : existing.clientName,
          clientEmail: clientEmail !== undefined ? clientEmail : existing.clientEmail,
          clientPhone: clientPhone !== undefined ? clientPhone : existing.clientPhone,
          clientAddress: clientAddress !== undefined ? clientAddress : existing.clientAddress,
          clientGstin: clientGstin !== undefined ? clientGstin : existing.clientGstin,
          clientPan: clientPan !== undefined ? clientPan : existing.clientPan,
          businessName: businessName !== undefined ? businessName : existing.businessName,
          businessLogo: businessLogo !== undefined ? businessLogo : existing.businessLogo,
          businessEmail: businessEmail !== undefined ? businessEmail : existing.businessEmail,
          businessPhone: businessPhone !== undefined ? businessPhone : existing.businessPhone,
          businessAddress: businessAddress !== undefined ? businessAddress : existing.businessAddress,
          businessGstin: businessGstin !== undefined ? businessGstin : existing.businessGstin,
          businessPan: businessPan !== undefined ? businessPan : existing.businessPan,
          bankDetails: bankDetails !== undefined ? bankDetails : existing.bankDetails,
          upiId: upiId !== undefined ? upiId : existing.upiId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : existing.invoiceDate,
          dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : existing.paymentTerms,
          currency: currency !== undefined ? currency : existing.currency,
          currencySymbol: currencySymbol !== undefined ? currencySymbol : existing.currencySymbol,
          status: updatedStatus,
          template: template !== undefined ? template : existing.template,
          accentColor: accentColor !== undefined ? accentColor : existing.accentColor,
          fontFamily: fontFamily !== undefined ? fontFamily : existing.fontFamily,
          subtotal: calculated.subtotal,
          discountType: discountType || existing.discountType,
          discountValue: Number(discountValue) || 0,
          discountAmount: calculated.discountAmount,
          taxTotal: calculated.taxTotal,
          shipping: Number(shipping) || 0,
          additionalCharges: Number(additionalCharges) || 0,
          grandTotal: calculated.grandTotal,
          amountPaid: calculated.amountPaid,
          balanceDue: calculated.balanceDue,
          notes: notes !== undefined ? notes : existing.notes,
          terms: terms !== undefined ? terms : existing.terms,
          paymentInstructions: paymentInstructions !== undefined ? paymentInstructions : existing.paymentInstructions,
          thankYouMessage: thankYouMessage !== undefined ? thankYouMessage : existing.thankYouMessage,
          items: {
            create: calculated.processedItems.map((item) => ({
              name: item.name || 'Item',
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxPercentage: item.taxPercentage,
              discount: item.discount,
              total: item.total,
              sortOrder: item.sortOrder,
            })),
          },
        },
      }),
    ]);

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    res.json({ message: 'Invoice updated successfully.', invoice: updatedInvoice });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Failed to update invoice.' });
  }
});

// Duplicate Invoice
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const source = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!source) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const prefix = settings?.invoicePrefix || 'INV-2026-';
    const nextNum = (settings?.nextInvoiceNumber || 1001) + 1;
    const newNumber = `${prefix}${nextNum}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        invoiceNumber: newNumber,
        clientId: source.clientId,
        clientName: source.clientName,
        clientEmail: source.clientEmail,
        clientPhone: source.clientPhone,
        clientAddress: source.clientAddress,
        clientGstin: source.clientGstin,
        clientPan: source.clientPan,
        businessName: source.businessName,
        businessLogo: source.businessLogo,
        businessEmail: source.businessEmail,
        businessPhone: source.businessPhone,
        businessAddress: source.businessAddress,
        businessGstin: source.businessGstin,
        businessPan: source.businessPan,
        bankDetails: source.bankDetails,
        upiId: source.upiId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paymentTerms: source.paymentTerms,
        currency: source.currency,
        currencySymbol: source.currencySymbol,
        status: 'DRAFT',
        template: source.template,
        accentColor: source.accentColor,
        fontFamily: source.fontFamily,
        subtotal: source.subtotal,
        discountType: source.discountType,
        discountValue: source.discountValue,
        discountAmount: source.discountAmount,
        taxTotal: source.taxTotal,
        shipping: source.shipping,
        additionalCharges: source.additionalCharges,
        grandTotal: source.grandTotal,
        amountPaid: 0,
        balanceDue: source.grandTotal,
        notes: source.notes,
        terms: source.terms,
        paymentInstructions: source.paymentInstructions,
        thankYouMessage: source.thankYouMessage,
        items: {
          create: source.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxPercentage: item.taxPercentage,
            discount: item.discount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await prisma.userSettings.updateMany({
      where: { userId },
      data: { nextInvoiceNumber: nextNum },
    });

    res.status(201).json({ message: 'Invoice duplicated successfully.', invoice: newInvoice });
  } catch (error: any) {
    console.error('Error duplicating invoice:', error);
    res.status(500).json({ message: 'Failed to duplicate invoice.' });
  }
});

// Delete Invoice
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json({ message: 'Invoice deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Failed to delete invoice.' });
  }
});

// Record Payment on Invoice
router.post('/:id/payments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { amount, paymentDate, paymentMethod, transactionRef, notes } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      res.status(400).json({ message: 'A valid payment amount greater than zero is required.' });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { payments: true },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const newAmountPaid = Math.round((invoice.amountPaid + payAmount) * 100) / 100;
    const newBalanceDue = Math.round(Math.max(0, invoice.grandTotal - newAmountPaid) * 100) / 100;

    let newStatus = invoice.status;
    if (newBalanceDue <= 0.01) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIALLY_PAID';
    }

    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: id,
          userId,
          amount: payAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod: paymentMethod || 'Bank Transfer',
          transactionRef: transactionRef || '',
          notes: notes || '',
        },
      }),
      prisma.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
          items: true,
        },
      }),
    ]);

    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Failed to record payment.' });
  }
});

// Delete Payment
router.delete('/:id/payments/:paymentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    const userId = req.userId!;

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { payments: true },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const paymentToDelete = invoice.payments.find((p) => p.id === paymentId);
    if (!paymentToDelete) {
      res.status(404).json({ message: 'Payment record not found.' });
      return;
    }

    const remainingPayments = invoice.payments.filter((p) => p.id !== paymentId);
    const newAmountPaid = Math.round(remainingPayments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const newBalanceDue = Math.round(Math.max(0, invoice.grandTotal - newAmountPaid) * 100) / 100;

    let newStatus = 'UNPAID';
    if (newBalanceDue <= 0.01 && invoice.grandTotal > 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await prisma.$transaction([
      prisma.payment.delete({ where: { id: paymentId } }),
      prisma.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      }),
    ]);

    const refreshedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
        items: true,
      },
    });

    res.json({ message: 'Payment deleted.', invoice: refreshedInvoice });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Failed to delete payment.' });
  }
});

export default router;

