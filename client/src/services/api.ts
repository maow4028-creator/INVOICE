import { firebaseData } from './firebaseData.js';
import { User, Invoice, Client, Product, BusinessProfile, UserSettings, DashboardData } from '../types/index.js';

const getCurrentUserId = (): string => {
  try {
    const raw = localStorage.getItem('invoicify_current_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.id) return u.id;
    }
  } catch (e) {}
  return 'usr_demo_apex_studio';
};

export const getToken = (): string | null => {
  return localStorage.getItem('invoice_auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('invoice_auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('invoice_auth_token');
};

export const api = {
  // Business Profile
  async getBusinessProfile(): Promise<{ profile: BusinessProfile }> {
    const userId = getCurrentUserId();
    const profile = await firebaseData.getBusinessProfile(userId);
    return { profile };
  },

  async updateBusinessProfile(data: BusinessProfile): Promise<{ profile: BusinessProfile; message: string }> {
    const userId = getCurrentUserId();
    const profile = await firebaseData.updateBusinessProfile(userId, data);
    return { profile, message: 'Business profile updated successfully.' };
  },

  // Clients
  async getClients(): Promise<{ clients: Client[] }> {
    const userId = getCurrentUserId();
    const clients = await firebaseData.getClients(userId);
    return { clients };
  },

  async getClient(id: string): Promise<any> {
    const userId = getCurrentUserId();
    const clients = await firebaseData.getClients(userId);
    const client = clients.find((c) => c.id === id);
    if (!client) throw new Error('Client not found');

    const { invoices } = await firebaseData.getInvoices(userId);
    const clientInvoices = invoices.filter((i) => i.clientId === id || i.clientName === client.businessName || i.clientName === client.name);

    const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = clientInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const balanceDue = clientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    return {
      client: {
        ...client,
        invoices: clientInvoices,
      },
      stats: {
        totalInvoices: clientInvoices.length,
        totalBilled,
        totalPaid,
        balanceDue,
      },
    };
  },

  async createClient(data: Partial<Client>): Promise<{ client: Client; message: string }> {
    const userId = getCurrentUserId();
    const client = await firebaseData.createClient(userId, data);
    return { client, message: 'Client created successfully.' };
  },

  async updateClient(id: string, data: Partial<Client>): Promise<{ client: Client; message: string }> {
    const userId = getCurrentUserId();
    const client = await firebaseData.updateClient(userId, id, data);
    return { client, message: 'Client updated successfully.' };
  },

  async deleteClient(id: string): Promise<{ message: string }> {
    const userId = getCurrentUserId();
    await firebaseData.deleteClient(userId, id);
    return { message: 'Client deleted successfully.' };
  },

  // Products
  async getProducts(): Promise<{ products: Product[] }> {
    const userId = getCurrentUserId();
    const products = await firebaseData.getProducts(userId);
    return { products };
  },

  async createProduct(data: Partial<Product>): Promise<{ product: Product; message: string }> {
    const userId = getCurrentUserId();
    const product = await firebaseData.createProduct(userId, data);
    return { product, message: 'Product created successfully.' };
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<{ product: Product; message: string }> {
    const userId = getCurrentUserId();
    const product = await firebaseData.updateProduct(userId, id, data);
    return { product, message: 'Product updated successfully.' };
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    const userId = getCurrentUserId();
    await firebaseData.deleteProduct(userId, id);
    return { message: 'Product deleted successfully.' };
  },

  // Invoices
  async getInvoices(params: Record<string, any> = {}): Promise<{ invoices: Invoice[]; pagination: any }> {
    const userId = getCurrentUserId();
    const { invoices, totalCount } = await firebaseData.getInvoices(userId, params);
    return {
      invoices,
      pagination: {
        total: totalCount,
        page: params.page || 1,
        limit: params.limit || 20,
        totalPages: Math.max(1, Math.ceil(totalCount / (params.limit || 20))),
      },
    };
  },

  async getInvoice(id: string): Promise<{ invoice: Invoice }> {
    const userId = getCurrentUserId();
    const { invoices } = await firebaseData.getInvoices(userId);
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    return { invoice };
  },

  async getNextInvoiceNumber(): Promise<{ prefix: string; nextNumber: number; formattedInvoiceNumber: string }> {
    const userId = getCurrentUserId();
    const settings = await firebaseData.getSettings(userId);
    const prefix = settings.invoicePrefix || 'INV-2026-';
    const nextNumber = settings.nextInvoiceNumber || 1001;
    return {
      prefix,
      nextNumber,
      formattedInvoiceNumber: `${prefix}${nextNumber}`,
    };
  },

  async createInvoice(data: Partial<Invoice>): Promise<{ invoice: Invoice; message: string }> {
    const userId = getCurrentUserId();
    const invoice = await firebaseData.createInvoice(userId, data);
    return { invoice, message: 'Invoice created successfully.' };
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<{ invoice: Invoice; message: string }> {
    const userId = getCurrentUserId();
    const invoice = await firebaseData.updateInvoice(userId, id, data);
    return { invoice, message: 'Invoice updated successfully.' };
  },

  async duplicateInvoice(id: string): Promise<{ invoice: Invoice; message: string }> {
    const userId = getCurrentUserId();
    const invoice = await firebaseData.duplicateInvoice(userId, id);
    return { invoice, message: 'Invoice duplicated successfully.' };
  },

  async deleteInvoice(id: string): Promise<{ message: string }> {
    const userId = getCurrentUserId();
    await firebaseData.deleteInvoice(userId, id);
    return { message: 'Invoice deleted successfully.' };
  },

  async recordPayment(invoiceId: string, paymentData: any): Promise<{ invoice: Invoice; payment: any; message: string }> {
    const userId = getCurrentUserId();
    const invoice = await firebaseData.recordPayment(userId, invoiceId, paymentData);
    return {
      invoice,
      payment: invoice.payments?.[0],
      message: 'Payment recorded successfully.',
    };
  },

  // Settings
  async getSettings(): Promise<{ settings: UserSettings }> {
    const userId = getCurrentUserId();
    const settings = await firebaseData.getSettings(userId);
    return { settings };
  },

  async updateSettings(data: UserSettings): Promise<{ settings: UserSettings; message: string }> {
    const userId = getCurrentUserId();
    const settings = await firebaseData.updateSettings(userId, data);
    return { settings, message: 'Settings saved successfully.' };
  },

  // Dashboard & Analytics
  async getDashboardData(): Promise<DashboardData> {
    const userId = getCurrentUserId();
    return await firebaseData.getDashboardData(userId);
  },

  // Password change mock / local
  async changePassword(data: any): Promise<{ message: string }> {
    return { message: 'Password updated successfully.' };
  },
};
