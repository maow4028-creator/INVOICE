import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  Download,
  Eye,
  Plus,
  Trash2,
  UserPlus,
  Package,
  Layers,
  Sparkles,
  Palette,
  Check,
  SplitSquareVertical,
  Maximize2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Invoice,
  InvoiceItem,
  InvoiceTemplateId,
  Client,
  Product,
  CURRENCIES,
  PAYMENT_TERMS_OPTIONS,
} from '../types/index.js';
import { api } from '../services/api.js';
import { InvoiceTemplateView } from '../components/invoice/InvoiceTemplates.js';
import { exportInvoiceToPdf, printInvoiceElement } from '../utils/pdf.js';
import { AddClientModal } from '../components/modals/AddClientModal.js';

interface CreateInvoiceViewProps {
  initialInvoice?: Invoice | null;
  onInvoiceSaved: (inv: Invoice) => void;
  onCancel: () => void;
}

export const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({
  initialInvoice,
  onInvoiceSaved,
  onCancel,
}) => {
  // View mode: 'split' | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  // Catalogs
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invoice Form State
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.invoiceDate
      ? new Date(initialInvoice.invoiceDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate
      ? new Date(initialInvoice.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(initialInvoice?.paymentTerms || 'Net 30');
  const [currency, setCurrency] = useState(initialInvoice?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(initialInvoice?.currencySymbol || '₹');
  const [status, setStatus] = useState<string>(initialInvoice?.status || 'UNPAID');

  // Template customizer
  const [template, setTemplate] = useState<InvoiceTemplateId>(
    initialInvoice?.template || 'modern-blue'
  );
  const [accentColor, setAccentColor] = useState(initialInvoice?.accentColor || '#123B5D');
  const [fontFamily, setFontFamily] = useState(initialInvoice?.fontFamily || 'Inter');

  // Business Information (Snapshots)
  const [businessName, setBusinessName] = useState(initialInvoice?.businessName || '');
  const [businessLogo, setBusinessLogo] = useState(initialInvoice?.businessLogo || '');
  const [businessEmail, setBusinessEmail] = useState(initialInvoice?.businessEmail || '');
  const [businessPhone, setBusinessPhone] = useState(initialInvoice?.businessPhone || '');
  const [businessAddress, setBusinessAddress] = useState(initialInvoice?.businessAddress || '');
  const [businessGstin, setBusinessGstin] = useState(initialInvoice?.businessGstin || '');
  const [businessPan, setBusinessPan] = useState(initialInvoice?.businessPan || '');
  const [bankDetails, setBankDetails] = useState(initialInvoice?.bankDetails || '');
  const [upiId, setUpiId] = useState(initialInvoice?.upiId || '');

  // Client Information
  const [clientId, setClientId] = useState<string | null>(initialInvoice?.clientId || null);
  const [clientName, setClientName] = useState(initialInvoice?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialInvoice?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(initialInvoice?.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(initialInvoice?.clientAddress || '');
  const [clientGstin, setClientGstin] = useState(initialInvoice?.clientGstin || '');
  const [clientPan, setClientPan] = useState(initialInvoice?.clientPan || '');

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            name: '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxPercentage: 18,
            discount: 0,
            total: 0,
          },
        ]
  );

  // Overall calculations
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    initialInvoice?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialInvoice?.discountValue || 0);
  const [shipping, setShipping] = useState<number>(initialInvoice?.shipping || 0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(
    initialInvoice?.additionalCharges || 0
  );
  const [amountPaid, setAmountPaid] = useState<number>(initialInvoice?.amountPaid || 0);

  // Additional Notes
  const [notes, setNotes] = useState(initialInvoice?.notes || '');
  const [terms, setTerms] = useState(initialInvoice?.terms || '');
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialInvoice?.paymentInstructions || ''
  );
  const [thankYouMessage, setThankYouMessage] = useState(
    initialInvoice?.thankYouMessage || 'Thank you for your business!'
  );

  // Load initial business profile, next number and settings if new invoice
  useEffect(() => {
    const initData = async () => {
      try {
        const [bizRes, clientsRes, productsRes, settingsRes] = await Promise.all([
          api.getBusinessProfile(),
          api.getClients(),
          api.getProducts(),
          api.getSettings(),
        ]);

        setClients(clientsRes.clients || []);
        setProducts(productsRes.products || []);

        if (!initialInvoice) {
          // Pre-fill business info
          if (bizRes.profile) {
            const bp = bizRes.profile;
            setBusinessName(bp.businessName || '');
            setBusinessLogo(bp.logoUrl || '');
            setBusinessEmail(bp.email || '');
            setBusinessPhone(bp.phone || '');
            setBusinessAddress(
              [bp.address, bp.city, bp.state, bp.postalCode, bp.country]
                .filter(Boolean)
                .join(', ')
            );
            setBusinessGstin(bp.gstin || '');
            setBusinessPan(bp.panNumber || '');
            if (bp.bankName) {
              setBankDetails(
                `${bp.bankName} | A/C: ${bp.accountNumber} | IFSC: ${bp.ifscCode}`
              );
            }
            setUpiId(bp.upiId || '');
          }

          // Pre-fill next number & defaults from settings
          if (settingsRes.settings) {
            const st = settingsRes.settings;
            setCurrency(st.defaultCurrency || 'INR');
            setCurrencySymbol(st.defaultCurrencySymbol || '₹');
            setPaymentTerms(st.defaultPaymentTerms || 'Net 30');
            setTemplate(st.defaultTemplate || 'modern-blue');
            setAccentColor(st.defaultAccentColor || '#123B5D');
            setFontFamily(st.defaultFontFamily || 'Inter');
            setNotes(st.defaultNotes || 'Thank you for choosing our services!');
            setTerms(
              st.defaultTerms ||
                '1. Invoices are payable within the agreed terms.\n2. Invoices past due date may incur standard late interest.'
            );

            // Fetch auto-generated next invoice number
            const numRes = await api.getNextInvoiceNumber();
            setInvoiceNumber(numRes.formattedInvoiceNumber);
          }
        }
      } catch (err) {
        console.error('Failed to initialize invoice editor data:', err);
      }
    };

    initData();
  }, [initialInvoice]);

  // Adjust due date based on payment terms
  const handlePaymentTermsChange = (newTerms: string) => {
    setPaymentTerms(newTerms);
    const date = new Date(invoiceDate);
    if (newTerms.includes('7')) {
      date.setDate(date.getDate() + 7);
    } else if (newTerms.includes('15')) {
      date.setDate(date.getDate() + 15);
    } else if (newTerms.includes('30')) {
      date.setDate(date.getDate() + 30);
    } else if (newTerms.includes('45')) {
      date.setDate(date.getDate() + 45);
    } else if (newTerms.includes('60')) {
      date.setDate(date.getDate() + 60);
    }
    setDueDate(date.toISOString().split('T')[0]);
  };

  // Select existing client
  const handleClientSelect = (selectedId: string) => {
    if (!selectedId) {
      setClientId(null);
      return;
    }

    const c = clients.find((client) => client.id === selectedId);
    if (c) {
      setClientId(c.id);
      setClientName(c.businessName || c.name);
      setClientEmail(c.email || '');
      setClientPhone(c.phone || '');
      setClientAddress(c.billingAddress || '');
      setClientGstin(c.gstin || '');
      setClientPan(c.pan || '');
    }
  };

  // Add Item Line
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPercentage: 18,
        discount: 0,
        total: 0,
      },
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item Line
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Compute item total
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxPercentage) || 0;
      const disc = Number(item.discount) || 0;

      const base = Math.max(0, qty * price - disc);
      const tax = (base * taxRate) / 100;
      item.total = Math.round((base + tax) * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  // Insert saved product/service into line item
  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const item = {
        ...updated[index],
        name: prod.name,
        description: prod.description || '',
        unitPrice: prod.unitPrice,
        taxPercentage: prod.defaultTax,
      };

      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxPercentage) || 0;
      const disc = Number(item.discount) || 0;

      const base = Math.max(0, qty * price - disc);
      const tax = (base * taxRate) / 100;
      item.total = Math.round((base + tax) * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  // Instant Calculation of Totals
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxPercentage) || 0;
      const disc = Number(item.discount) || 0;

      const base = Math.max(0, qty * price - disc);
      const itemTax = (base * taxRate) / 100;

      subtotal += Math.round(base * 100) / 100;
      taxTotal += Math.round(itemTax * 100) / 100;
    });

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
    };
  };

  const totals = calculateTotals();

  // Create virtual active invoice object for the live preview
  const liveInvoice: Invoice = {
    id: initialInvoice?.id || 'temp-id',
    invoiceNumber: invoiceNumber || 'INV-DRAFT',
    clientId,
    clientName: clientName || 'Client Name',
    clientEmail,
    clientPhone,
    clientAddress,
    clientGstin,
    clientPan,
    businessName: businessName || 'My Business',
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
    status: (totals.balanceDue <= 0 && totals.grandTotal > 0
      ? 'PAID'
      : totals.amountPaid > 0
      ? 'PARTIALLY_PAID'
      : status) as any,
    template,
    accentColor,
    fontFamily,
    subtotal: totals.subtotal,
    discountType,
    discountValue,
    discountAmount: totals.discountAmount,
    taxTotal: totals.taxTotal,
    shipping,
    additionalCharges,
    grandTotal: totals.grandTotal,
    amountPaid: totals.amountPaid,
    balanceDue: totals.balanceDue,
    notes,
    terms,
    paymentInstructions,
    thankYouMessage,
    createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items,
  };

  // Save or Update Invoice
  const handleSaveInvoice = async (saveAsDraft: boolean = false) => {
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }

    if (!items.some((i) => i.name.trim().length > 0)) {
      setError('Please add at least one line item with a name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        invoiceNumber: invoiceNumber.trim(),
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
        status: (saveAsDraft ? 'DRAFT' : status) as any,
        template,
        accentColor,
        fontFamily,
        items,
        discountType,
        discountValue,
        shipping,
        additionalCharges,
        amountPaid,
        notes,
        terms,
        paymentInstructions,
        thankYouMessage,
      };

      let result: any;
      if (initialInvoice?.id) {
        result = await api.updateInvoice(initialInvoice.id, payload);
      } else {
        result = await api.createInvoice(payload);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      onInvoiceSaved(result.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    await exportInvoiceToPdf('live-invoice-editor-preview', `Invoice_${invoiceNumber || 'Draft'}.pdf`);
  };

  const handlePrint = () => {
    printInvoiceElement('live-invoice-editor-preview');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Template Picker & View Mode Toggles */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE5EB] shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#F5F7F9] p-1 rounded-xl border border-[#DCE5EB]">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'editor'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#718596] hover:text-[#183247]'
              }`}
            >
              Editor Only
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hidden md:flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#718596] hover:text-[#183247]'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'preview'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#718596] hover:text-[#183247]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Live Preview
            </button>
          </div>

          {/* Quick Template Picker */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#DCE5EB]">
            <span className="text-xs font-bold text-[#123B5D]">Design:</span>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as InvoiceTemplateId)}
              className="text-xs font-semibold text-[#183247] bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#55B9E8]"
            >
              <option value="modern-blue">Modern Blue</option>
              <option value="minimal-white">Minimal White</option>
              <option value="corporate-pro">Corporate Pro</option>
              <option value="elegant-business">Elegant Business</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 border border-[#DCE5EB] text-xs font-semibold text-[#718596] hover:text-[#183247] hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DCE5EB] text-[#183247] hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#123B5D]" />
            Print
          </button>

          <button
            onClick={handleDownloadPdf}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#EAF6FC] hover:bg-[#EAF6FC]/80 text-[#123B5D] border border-[#55B9E8]/30 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#55B9E8]" />
            PDF
          </button>

          <button
            onClick={() => handleSaveInvoice(true)}
            disabled={isSaving}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#183247] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Draft
          </button>

          <button
            onClick={() => handleSaveInvoice(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#55B9E8]" />
            <span>{isSaving ? 'Saving...' : initialInvoice?.id ? 'Update Invoice' : 'Save Invoice'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Editor & Preview */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'}`}>
        {/* ======================================================== */}
        {/* INVOICE EDITOR CONTAINER */}
        {/* ======================================================== */}
        <div
          className={`space-y-6 ${
            viewMode === 'split' ? 'xl:col-span-7' : viewMode === 'editor' ? 'block' : 'hidden'
          }`}
        >
          {/* SECTION A: INVOICE INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EB]">
              <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#55B9E8]" />
                A. Invoice Information
              </span>
              <span className="text-[11px] text-[#718596]">Auto-generated reference & dates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-1001"
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono font-bold text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => handlePaymentTermsChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                >
                  {PAYMENT_TERMS_OPTIONS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const sel = CURRENCIES.find((c) => c.code === e.target.value);
                    setCurrency(e.target.value);
                    if (sel) setCurrencySymbol(sel.symbol);
                  }}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Invoice Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-semibold text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="SENT">SENT</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION B: BUSINESS INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EB]">
              <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                B. Business Information
              </span>
              <span className="text-[11px] text-[#718596]">Auto-loaded from Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Business Address
              </label>
              <textarea
                rows={2}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={businessGstin}
                  onChange={(e) => setBusinessGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  PAN (Optional)
                </label>
                <input
                  type="text"
                  value={businessPan}
                  onChange={(e) => setBusinessPan(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: CLIENT INFORMATION */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EB]">
              <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                C. Client Information
              </span>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#55B9E8] hover:text-[#123B5D] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Client</span>
              </button>
            </div>

            {/* Select existing client */}
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Select Existing Client
              </label>
              <select
                value={clientId || ''}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-medium text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              >
                <option value="">-- Choose Client or Enter Manually --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName ? `${c.businessName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="billing@client.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Billing Address
              </label>
              <textarea
                rows={2}
                placeholder="Client Street address, City, State, Country"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Client Phone
                </label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Client GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="27..."
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Client PAN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="ABCDE..."
                  value={clientPan}
                  onChange={(e) => setClientPan(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
                />
              </div>
            </div>
          </div>

          {/* SECTION D: DYNAMIC PRODUCTS & SERVICES TABLE */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE5EB]">
              <div>
                <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                  D. Products & Services
                </span>
                <p className="text-[11px] text-[#718596] mt-0.5">Line items, pricing and tax rates</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#55B9E8]" />
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Line items container */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DCE5EB] relative space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#123B5D]">Item #{idx + 1}</span>

                    <div className="flex items-center gap-2">
                      {products.length > 0 && (
                        <select
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          defaultValue=""
                          className="text-[11px] bg-white border border-[#DCE5EB] rounded-md px-2 py-1 text-[#718596] focus:outline-none focus:border-[#55B9E8]"
                        >
                          <option value="" disabled>
                            ⚡ Pick from Catalog
                          </option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({currencySymbol}
                              {p.unitPrice})
                            </option>
                          ))}
                        </select>
                      )}

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Item / Service Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Full-Stack Web Development, UI/UX Design"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Unit Price ({currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs font-mono font-bold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detailed scope, milestone or deliverable notes..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs text-[#718596] focus:outline-none focus:border-[#55B9E8] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs text-center font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Tax Rate (%)
                      </label>
                      <select
                        value={item.taxPercentage}
                        onChange={(e) =>
                          handleItemChange(idx, 'taxPercentage', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                      >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST (Standard)</option>
                        <option value="28">28% GST</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Discount ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount || 0}
                        onChange={(e) =>
                          handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-[#DCE5EB] rounded-lg text-xs text-right text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#183247] mb-1">
                        Line Total
                      </label>
                      <div className="w-full px-3 py-1.5 bg-slate-100 border border-[#DCE5EB] rounded-lg text-xs font-mono font-bold text-right text-[#123B5D]">
                        {currencySymbol}
                        {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION E: AUTOMATIC CALCULATION & TOTALS */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider block pb-3 border-b border-[#DCE5EB]">
              E. Discounts, Charges & Summary
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Overall Discount
                </label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-20 px-2 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247]"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">{currencySymbol}</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Shipping Charges ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Additional Charges ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DCE5EB] space-y-2 text-xs max-w-sm ml-auto">
              <div className="flex justify-between text-[#718596]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#183247]">
                  {currencySymbol}
                  {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>
                    -{currencySymbol}
                    {totals.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {totals.taxTotal > 0 && (
                <div className="flex justify-between text-[#718596]">
                  <span>Total Tax</span>
                  <span className="font-semibold text-[#183247]">
                    {currencySymbol}
                    {totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-[#123B5D] pt-2 flex justify-between items-center text-sm font-extrabold text-[#123B5D]">
                <span>Grand Total</span>
                <span className="text-base font-mono">
                  {currencySymbol}
                  {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-[#718596]">
                <span>Amount Paid</span>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 bg-white border border-[#DCE5EB] rounded text-right text-xs font-semibold text-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#123B5D] text-white flex justify-between items-center font-bold text-xs mt-2">
                <span>Balance Due</span>
                <span className="text-sm font-mono">
                  {currencySymbol}
                  {totals.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION F: ADDITIONAL DETAILS & INSTRUCTIONS */}
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
            <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider block pb-3 border-b border-[#DCE5EB]">
              F. Payment Instructions, Notes & Terms
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Bank Details for Remittance
                </label>
                <textarea
                  rows={2}
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="e.g. Bank Name | A/C # | IFSC / SWIFT"
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  UPI ID (Generates Scan-to-Pay QR code)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourbusiness@hdfcbank"
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Client Notes (Visible on invoice)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special project notes, milestone deliverables or compliments..."
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Terms and Conditions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, delivery policies, interest clauses..."
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Thank You Message
              </label>
              <input
                type="text"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LIVE INVOICE PREVIEW CONTAINER */}
        {/* ======================================================== */}
        <div
          className={`space-y-4 ${
            viewMode === 'split' ? 'xl:col-span-5' : viewMode === 'preview' ? 'block' : 'hidden'
          }`}
        >
          <div className="bg-white p-4 rounded-2xl border border-[#DCE5EB] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#123B5D]">Live Instant Preview</span>
            </div>
            <span className="text-[11px] text-[#718596]">Template: {template}</span>
          </div>

          <div className="sticky top-32 overflow-hidden rounded-2xl shadow-xl border border-slate-200">
            <InvoiceTemplateView
              invoice={liveInvoice}
              containerId="live-invoice-editor-preview"
              showQrCode={true}
            />
          </div>
        </div>
      </div>

      {/* Inline Add Client Modal */}
      {isClientModalOpen && (
        <AddClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onClientCreated={(newClient) => {
            setClients((prev) => [newClient, ...prev]);
            handleClientSelect(newClient.id);
          }}
        />
      )}
    </div>
  );
};

