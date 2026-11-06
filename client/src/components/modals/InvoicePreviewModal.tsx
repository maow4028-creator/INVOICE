import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Mail,
  MessageSquare,
  CreditCard,
  Edit,
  Palette,
  Check,
} from 'lucide-react';
import { Invoice, InvoiceTemplateId } from '../../types/index.js';
import { InvoiceTemplateView } from '../invoice/InvoiceTemplates.js';
import { exportInvoiceToPdf, printInvoiceElement } from '../../utils/pdf.js';
import { RecordPaymentModal } from './RecordPaymentModal.js';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (invoice: Invoice) => void;
  onInvoiceUpdated?: (invoice: Invoice) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onInvoiceUpdated,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplateId>(
    invoice?.template || 'modern-blue'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !invoice) return null;

  // Invoice with current template applied
  const activeInvoice: Invoice = {
    ...invoice,
    template: currentTemplate,
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    await exportInvoiceToPdf('modal-invoice-preview', `Invoice_${invoice.invoiceNumber}.pdf`);
    setIsExporting(false);
  };

  const handlePrint = () => {
    printInvoiceElement('modal-invoice-preview');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.clientName || 'there'},\n\n` +
        `Here are the details for your Invoice #${invoice.invoiceNumber} from ${invoice.businessName || 'our business'}.\n` +
        `Total Amount: ${invoice.currencySymbol}${invoice.grandTotal.toLocaleString()}\n` +
        `Balance Due: ${invoice.currencySymbol}${invoice.balanceDue.toLocaleString()}\n` +
        `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\n` +
        `Please let us know if you have any questions.\nThank you!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.businessName || 'Us'}`);
    const body = encodeURIComponent(
      `Dear ${invoice.clientName || 'Customer'},\n\n` +
        `Please find attached details regarding Invoice #${invoice.invoiceNumber}.\n\n` +
        `Invoice Summary:\n` +
        `- Invoice Number: ${invoice.invoiceNumber}\n` +
        `- Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\n` +
        `- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n` +
        `- Total Amount: ${invoice.currencySymbol}${invoice.grandTotal.toLocaleString()}\n` +
        `- Balance Due: ${invoice.currencySymbol}${invoice.balanceDue.toLocaleString()}\n\n` +
        `Payment Instructions:\n${invoice.bankDetails || invoice.upiId || 'Please contact us for bank details'}\n\n` +
        `Thank you for your business!\n\n` +
        `${invoice.businessName}`
    );
    window.location.href = `mailto:${invoice.clientEmail || ''}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
        <div className="bg-slate-100 rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Bar with Template Switcher & Actions */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b border-[#DCE5EB] gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#55B9E8]" />
                Template:
              </span>
              <div className="inline-flex rounded-lg border border-[#DCE5EB] p-0.5 bg-[#F5F7F9]">
                {[
                  { id: 'modern-blue', label: 'Modern Blue' },
                  { id: 'minimal-white', label: 'Minimal White' },
                  { id: 'corporate-pro', label: 'Corporate' },
                  { id: 'elegant-business', label: 'Executive' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setCurrentTemplate(tmpl.id as InvoiceTemplateId)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      currentTemplate === tmpl.id
                        ? 'bg-[#123B5D] text-white shadow-xs'
                        : 'text-[#718596] hover:text-[#183247]'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {invoice.balanceDue > 0 && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  title="Record a payment"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(invoice);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE5EB] text-[#183247] hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-[#55B9E8]" />
                  Edit
                </button>
              )}

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE5EB] text-[#183247] hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5 text-[#123B5D]" />
                Print
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#55B9E8]" />
                {isExporting ? 'Generating PDF...' : 'Download PDF'}
              </button>

              {/* Share dropdown / icons */}
              <button
                onClick={handleWhatsAppShare}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                title="Share via WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                onClick={handleEmailShare}
                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 transition-colors"
                title="Send via Email"
              >
                <Mail className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="text-[#718596] hover:text-[#183247] p-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex justify-center">
            <div className="w-full max-w-[800px] shadow-xl rounded-xl">
              <InvoiceTemplateView
                invoice={activeInvoice}
                containerId="modal-invoice-preview"
                showQrCode={true}
              />
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <RecordPaymentModal
          invoice={invoice}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentRecorded={(updated) => {
            if (onInvoiceUpdated) {
              onInvoiceUpdated(updated);
            }
          }}
        />
      )}
    </>
  );
};

