import {
  db,
  isFirebaseConfigured,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from './firebase.js';
import {
  Invoice,
  Client,
  Product,
  BusinessProfile,
  UserSettings,
  DashboardData,
} from '../types/index.js';

// Local storage key helper for offline/demo/instant persistence scoped strictly by userId
const getStorageKey = (userId: string, collectionName: string) =>
  `invoicify_user_${userId}_${collectionName}`;

const getLocalData = <T>(userId: string, collectionName: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId, collectionName));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalData = <T>(userId: string, collectionName: string, data: T): void => {
  try {
    localStorage.setItem(getStorageKey(userId, collectionName), JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

export const firebaseData = {
  // ==========================================
  // BUSINESS PROFILE
  // ==========================================
  async getBusinessProfile(userId: string): Promise<BusinessProfile> {
    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'business', 'profile');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return snap.data() as BusinessProfile;
        }
      } catch (err) {
        console.warn('Firestore getBusinessProfile error, falling back to local:', err);
      }
    }

    return getLocalData<BusinessProfile>(userId, 'profile', {
      businessName: 'My Enterprise & Co.',
      ownerName: 'Business Owner',
      email: 'billing@enterprise.design',
      phone: '+91 98765 43210',
      address: 'Suite 402, Executive Towers, Financial District',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      website: 'https://enterprise.design',
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      registrationNumber: 'U72200KA2026PTC123456',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200087654321',
      ifscCode: 'HDFC0000240',
      upiId: 'enterprise@hdfcbank',
      logoUrl: '',
    });
  },

  async updateBusinessProfile(userId: string, profile: BusinessProfile): Promise<BusinessProfile> {
    setLocalData(userId, 'profile', profile);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'business', 'profile');
        await setDoc(ref, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore updateBusinessProfile error:', err);
      }
    }

    return profile;
  },

  // ==========================================
  // USER SETTINGS
  // ==========================================
  async getSettings(userId: string): Promise<UserSettings> {
    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'settings', 'config');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return snap.data() as UserSettings;
        }
      } catch (err) {
        console.warn('Firestore getSettings error, falling back to local:', err);
      }
    }

    return getLocalData<UserSettings>(userId, 'settings', {
      defaultCurrency: 'INR',
      defaultCurrencySymbol: '₹',
      defaultTax: 18.0,
      defaultPaymentTerms: 'Net 30',
      invoicePrefix: 'INV-2026-',
      nextInvoiceNumber: 1001,
      defaultTemplate: 'modern-blue',
      defaultAccentColor: '#123B5D',
      defaultFontFamily: 'Inter',
      defaultNotes: 'Thank you for choosing our services! Please remit payment within agreed terms.',
      defaultTerms:
        '1. Payment is required as per agreed terms.\n2. Invoices past due date may incur standard late interest.',
      dateFormat: 'YYYY-MM-DD',
      darkMode: false,
    });
  },

  async updateSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
    setLocalData(userId, 'settings', settings);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'settings', 'config');
        await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Firestore updateSettings error:', err);
      }
    }

    return settings;
  },

  // ==========================================
  // CLIENTS
  // ==========================================
  async getClients(userId: string): Promise<Client[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'users', userId, 'clients');
        const q = query(col, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list: Client[] = [];
        snap.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Client));
        if (list.length > 0) {
          setLocalData(userId, 'clients', list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore getClients error, falling back to local:', err);
      }
    }

    const localClients = getLocalData<Client[]>(userId, 'clients', []);
    if (localClients.length === 0) {
      // Seed default sample clients for initial pleasant experience
      const defaultClients: Client[] = [
        {
          id: 'client-1',
          userId,
          businessName: 'Horizon Fintech Global Ltd',
          name: 'Sarah Jenkins',
          email: 'accounts@horizonfintech.io',
          phone: '+91 98220 11223',
          billingAddress: 'Tower B, 14th Floor, World Trade Centre, Mumbai, MH 400001',
          shippingAddress: '',
          gstin: '27AAACH2345G1ZP',
          pan: 'AAACH2345G',
          notes: 'Strategic Enterprise client. Quarterly billing cycle.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalInvoices: 1,
          totalBilled: 147500,
          totalPaid: 147500,
          totalPending: 0,
        },
        {
          id: 'client-2',
          userId,
          businessName: 'Vanguard Health Systems',
          name: 'Dr. Rahul Mehta',
          email: 'rahul.mehta@vanguardhealth.org',
          phone: '+91 98450 99887',
          billingAddress: '42 Lotus Boulevard, Koramangala, Bengaluru, KA 560034',
          shippingAddress: '',
          gstin: '29AABCV9876K1ZY',
          pan: 'AABCV9876K',
          notes: 'Healthcare platform redesign and patient portal UX.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalInvoices: 1,
          totalBilled: 126673,
          totalPaid: 60000,
          totalPending: 66673,
        },
      ];
      setLocalData(userId, 'clients', defaultClients);
      return defaultClients;
    }
    return localClients;
  },

  async createClient(userId: string, clientData: Partial<Client>): Promise<Client> {
    const newId = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newClient: Client = {
      id: newId,
      userId,
      businessName: clientData.businessName || '',
      name: clientData.name || clientData.businessName || 'Valued Client',
      email: clientData.email || '',
      phone: clientData.phone || '',
      billingAddress: clientData.billingAddress || '',
      shippingAddress: clientData.shippingAddress || '',
      gstin: clientData.gstin || '',
      pan: clientData.pan || '',
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalInvoices: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalPending: 0,
    };

    const clients = getLocalData<Client[]>(userId, 'clients', []);
    clients.unshift(newClient);
    setLocalData(userId, 'clients', clients);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'clients', newId);
        await setDoc(ref, newClient);
      } catch (err) {
        console.warn('Firestore createClient error:', err);
      }
    }

    return newClient;
  },

  async updateClient(userId: string, clientId: string, clientData: Partial<Client>): Promise<Client> {
    const clients = getLocalData<Client[]>(userId, 'clients', []);
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx === -1) throw new Error('Client not found');

    const updated = {
      ...clients[idx],
      ...clientData,
      updatedAt: new Date().toISOString(),
    };
    clients[idx] = updated;
    setLocalData(userId, 'clients', clients);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'clients', clientId);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.warn('Firestore updateClient error:', err);
      }
    }

    return updated;
  },

  async deleteClient(userId: string, clientId: string): Promise<void> {
    const clients = getLocalData<Client[]>(userId, 'clients', []);
    const filtered = clients.filter((c) => c.id !== clientId);
    setLocalData(userId, 'clients', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'clients', clientId);
        await deleteDoc(ref);
      } catch (err) {
        console.warn('Firestore deleteClient error:', err);
      }
    }
  },

  // ==========================================
  // PRODUCTS & SERVICES CATALOG
  // ==========================================
  async getProducts(userId: string): Promise<Product[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'users', userId, 'products');
        const snap = await getDocs(col);
        const list: Product[] = [];
        snap.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Product));
        if (list.length > 0) {
          setLocalData(userId, 'products', list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore getProducts error, falling back to local:', err);
      }
    }

    const local = getLocalData<Product[]>(userId, 'products', []);
    if (local.length === 0) {
      const defaultProducts: Product[] = [
        {
          id: 'prod-1',
          userId,
          name: 'Full-Stack Web Application Architecture',
          description: 'End-to-end cloud platform development with React, Node.js and PostgreSQL',
          unitPrice: 125000,
          defaultTax: 18.0,
          type: 'Service',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'prod-2',
          userId,
          name: 'Brand Identity & Design System',
          description: 'Comprehensive design tokens, typography, component library in Figma',
          unitPrice: 65000,
          defaultTax: 18.0,
          type: 'Service',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'prod-3',
          userId,
          name: 'Mobile App UI/UX Design (iOS & Android)',
          description: 'High-fidelity wireframes, interactive prototypes, and developer handoff',
          unitPrice: 48000,
          defaultTax: 18.0,
          type: 'Service',
          createdAt: new Date().toISOString(),
        },
      ];
      setLocalData(userId, 'products', defaultProducts);
      return defaultProducts;
    }
    return local;
  },

  async createProduct(userId: string, prodData: Partial<Product>): Promise<Product> {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProd: Product = {
      id: newId,
      userId,
      name: prodData.name || 'New Item',
      description: prodData.description || '',
      unitPrice: Number(prodData.unitPrice) || 0,
      defaultTax: Number(prodData.defaultTax) || 0,
      type: prodData.type === 'Product' ? 'Product' : 'Service',
      createdAt: new Date().toISOString(),
    };

    const prods = getLocalData<Product[]>(userId, 'products', []);
    prods.unshift(newProd);
    setLocalData(userId, 'products', prods);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'products', newId);
        await setDoc(ref, newProd);
      } catch (err) {
        console.warn('Firestore createProduct error:', err);
      }
    }

    return newProd;
  },

  async updateProduct(userId: string, productId: string, prodData: Partial<Product>): Promise<Product> {
    const prods = getLocalData<Product[]>(userId, 'products', []);
    const idx = prods.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error('Product not found');

    const updated = { ...prods[idx], ...prodData };
    prods[idx] = updated;
    setLocalData(userId, 'products', prods);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'products', productId);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.warn('Firestore updateProduct error:', err);
      }
    }

    return updated;
  },

  async deleteProduct(userId: string, productId: string): Promise<void> {
    const prods = getLocalData<Product[]>(userId, 'products', []);
    const filtered = prods.filter((p) => p.id !== productId);
    setLocalData(userId, 'products', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'products', productId);
        await deleteDoc(ref);
      } catch (err) {
        console.warn('Firestore deleteProduct error:', err);
      }
    }
  },

  // ==========================================
  // INVOICES & PAYMENTS (THE FLAGSHIP PERSISTENCE)
  // ==========================================
  async getInvoices(userId: string, params: Record<string, any> = {}): Promise<{ invoices: Invoice[]; totalCount: number }> {
    let list: Invoice[] = [];

    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'users', userId, 'invoices');
        const q = query(col, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        snap.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Invoice));
        if (list.length > 0) {
          setLocalData(userId, 'invoices', list);
        }
      } catch (err) {
        console.warn('Firestore getInvoices error, falling back to local:', err);
      }
    }

    if (list.length === 0) {
      list = getLocalData<Invoice[]>(userId, 'invoices', []);
    }

    // If completely new user with zero invoices, initialize with standard starter invoice
    if (list.length === 0) {
      const starterInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: 'INV-2026-1001',
        userId,
        clientId: 'client-1',
        clientName: 'Horizon Fintech Global Ltd',
        clientEmail: 'accounts@horizonfintech.io',
        clientPhone: '+91 98220 11223',
        clientAddress: 'Tower B, 14th Floor, World Trade Centre, Mumbai, MH 400001',
        clientGstin: '27AAACH2345G1ZP',
        clientPan: 'AAACH2345G',
        businessName: 'Apex Creative Studio & Technologies',
        businessLogo: '',
        businessEmail: 'billing@apexstudio.design',
        businessPhone: '+91 98765 43210',
        businessAddress: 'Suite 402, Skyline Executive Towers, Cyber City, Bengaluru, KA',
        businessGstin: '29ABCDE1234F1Z5',
        businessPan: 'ABCDE1234F',
        bankDetails: 'HDFC Bank Ltd | A/C: 50200087654321 | IFSC: HDFC0000240',
        upiId: 'apexstudio@hdfcbank',
        invoiceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        paymentTerms: 'Net 30',
        currency: 'INR',
        currencySymbol: '₹',
        status: 'PAID',
        template: 'modern-blue',
        accentColor: '#123B5D',
        fontFamily: 'Inter',
        subtotal: 125000,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxTotal: 22500,
        shipping: 0,
        additionalCharges: 0,
        grandTotal: 147500,
        amountPaid: 147500,
        balanceDue: 0,
        notes: 'Enterprise platform Q1 release milestone.',
        terms: 'Payment received with thanks.',
        paymentInstructions: 'HDFC Bank Wire Transfer',
        thankYouMessage: 'Thank you for your business!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            name: 'Full-Stack Web Application Architecture',
            description: 'Fintech portal backend and client dashboard',
            quantity: 1,
            unitPrice: 125000,
            taxPercentage: 18.0,
            discount: 0,
            total: 147500,
          },
        ],
        payments: [
          {
            id: 'pay-1',
            invoiceId: 'inv-1',
            amount: 147500,
            paymentDate: new Date().toISOString(),
            paymentMethod: 'Bank Transfer',
            transactionRef: 'NEFT-HDFC-99882211',
            notes: 'Full payment received.',
          },
        ],
      };

      list = [starterInvoice];
      setLocalData(userId, 'invoices', list);
    }

    // Auto-check overdue
    const now = new Date();
    list = list.map((inv) => {
      if (['UNPAID', 'SENT'].includes(inv.status) && new Date(inv.dueDate) < now) {
        return { ...inv, status: 'OVERDUE' as any };
      }
      return inv;
    });

    // Apply filtering & search
    let filtered = [...list];
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((i) => i.status === params.status);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q) ||
          (i.clientEmail && i.clientEmail.toLowerCase().includes(q))
      );
    }

    // Sort
    const sortBy = params.sortBy || 'createdAt';
    const isAsc = params.sortOrder === 'asc';
    filtered.sort((a: any, b: any) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    return {
      invoices: filtered,
      totalCount: filtered.length,
    };
  },

  async createInvoice(userId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const newId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newInvoice: Invoice = {
      ...(invoiceData as any),
      id: newId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: invoiceData.payments || [],
    };

    const invoices = getLocalData<Invoice[]>(userId, 'invoices', []);
    invoices.unshift(newInvoice);
    setLocalData(userId, 'invoices', invoices);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'invoices', newId);
        await setDoc(ref, newInvoice);
      } catch (err) {
        console.warn('Firestore createInvoice error:', err);
      }
    }

    // Also update settings nextInvoiceNumber counter
    const settings = await this.getSettings(userId);
    await this.updateSettings(userId, {
      ...settings,
      nextInvoiceNumber: (settings.nextInvoiceNumber || 1001) + 1,
    });

    return newInvoice;
  },

  async updateInvoice(userId: string, invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoices = getLocalData<Invoice[]>(userId, 'invoices', []);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');

    const updated = {
      ...invoices[idx],
      ...invoiceData,
      updatedAt: new Date().toISOString(),
    };
    invoices[idx] = updated;
    setLocalData(userId, 'invoices', invoices);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'invoices', invoiceId);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.warn('Firestore updateInvoice error:', err);
      }
    }

    return updated;
  },

  async duplicateInvoice(userId: string, invoiceId: string): Promise<Invoice> {
    const invoices = getLocalData<Invoice[]>(userId, 'invoices', []);
    const source = invoices.find((i) => i.id === invoiceId);
    if (!source) throw new Error('Source invoice not found');

    const settings = await this.getSettings(userId);
    const prefix = settings.invoicePrefix || 'INV-2026-';
    const nextNum = (settings.nextInvoiceNumber || 1001) + 1;

    const duplicatedData: Partial<Invoice> = {
      ...source,
      invoiceNumber: `${prefix}${nextNum}`,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'DRAFT',
      amountPaid: 0,
      balanceDue: source.grandTotal,
      payments: [],
    };

    return await this.createInvoice(userId, duplicatedData);
  },

  async deleteInvoice(userId: string, invoiceId: string): Promise<void> {
    const invoices = getLocalData<Invoice[]>(userId, 'invoices', []);
    const filtered = invoices.filter((i) => i.id !== invoiceId);
    setLocalData(userId, 'invoices', filtered);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'invoices', invoiceId);
        await deleteDoc(ref);
      } catch (err) {
        console.warn('Firestore deleteInvoice error:', err);
      }
    }
  },

  async recordPayment(userId: string, invoiceId: string, paymentData: any): Promise<Invoice> {
    const invoices = getLocalData<Invoice[]>(userId, 'invoices', []);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');

    const inv = invoices[idx];
    const payAmount = Number(paymentData.amount) || 0;

    const newPayment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      amount: payAmount,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
      transactionRef: paymentData.transactionRef || '',
      notes: paymentData.notes || '',
    };

    const currentPayments = inv.payments || [];
    const updatedPayments = [newPayment, ...currentPayments];

    const newAmountPaid = Math.round((inv.amountPaid + payAmount) * 100) / 100;
    const newBalanceDue = Math.round(Math.max(0, inv.grandTotal - newAmountPaid) * 100) / 100;

    let newStatus = inv.status;
    if (newBalanceDue <= 0.01) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIALLY_PAID';
    }

    const updatedInvoice: Invoice = {
      ...inv,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      status: newStatus as any,
      payments: updatedPayments,
      updatedAt: new Date().toISOString(),
    };

    invoices[idx] = updatedInvoice;
    setLocalData(userId, 'invoices', invoices);

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, 'users', userId, 'invoices', invoiceId);
        await setDoc(ref, updatedInvoice, { merge: true });
      } catch (err) {
        console.warn('Firestore recordPayment error:', err);
      }
    }

    return updatedInvoice;
  },

  // ==========================================
  // DASHBOARD AGGREGATES
  // ==========================================
  async getDashboardData(userId: string): Promise<DashboardData> {
    const { invoices } = await this.getInvoices(userId);

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
    const unpaidInvoices = invoices.filter((i) => ['UNPAID', 'SENT', 'DRAFT'].includes(i.status)).length;
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE').length;
    const partiallyPaidInvoices = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;

    const totalRevenue = Math.round(invoices.reduce((sum, i) => sum + i.amountPaid, 0) * 100) / 100;
    const pendingPayments = Math.round(invoices.reduce((sum, i) => sum + i.balanceDue, 0) * 100) / 100;
    const totalBilled = Math.round(invoices.reduce((sum, i) => sum + i.grandTotal, 0) * 100) / 100;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; billed: number; received: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, { month: label, billed: 0, received: 0 });
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key)!;
        item.billed = Math.round((item.billed + inv.grandTotal) * 100) / 100;
      }

      (inv.payments || []).forEach((p) => {
        const pd = new Date(p.paymentDate);
        const pKey = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(pKey)) {
          const item = monthlyMap.get(pKey)!;
          item.received = Math.round((item.received + p.amount) * 100) / 100;
        }
      });
    });

    const recentActivity: any[] = [];
    invoices.forEach((inv) => {
      recentActivity.push({
        id: `act-inv-${inv.id}`,
        type: 'invoice_created',
        title: `Invoice ${inv.invoiceNumber} created`,
        description: `Billed ${inv.currencySymbol}${inv.grandTotal.toLocaleString()} to ${inv.clientName || 'Client'}`,
        date: inv.createdAt,
        amount: inv.grandTotal,
        currencySymbol: inv.currencySymbol,
      });

      (inv.payments || []).forEach((p) => {
        recentActivity.push({
          id: `act-pay-${p.id}`,
          type: 'payment_received',
          title: `Payment received for ${inv.invoiceNumber}`,
          description: `Received ${inv.currencySymbol}${p.amount.toLocaleString()} via ${p.paymentMethod}`,
          date: p.paymentDate,
          amount: p.amount,
          currencySymbol: inv.currencySymbol,
        });
      });
    });

    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      metrics: {
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        partiallyPaidInvoices,
        totalRevenue,
        pendingPayments,
        totalBilled,
      },
      recentInvoices: invoices.slice(0, 6),
      monthlyRevenue: Array.from(monthlyMap.values()),
      statusDistribution: [
        { status: 'Paid', count: paidInvoices, color: '#10B981' },
        { status: 'Partially Paid', count: partiallyPaidInvoices, color: '#F59E0B' },
        { status: 'Unpaid / Sent', count: unpaidInvoices, color: '#3B82F6' },
        { status: 'Overdue', count: overdueInvoices, color: '#EF4444' },
      ],
      recentActivity: recentActivity.slice(0, 6),
    };
  },
};

