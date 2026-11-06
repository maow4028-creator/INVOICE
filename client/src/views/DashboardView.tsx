import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowUpRight,
  Eye,
  CreditCard,
  Download,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DashboardData, Invoice } from '../types/index.js';
import { api } from '../services/api.js';
import { exportInvoiceToPdf } from '../utils/pdf.js';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal.js';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal.js';

interface DashboardViewProps {
  onCreateInvoice: () => void;
  onViewAllInvoices: () => void;
  onEditInvoice: (inv: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onCreateInvoice,
  onViewAllInvoices,
  onEditInvoice,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number, symbol: string = '₹') => {
    return `${symbol}${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#55B9E8] animate-spin" />
          <p className="text-xs text-[#718596] font-medium">Loading executive metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    partiallyPaidInvoices: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalBilled: 0,
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      subtitle: `${metrics.paidInvoices} paid invoices collected`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: 'Realized',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Pending Receivables',
      value: formatCurrency(metrics.pendingPayments),
      subtitle: `${metrics.unpaidInvoices + metrics.partiallyPaidInvoices} awaiting payment`,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: 'Outstanding',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Total Invoiced',
      value: metrics.totalInvoices.toString(),
      subtitle: `Total volume: ${formatCurrency(metrics.totalBilled)}`,
      icon: FileText,
      color: 'bg-[#EAF6FC] text-[#55B9E8] border-[#55B9E8]/30',
      badge: 'All Time',
      badgeColor: 'bg-[#EAF6FC] text-[#123B5D]',
    },
    {
      title: 'Overdue Invoices',
      value: metrics.overdueInvoices.toString(),
      subtitle: metrics.overdueInvoices > 0 ? 'Requires immediate client follow-up' : 'All accounts in good standing',
      icon: AlertTriangle,
      color: metrics.overdueInvoices > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200',
      badge: metrics.overdueInvoices > 0 ? 'Action Needed' : 'Zero Overdue',
      badgeColor: metrics.overdueInvoices > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600',
    },
  ];

  const maxRevenue = Math.max(
    ...(data?.monthlyRevenue?.map((m) => Math.max(m.billed, m.received)) || [100000]),
    10000
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Financial & Invoicing Overview
          </h1>
          <p className="text-xs text-[#718596] mt-1">
            Track business billing performance, incoming cash flow, and client accounts in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="p-2 text-[#718596] hover:text-[#123B5D] bg-[#F5F7F9] hover:bg-[#EAF6FC] rounded-xl border border-[#DCE5EB] transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 text-[#55B9E8]" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-[#DCE5EB] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-[#718596] uppercase tracking-wider">
                  {card.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-extrabold text-[#123B5D] tracking-tight">
                  {card.value}
                </div>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <p className="text-[11px] text-[#718596] mt-1 border-t border-[#DCE5EB]/60 pt-2 flex items-center justify-between">
                <span>{card.subtitle}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-[#123B5D]">Revenue & Billing Velocity</h2>
              <p className="text-xs text-[#718596] mt-0.5">Billed invoices vs received collections (last 6 months)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#123B5D]">
                <span className="w-3 h-3 rounded-sm bg-[#123B5D]" /> Billed
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#55B9E8]">
                <span className="w-3 h-3 rounded-sm bg-[#55B9E8]" /> Received
              </span>
            </div>
          </div>

          {/* SVG Custom Interactive Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-[#DCE5EB] px-2">
            {(data?.monthlyRevenue || []).map((point, i) => {
              const billedHeight = Math.max(8, (point.billed / maxRevenue) * 200);
              const receivedHeight = Math.max(8, (point.received / maxRevenue) * 200);

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex justify-center items-end gap-1.5 h-48">
                    {/* Billed Bar */}
                    <div
                      style={{ height: `${billedHeight}px` }}
                      className="w-full max-w-[20px] bg-[#123B5D] rounded-t-md group-hover:brightness-110 transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 font-mono transition-opacity">
                        Billed: ₹{point.billed.toLocaleString()}
                      </div>
                    </div>

                    {/* Received Bar */}
                    <div
                      style={{ height: `${receivedHeight}px` }}
                      className="w-full max-w-[20px] bg-[#55B9E8] rounded-t-md group-hover:brightness-110 transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#55B9E8] text-white text-[10px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 font-mono transition-opacity">
                        Recv: ₹{point.received.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-[#718596] mt-3 group-hover:text-[#123B5D] transition-colors">
                    {point.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-3 text-[11px] text-[#718596]">
            <span>Automatic aggregation from database payments</span>
            <span className="font-semibold text-[#123B5D]">Currency: Base Local</span>
          </div>
        </div>

        {/* Invoice Status Distribution Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#123B5D]">Invoice Portfolio Health</h2>
            <p className="text-xs text-[#718596] mt-0.5">Status breakdown across active records</p>

            <div className="space-y-4 my-6">
              {[
                { label: 'Paid in Full', count: metrics.paidInvoices, color: 'bg-emerald-500' },
                { label: 'Partially Paid', count: metrics.partiallyPaidInvoices, color: 'bg-amber-500' },
                { label: 'Unpaid / Sent', count: metrics.unpaidInvoices, color: 'bg-[#55B9E8]' },
                { label: 'Overdue', count: metrics.overdueInvoices, color: 'bg-red-500' },
              ].map((item, idx) => {
                const total = Math.max(1, metrics.totalInvoices);
                const percent = Math.round((item.count / total) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-[#183247]">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="text-[#718596]">
                        {item.count} <span className="text-[11px] font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F7F9] rounded-full overflow-hidden border border-[#DCE5EB]/60">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#EAF6FC] p-3 rounded-xl border border-[#DCE5EB] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#123B5D]">Collection Efficiency</span>
            <span className="text-xs font-bold text-[#55B9E8]">
              {metrics.totalBilled > 0
                ? `${Math.round((metrics.totalRevenue / metrics.totalBilled) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Invoices (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-[#123B5D]">Recent Invoices</h2>
              <p className="text-xs text-[#718596]">Latest generated client invoices</p>
            </div>
            <button
              onClick={onViewAllInvoices}
              className="text-xs font-semibold text-[#55B9E8] hover:text-[#123B5D] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(!data?.recentInvoices || data.recentInvoices.length === 0) ? (
            <div className="text-center py-12 border border-dashed border-[#DCE5EB] rounded-xl bg-[#F5F7F9]">
              <FileText className="w-10 h-10 text-[#718596] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#183247]">No Invoices Created Yet</p>
              <p className="text-xs text-[#718596] mt-1 max-w-sm mx-auto">
                Generate your first professional invoice with our intuitive editor and luxury templates.
              </p>
              <button
                onClick={onCreateInvoice}
                className="mt-4 px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5EB] text-[#718596] uppercase font-bold text-[10px] tracking-wider">
                    <th className="pb-3 px-2">Invoice #</th>
                    <th className="pb-3 px-3">Client</th>
                    <th className="pb-3 px-3">Due Date</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EB]/60">
                  {data.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F5F7F9]/80 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-[#123B5D]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#183247] max-w-[140px] truncate">
                        {inv.clientName || 'Valued Client'}
                      </td>
                      <td className="py-3 px-3 text-[#718596]">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#183247]">
                        {inv.currencySymbol}
                        {inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : inv.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedInvoiceForPreview(inv)}
                            className="p-1.5 text-[#718596] hover:text-[#123B5D] hover:bg-[#EAF6FC] rounded-lg transition-colors"
                            title="Preview Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
          <h2 className="text-base font-bold text-[#123B5D] mb-1">Recent Activity</h2>
          <p className="text-xs text-[#718596] mb-5">Audit trail of workspace actions</p>

          <div className="space-y-4">
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <p className="text-xs text-[#718596] text-center py-8">No recent activity logged yet.</p>
            ) : (
              data.recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      act.type === 'payment_received'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-[#EAF6FC] text-[#55B9E8]'
                    }`}
                  >
                    {act.type === 'payment_received' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#183247]">{act.title}</p>
                    <p className="text-[11px] text-[#718596]">{act.description}</p>
                    <span className="text-[10px] text-[#718596]/70 mt-0.5 block">
                      {new Date(act.date).toLocaleDateString()} at{' '}
                      {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedInvoiceForPreview && (
        <InvoicePreviewModal
          invoice={selectedInvoiceForPreview}
          isOpen={!!selectedInvoiceForPreview}
          onClose={() => setSelectedInvoiceForPreview(null)}
          onEdit={(inv) => onEditInvoice(inv)}
          onInvoiceUpdated={() => fetchDashboard()}
        />
      )}

      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onPaymentRecorded={() => fetchDashboard()}
        />
      )}
    </div>
  );
};

