import { Invoice } from '../types/index.js';

export const exportInvoicesToCSV = (invoices: Invoice[], filename: string = 'Invoices_Export.csv') => {
  if (!invoices || invoices.length === 0) return;

  const headers = [
    'Invoice Number',
    'Client Name',
    'Client Email',
    'Invoice Date',
    'Due Date',
    'Currency',
    'Subtotal',
    'Discount',
    'Tax',
    'Grand Total',
    'Amount Paid',
    'Balance Due',
    'Status',
    'Payment Terms',
  ];

  const rows = invoices.map((inv) => [
    `"${inv.invoiceNumber.replace(/"/g, '""')}"`,
    `"${(inv.clientName || '').replace(/"/g, '""')}"`,
    `"${(inv.clientEmail || '').replace(/"/g, '""')}"`,
    `"${new Date(inv.invoiceDate).toLocaleDateString()}"`,
    `"${new Date(inv.dueDate).toLocaleDateString()}"`,
    `"${inv.currency}"`,
    inv.subtotal.toFixed(2),
    inv.discountAmount.toFixed(2),
    inv.taxTotal.toFixed(2),
    inv.grandTotal.toFixed(2),
    inv.amountPaid.toFixed(2),
    inv.balanceDue.toFixed(2),
    `"${inv.status}"`,
    `"${inv.paymentTerms}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

