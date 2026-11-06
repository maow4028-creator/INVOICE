export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface BusinessProfile {
  id?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  website: string;
  gstin: string;
  panNumber: string;
  registrationNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  logoUrl: string;
}

export interface Client {
  id: string;
  userId: string;
  businessName: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  gstin: string;
  pan: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  totalInvoices?: number;
  totalBilled?: number;
  totalPaid?: number;
  totalPending?: number;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  unitPrice: number;
  defaultTax: number;
  type: 'Product' | 'Service';
  createdAt?: string;
}

export interface InvoiceItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  discount?: number;
  total: number;
  sortOrder?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef?: string;
  notes?: string;
  createdAt?: string;
  invoiceNumber?: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceTemplateId = 'modern-blue' | 'minimal-white' | 'corporate-pro' | 'elegant-business';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId?: string;
  clientId?: string | null;
  client?: Client;
  
  // Snapshots
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientGstin: string;
  clientPan: string;

  businessName: string;
  businessLogo: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGstin: string;
  businessPan: string;
  bankDetails: string;
  upiId: string;

  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  currencySymbol: string;
  status: InvoiceStatus;

  template: InvoiceTemplateId;
  accentColor: string;
  fontFamily: string;

  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxTotal: number;
  shipping: number;
  additionalCharges: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;

  notes: string;
  terms: string;
  paymentInstructions: string;
  thankYouMessage: string;

  createdAt: string;
  updatedAt: string;

  items: InvoiceItem[];
  payments?: Payment[];
}

export interface UserSettings {
  id?: string;
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  defaultTax: number;
  defaultPaymentTerms: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultTemplate: InvoiceTemplateId;
  defaultAccentColor: string;
  defaultFontFamily: string;
  defaultNotes: string;
  defaultTerms: string;
  dateFormat: string;
  darkMode: boolean;
}

export interface DashboardMetrics {
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  partiallyPaidInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  totalBilled: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  billed: number;
  received: number;
}

export interface StatusDistributionPoint {
  status: string;
  count: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'invoice_created' | 'payment_received' | 'invoice_overdue';
  title: string;
  description: string;
  date: string;
  amount?: number;
  currencySymbol?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentInvoices: Invoice[];
  monthlyRevenue: MonthlyRevenuePoint[];
  statusDistribution: StatusDistributionPoint[];
  recentActivity: ActivityItem[];
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($) - Australian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'SGD ($) - Singapore Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
];

export const PAYMENT_TERMS_OPTIONS = [
  'Due on Receipt',
  'Net 7 Days',
  'Net 15 Days',
  'Net 30 Days',
  'Net 45 Days',
  'Net 60 Days',
  '50% Advance, 50% on Completion',
];

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Cheque',
  'PayPal',
  'Stripe',
  'Other',
];

