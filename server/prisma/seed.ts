import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo database...');

  const demoEmail = 'demo@invoicepro.com';
  const hashedPassword = await bcrypt.hash('demo123456', 10);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: 'Alexander Hayes',
      email: demoEmail,
      password: hashedPassword,
      businessProfile: {
        create: {
          businessName: 'Apex Creative Studio & Technologies',
          ownerName: 'Alexander Hayes',
          email: 'billing@apexstudio.design',
          phone: '+91 98765 43210',
          address: 'Suite 402, Skyline Executive Towers, Cyber City',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India',
          website: 'https://apexstudio.design',
          gstin: '29ABCDE1234F1Z5',
          panNumber: 'ABCDE1234F',
          registrationNumber: 'U72200KA2023PTC123456',
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50200087654321',
          ifscCode: 'HDFC0000240',
          upiId: 'apexstudio@hdfcbank',
          logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        },
      },
      settings: {
        create: {
          defaultCurrency: 'INR',
          defaultCurrencySymbol: '₹',
          defaultTax: 18.0,
          defaultPaymentTerms: 'Net 30',
          invoicePrefix: 'INV-2026-',
          nextInvoiceNumber: 1005,
          defaultTemplate: 'modern-blue',
          defaultAccentColor: '#123B5D',
          defaultFontFamily: 'Inter',
          defaultNotes: 'Thank you for choosing Apex Creative Studio. We appreciate your partnership!',
          defaultTerms: '1. Please include invoice number in wire transfer narration.\n2. Invoices past due date are subject to a 1.5% monthly finance charge.\n3. Source files will be released upon full payment clearance.',
        },
      },
    },
  });

  // Clients
  const clientData = [
    {
      businessName: 'Horizon Fintech Global Ltd',
      name: 'Sarah Jenkins',
      email: 'accounts@horizonfintech.io',
      phone: '+91 98220 11223',
      billingAddress: 'Tower B, 14th Floor, World Trade Centre, Mumbai, MH 400001',
      shippingAddress: 'Tower B, 14th Floor, World Trade Centre, Mumbai, MH 400001',
      gstin: '27AAACH2345G1ZP',
      pan: 'AAACH2345G',
      notes: 'Strategic Enterprise client. Quarterly billing cycle.',
    },
    {
      businessName: 'Vanguard Health Systems',
      name: 'Dr. Rahul Mehta',
      email: 'rahul.mehta@vanguardhealth.org',
      phone: '+91 98450 99887',
      billingAddress: '42 Lotus Boulevard, Koramangala, Bengaluru, KA 560034',
      shippingAddress: '',
      gstin: '29AABCV9876K1ZY',
      pan: 'AABCV9876K',
      notes: 'Healthcare platform redesign and patient portal UX.',
    },
    {
      businessName: 'Nova Commerce Corp',
      name: 'Elena Rostova',
      email: 'finance@novacommerce.com',
      phone: '+1 (415) 890-2341',
      billingAddress: '550 Montgomery St, Suite 700, San Francisco, CA 94111',
      shippingAddress: '',
      gstin: '',
      pan: '',
      notes: 'Global DTC Brand. Preferred payment via wire transfer.',
    },
  ];

  const clients = [];
  for (const c of clientData) {
    let client = await prisma.client.findFirst({
      where: { userId: user.id, email: c.email },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: user.id,
          ...c,
        },
      });
    }
    clients.push(client);
  }

  // Saved Products & Services
  const productData = [
    {
      name: 'Full-Stack Web Application Architecture',
      description: 'End-to-end cloud platform development with React, Node.js and PostgreSQL',
      unitPrice: 125000,
      defaultTax: 18.0,
      type: 'Service',
    },
    {
      name: 'Brand Identity & Design System',
      description: 'Comprehensive design tokens, typography, component library in Figma',
      unitPrice: 65000,
      defaultTax: 18.0,
      type: 'Service',
    },
    {
      name: 'Mobile App UI/UX Design (iOS & Android)',
      description: 'High-fidelity wireframes, interactive prototypes, and developer handoff',
      unitPrice: 48000,
      defaultTax: 18.0,
      type: 'Service',
    },
    {
      name: 'Cloud Infrastructure & DevOps Setup',
      description: 'AWS/GCP automated CI/CD pipeline, Docker containerization, security hardening',
      unitPrice: 35000,
      defaultTax: 18.0,
      type: 'Service',
    },
    {
      name: 'Monthly Maintenance & Support Retainer',
      description: 'Up to 20 hours of prioritized bug fixes, updates, and SLA monitoring',
      unitPrice: 25000,
      defaultTax: 18.0,
      type: 'Service',
    },
  ];

  for (const p of productData) {
    const existing = await prisma.product.findFirst({
      where: { userId: user.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          userId: user.id,
          ...p,
        },
      });
    }
  }

  // Invoices
  const existingInvoices = await prisma.invoice.count({ where: { userId: user.id } });
  if (existingInvoices === 0) {
    // Invoice 1: Paid
    const inv1 = await prisma.invoice.create({
      data: {
        userId: user.id,
        invoiceNumber: 'INV-2026-1001',
        clientId: clients[0].id,
        clientName: clients[0].businessName,
        clientEmail: clients[0].email,
        clientPhone: clients[0].phone,
        clientAddress: clients[0].billingAddress,
        clientGstin: clients[0].gstin,
        clientPan: clients[0].pan,
        businessName: 'Apex Creative Studio & Technologies',
        businessEmail: 'billing@apexstudio.design',
        businessPhone: '+91 98765 43210',
        businessAddress: 'Suite 402, Skyline Executive Towers, Cyber City, Bengaluru, KA',
        businessGstin: '29ABCDE1234F1Z5',
        bankDetails: 'HDFC Bank Ltd | A/C: 50200087654321 | IFSC: HDFC0000240',
        upiId: 'apexstudio@hdfcbank',
        invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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
        items: {
          create: [
            {
              name: 'Full-Stack Web Application Architecture',
              description: 'Enterprise fintech dashboard and client portal backend APIs',
              quantity: 1,
              unitPrice: 125000,
              taxPercentage: 18.0,
              discount: 0,
              total: 147500,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: inv1.id,
        userId: user.id,
        amount: 147500,
        paymentDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Bank Transfer',
        transactionRef: 'NEFT-HDFC-99882211',
        notes: 'Full payment received.',
      },
    });

    // Invoice 2: Partially Paid
    const inv2 = await prisma.invoice.create({
      data: {
        userId: user.id,
        invoiceNumber: 'INV-2026-1002',
        clientId: clients[1].id,
        clientName: clients[1].businessName,
        clientEmail: clients[1].email,
        clientPhone: clients[1].phone,
        clientAddress: clients[1].billingAddress,
        clientGstin: clients[1].gstin,
        clientPan: clients[1].pan,
        businessName: 'Apex Creative Studio & Technologies',
        businessEmail: 'billing@apexstudio.design',
        businessPhone: '+91 98765 43210',
        businessAddress: 'Suite 402, Skyline Executive Towers, Cyber City, Bengaluru, KA',
        businessGstin: '29ABCDE1234F1Z5',
        bankDetails: 'HDFC Bank Ltd | A/C: 50200087654321 | IFSC: HDFC0000240',
        upiId: 'apexstudio@hdfcbank',
        invoiceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        paymentTerms: 'Net 30',
        currency: 'INR',
        currencySymbol: '₹',
        status: 'PARTIALLY_PAID',
        template: 'corporate-pro',
        accentColor: '#55B9E8',
        fontFamily: 'Inter',
        subtotal: 113000,
        discountType: 'percentage',
        discountValue: 5,
        discountAmount: 5650,
        taxTotal: 19323,
        shipping: 0,
        additionalCharges: 0,
        grandTotal: 126673,
        amountPaid: 60000,
        balanceDue: 66673,
        notes: 'Phase 1 deliverables accepted. Balance due upon Phase 2 signoff.',
        terms: 'Standard net terms apply.',
        items: {
          create: [
            {
              name: 'Brand Identity & Design System',
              description: 'Visual system and Figma tokens for clinical portal',
              quantity: 1,
              unitPrice: 65000,
              taxPercentage: 18.0,
              discount: 0,
              total: 76700,
              sortOrder: 0,
            },
            {
              name: 'Mobile App UI/UX Design (iOS & Android)',
              description: 'Patient telemetry screens and doctor appointment workflow',
              quantity: 1,
              unitPrice: 48000,
              taxPercentage: 18.0,
              discount: 0,
              total: 56640,
              sortOrder: 1,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: inv2.id,
        userId: user.id,
        amount: 60000,
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paymentMethod: 'UPI',
        transactionRef: 'UPI-REF-238492048',
        notes: 'Initial 50% milestone advance payment.',
      },
    });

    // Invoice 3: Unpaid / Sent
    await prisma.invoice.create({
      data: {
        userId: user.id,
        invoiceNumber: 'INV-2026-1003',
        clientId: clients[2].id,
        clientName: clients[2].businessName,
        clientEmail: clients[2].email,
        clientPhone: clients[2].phone,
        clientAddress: clients[2].billingAddress,
        businessName: 'Apex Creative Studio & Technologies',
        businessEmail: 'billing@apexstudio.design',
        businessPhone: '+91 98765 43210',
        businessAddress: 'Suite 402, Skyline Executive Towers, Cyber City, Bengaluru, KA',
        businessGstin: '29ABCDE1234F1Z5',
        bankDetails: 'HDFC Bank Ltd | A/C: 50200087654321 | IFSC: HDFC0000240',
        upiId: 'apexstudio@hdfcbank',
        invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        paymentTerms: 'Net 15',
        currency: 'USD',
        currencySymbol: '$',
        status: 'SENT',
        template: 'elegant-business',
        accentColor: '#123B5D',
        fontFamily: 'Inter',
        subtotal: 1850,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxTotal: 0,
        shipping: 0,
        additionalCharges: 0,
        grandTotal: 1850,
        amountPaid: 0,
        balanceDue: 1850,
        notes: 'Monthly infrastructure management retainer - March 2026.',
        terms: 'International wire transfer instructions attached.',
        items: {
          create: [
            {
              name: 'Cloud Infrastructure & DevOps Setup',
              description: 'Multi-region AWS Kubernetes deployment and monitoring',
              quantity: 1,
              unitPrice: 1850,
              taxPercentage: 0,
              discount: 0,
              total: 1850,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    // Invoice 4: Draft
    await prisma.invoice.create({
      data: {
        userId: user.id,
        invoiceNumber: 'INV-2026-1004',
        clientId: clients[0].id,
        clientName: clients[0].businessName,
        clientEmail: clients[0].email,
        clientPhone: clients[0].phone,
        clientAddress: clients[0].billingAddress,
        businessName: 'Apex Creative Studio & Technologies',
        businessEmail: 'billing@apexstudio.design',
        businessPhone: '+91 98765 43210',
        businessAddress: 'Suite 402, Skyline Executive Towers, Cyber City, Bengaluru, KA',
        businessGstin: '29ABCDE1234F1Z5',
        bankDetails: 'HDFC Bank Ltd | A/C: 50200087654321 | IFSC: HDFC0000240',
        upiId: 'apexstudio@hdfcbank',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTerms: 'Net 30',
        currency: 'INR',
        currencySymbol: '₹',
        status: 'DRAFT',
        template: 'minimal-white',
        accentColor: '#183247',
        fontFamily: 'Inter',
        subtotal: 25000,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxTotal: 4500,
        shipping: 0,
        additionalCharges: 0,
        grandTotal: 29500,
        amountPaid: 0,
        balanceDue: 29500,
        notes: 'Draft retainer proposal for upcoming sprint.',
        terms: 'Subject to contract signoff.',
        items: {
          create: [
            {
              name: 'Monthly Maintenance & Support Retainer',
              description: '20 hours engineering support for fintech portal',
              quantity: 1,
              unitPrice: 25000,
              taxPercentage: 18.0,
              discount: 0,
              total: 29500,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

