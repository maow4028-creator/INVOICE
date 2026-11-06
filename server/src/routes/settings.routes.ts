import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get Settings
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.userId!,
        },
      });
    }

    res.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
});

// Update Settings
router.put('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      defaultCurrency,
      defaultCurrencySymbol,
      defaultTax,
      defaultPaymentTerms,
      invoicePrefix,
      nextInvoiceNumber,
      defaultTemplate,
      defaultAccentColor,
      defaultFontFamily,
      defaultNotes,
      defaultTerms,
      dateFormat,
      darkMode,
    } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: {
        defaultCurrency: defaultCurrency !== undefined ? defaultCurrency : undefined,
        defaultCurrencySymbol: defaultCurrencySymbol !== undefined ? defaultCurrencySymbol : undefined,
        defaultTax: defaultTax !== undefined ? parseFloat(defaultTax) || 0 : undefined,
        defaultPaymentTerms: defaultPaymentTerms !== undefined ? defaultPaymentTerms : undefined,
        invoicePrefix: invoicePrefix !== undefined ? invoicePrefix : undefined,
        nextInvoiceNumber: nextInvoiceNumber !== undefined ? parseInt(nextInvoiceNumber, 10) || 1 : undefined,
        defaultTemplate: defaultTemplate !== undefined ? defaultTemplate : undefined,
        defaultAccentColor: defaultAccentColor !== undefined ? defaultAccentColor : undefined,
        defaultFontFamily: defaultFontFamily !== undefined ? defaultFontFamily : undefined,
        defaultNotes: defaultNotes !== undefined ? defaultNotes : undefined,
        defaultTerms: defaultTerms !== undefined ? defaultTerms : undefined,
        dateFormat: dateFormat !== undefined ? dateFormat : undefined,
        darkMode: darkMode !== undefined ? Boolean(darkMode) : undefined,
      },
      create: {
        userId: req.userId!,
        defaultCurrency: defaultCurrency || 'INR',
        defaultCurrencySymbol: defaultCurrencySymbol || '₹',
        defaultTax: defaultTax !== undefined ? parseFloat(defaultTax) || 0 : 18.0,
        defaultPaymentTerms: defaultPaymentTerms || 'Net 30',
        invoicePrefix: invoicePrefix || 'INV-2026-',
        nextInvoiceNumber: nextInvoiceNumber ? parseInt(nextInvoiceNumber, 10) || 1001 : 1001,
        defaultTemplate: defaultTemplate || 'modern-blue',
        defaultAccentColor: defaultAccentColor || '#123B5D',
        defaultFontFamily: defaultFontFamily || 'Inter',
        defaultNotes: defaultNotes || 'Thank you for your business!',
        defaultTerms: defaultTerms || 'Payment is due within agreed terms.',
        dateFormat: dateFormat || 'YYYY-MM-DD',
        darkMode: Boolean(darkMode),
      },
    });

    res.json({ message: 'Settings saved successfully.', settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
});

export default router;

