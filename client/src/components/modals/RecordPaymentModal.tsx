import React, { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Invoice, PAYMENT_METHODS } from '../../types/index.js';
import { api } from '../../services/api.js';

interface RecordPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: (updatedInvoice: Invoice) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const [amount, setAmount] = useState<number>(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.recordPayment(invoice.id, {
        amount,
        paymentDate,
        paymentMethod,
        transactionRef,
        notes,
      });

      // If fully paid, celebrate with confetti!
      if (res.invoice.balanceDue <= 0.01) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onPaymentRecorded(res.invoice);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DCE5EB] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center p-5 border-b border-[#DCE5EB] bg-[#F5F7F9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EAF6FC] text-[#55B9E8] rounded-lg">
              <CreditCard className="w-5 h-5 text-[#123B5D]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#123B5D]">Record Payment</h3>
              <p className="text-xs text-[#718596]">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#718596] hover:text-[#183247] p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Current balance reminder */}
          <div className="p-3.5 bg-[#EAF6FC] rounded-lg border border-[#DCE5EB] flex justify-between items-center">
            <div>
              <span className="text-xs text-[#718596]">Current Balance Due</span>
              <p className="text-lg font-bold text-[#123B5D]">
                {invoice.currencySymbol}
                {invoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAmount(invoice.balanceDue)}
              className="text-xs font-semibold text-[#55B9E8] hover:text-[#123B5D] bg-white px-2.5 py-1 rounded shadow-xs border border-[#DCE5EB]"
            >
              Pay Full
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Payment Amount ({invoice.currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-sm text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Transaction Ref / UTR / Cheque # (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-9988221, NEFT/IMPS"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Payment Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared via corporate account"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DCE5EB] text-xs font-semibold text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-[#55B9E8]" />
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

