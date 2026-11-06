import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CreditCard,
  Download,
  Printer,
  Share2,
  FileSpreadsheet,
  RefreshCw,
  MoreVertical,
  Calendar,
  AlertCircle,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types/index.js';
import { api } from '../services/api.js';
import { exportInvoicesToCSV } from '../utils/csv.js';
import { exportInvoiceToPdf, printInvoiceElement } from '../utils/pdf.js';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal.js';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal.js';

interface AllInvoicesViewProps {
  onCreateInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
  initialSearchQuery?: string;
}

export const AllInvoicesView: React.FC<AllInvoicesViewProps> = ({
  onCreateInvoice,
  onEditInvoice,
  initialSearchQuery = '',
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await api.getInvoices({
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });

      setInvoices(res.invoices || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, sortBy, sortOrder, page]);

  const handleDuplicate = async (inv: Invoice) => {
    try {
      await api.duplicateInvoice(inv.id);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate invoice.');
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
      return;
    }

    try {
      await api.deleteInvoice(inv.id);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice.');
    }
  };

  const handleExportCSV = () => {
    exportInvoicesToCSV(invoices, `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleQuickDownloadPdf = async (inv: Invoice) => {
    setPreviewInvoice(inv);
    setTimeout(async () => {
      await exportInvoiceToPdf('modal-invoice-preview', `Invoice_${inv.invoiceNumber}.pdf`);
    }, 300);
  };

  const handleWhatsAppShare = (inv: Invoice) => {
    const text = encodeURIComponent(
      `Hello ${inv.clientName || 'there'},\n\n` +
        `Here is Invoice #${inv.invoiceNumber} from ${inv.businessName || 'us'}.\n` +
        `Total: ${inv.currencySymbol}${inv.grandTotal.toLocaleString()}\n` +
        `Balance Due: ${inv.currencySymbol}${inv.balanceDue.toLocaleString()}\n` +
        `Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Invoices' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { id: 'UNPAID', label: 'Unpaid / Sent' },
    { id: 'OVERDUE', label: 'Overdue' },
    { id: 'DRAFT', label: 'Draft' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            All Invoices
          </h1>
          <p className="text-xs text-[#718596] mt-0.5">
            Manage, track, download and collect payments across all client invoices ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={invoices.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DCE5EB] hover:bg-slate-50 text-[#183247] text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchInvoices}
            className="p-2 text-[#718596] hover:text-[#123B5D] bg-[#F5F7F9] hover:bg-[#EAF6FC] rounded-xl border border-[#DCE5EB] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 text-[#55B9E8]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#718596] hover:text-[#183247] hover:bg-[#F5F7F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-[#DCE5EB]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
            <input
              type="text"
              placeholder="Search by invoice number, client name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] placeholder-[#718596] focus:outline-none focus:border-[#55B9E8]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-[#718596] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] font-medium focus:outline-none focus:border-[#55B9E8]"
            >
              <option value="createdAt">Date Created</option>
              <option value="dueDate">Due Date</option>
              <option value="grandTotal">Total Amount</option>
              <option value="invoiceNumber">Invoice Number</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-semibold text-[#183247] hover:bg-slate-100"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#DCE5EB] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-[#718596] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[#183247]">No Invoices Found</h3>
            <p className="text-xs text-[#718596] mt-1 max-w-sm mx-auto">
              {search
                ? `No invoices matched "${search}". Try clearing your search query.`
                : 'No invoices currently match the selected filter.'}
            </p>
            <button
              onClick={onCreateInvoice}
              className="mt-4 px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Create New Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] border-b border-[#DCE5EB] text-[#718596] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EB]/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F7F9]/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#123B5D]">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#183247] max-w-[180px] truncate">
                        {inv.clientName || 'Client'}
                      </div>
                      {inv.clientEmail && (
                        <div className="text-[11px] text-[#718596] truncate max-w-[180px]">
                          {inv.clientEmail}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-[#718596]">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4 text-[#718596]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#55B9E8]" />
                        <span>{new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-[#183247]">
                      {inv.currencySymbol}
                      {inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-4 text-right font-bold">
                      <span
                        className={
                          inv.balanceDue > 0
                            ? 'text-amber-600 font-mono'
                            : 'text-emerald-600 font-mono'
                        }
                      >
                        {inv.currencySymbol}
                        {inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : inv.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : inv.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="p-1.5 text-[#718596] hover:text-[#123B5D] hover:bg-[#EAF6FC] rounded-lg transition-colors"
                          title="Preview / Print / PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-[#718596] hover:text-[#123B5D] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDuplicate(inv)}
                          className="p-1.5 text-[#718596] hover:text-[#123B5D] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleWhatsAppShare(inv)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Share via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(inv)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#F5F7F9] border-t border-[#DCE5EB] flex items-center justify-between text-xs text-[#718596]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-white border border-[#DCE5EB] rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-white border border-[#DCE5EB] rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onEdit={(inv) => onEditInvoice(inv)}
          onInvoiceUpdated={() => fetchInvoices()}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onPaymentRecorded={() => fetchInvoices()}
        />
      )}
    </div>
  );
};

