# Invoicify Pro — Premium Business Invoice Generator Web Application

An enterprise-grade, luxury SaaS invoice generator and financial workspace built with **React 19**, **TypeScript**, **Tailwind CSS**, **Firebase (Auth & Firestore)**, and **Node.js / Express**.

Designed with the specified luxury color palette: **Primary White (`#FFFFFF`)**, **Sky Blue (`#55B9E8`)**, **Deep Navy (`#123B5D`)**, **Light Blue (`#EAF6FC`)**, **Soft Grey (`#F5F7F9`)**, and **Border Grey (`#DCE5EB`)**.

---

## 🌟 Key Capabilities

### 1. 🔐 Firebase Authentication & User-Isolated Invoices
- **Mandatory Authentication**: Users must sign up or sign in before creating or viewing invoices.
- **Supported Providers**:
  - Email & Password Sign Up / Sign In
  - Google Sign-In
  - Password Reset via Email
  - Instant 1-Click Demo Login
- **Cloud & Local Persistence**: Every invoice, client, product, payment, and business profile is linked strictly to the user's account (`userId` / `uid`). When users sign out and sign in later (even from another device or browser), their data is preserved and retrieved.
- **Custom Firebase Keys**: Plug in your own Firebase project credentials via `.env` or directly through the in-app **Firebase Project Setup modal**.

### 2. 🚀 GitHub Pages & Static Hosting Ready
- Configured with relative base path (`base: './'`) in `vite.config.ts` to ensure assets load without 404 errors on GitHub Pages subpaths (`https://<username>.github.io/<repo>/`).
- Includes **`.github/workflows/deploy.yml`** for automated GitHub Actions deployment on every `git push`.
- Generates `404.html` SPA fallback so page refreshes work properly on GitHub Pages.

### 3. 🎨 4 High-Fidelity Invoice Templates
- **Modern Blue**: Clean white card, deep navy & sky blue headers, structured summary cards.
- **Minimal White**: Ultra-clean, Scandinavian editorial look with razor-thin borders and refined typography.
- **Corporate Professional**: Formal corporate letterhead style, bold divider rules, structured grid, and boxed wire remittance details.
- **Elegant Business**: Deep navy executive banner across the header, dual-tone subtotal cards, and gold/sky-blue contrast.
- **Custom Accent Color Picker & Typography Selector**: Choose custom brand colors and switch between Inter, Outfit, Playfair Display, and Space Grotesk.
- **Scan-to-Pay UPI QR Code**: Automatically generates a valid UPI QR code on the invoice for mobile payment clearance.

### 4. ⚡ Instant Decimal Calculation Engine
- Dynamic decimal precision arithmetic preventing floating-point rounding bugs.
- Itemized quantity, unit rate, tax percentage (0%, 5%, 12%, 18%, 28%), item discount, and row total.
- Invoice-level discounts (percentage or flat currency), shipping fees, and additional charges.
- Real-time Subtotal, Tax Total, Grand Total, Amount Paid, and Balance Due.

### 5. 📄 High-Precision PDF Generation & Printing
- **Retina 2x A4 PDF Generation**: Built with `jspdf` and `html2canvas` for vector-crisp lines, logos, and typography without text truncation.
- **Native Browser Print**: Dedicated `@media print` stylesheets that strip away web dashboard UI, rendering an immaculate print on physical paper or PDF printer.
- **Instant Sharing**: 1-click sharing to WhatsApp and Email with formatted invoice summaries.

### 6. 💳 End-to-End Payment Tracking
- Record partial or full payments with date, payment method, transaction reference, and notes.
- Automatic status transitions: `UNPAID` / `SENT` ➔ `PARTIALLY_PAID` ➔ `PAID`.
- Confetti celebration when an invoice reaches zero balance due!

---

## 📁 Project Structure

```
d:\Antigavity\
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Pages CI/CD workflow
├── client/                       # Frontend Application (Vite + React 19 + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── invoice/
│   │   │   │   └── InvoiceTemplates.tsx   # 4 Professional Invoice Designs & UPI QR
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx             # Global search, notifications, profile
│   │   │   │   └── Sidebar.tsx            # Responsive navigation drawer
│   │   │   └── modals/
│   │   │       ├── AddClientModal.tsx     # Inline client creator
│   │   │       ├── InvoicePreviewModal.tsx# PDF download, print, WhatsApp/email share
│   │   │       └── RecordPaymentModal.tsx # Payment tracking & confetti
│   │   ├── context/
│   │   │   └── AuthContext.tsx            # Firebase Auth & Session state
│   │   ├── services/
│   │   │   ├── firebase.ts                # Firebase Auth & Firestore initialization
│   │   │   ├── firebaseData.ts            # User-isolated data store for invoices
│   │   │   └── api.ts                     # API client interface
│   │   ├── types/
│   │   │   └── index.ts                   # Comprehensive TypeScript definitions
│   │   ├── utils/
│   │   │   ├── csv.ts                     # CSV spreadsheet export utility
│   │   │   ├── pdf.ts                     # High-res A4 PDF export & print engine
│   │   │   └── qr.ts                      # UPI QR code generator
│   │   ├── views/
│   │   │   ├── AllInvoicesView.tsx        # Filterable/sortable invoice table
│   │   │   ├── AuthView.tsx               # Firebase Login, Register, Google & Demo
│   │   │   ├── BusinessProfileView.tsx    # Company info & logo upload
│   │   │   ├── ClientsView.tsx            # Client directory & statement
│   │   │   ├── CreateInvoiceView.tsx      # Dual-mode live invoice editor
│   │   │   ├── DashboardView.tsx          # Real database metrics & charts
│   │   │   ├── ProductsView.tsx           # Reusable items catalog
│   │   │   └── SettingsView.tsx           # Defaults & account security
│   │   ├── App.tsx                        # Main application shell
│   │   ├── index.css                      # Tailwind styles & print CSS
│   │   └── main.tsx                       # React DOM entry
│   ├── index.html                         # Google Fonts & Meta tags
│   └── vite.config.ts                     # Vite + Tailwind + GitHub Pages base: './'
│
├── server/                       # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma                  # Relational database models
│   │   └── seed.ts                        # Realistic demo data seeder
│   └── src/index.ts                       # Express server
│
├── .gitignore                             # Clean Git repository ignore file
├── .env.example                           # Sample environment configuration
├── package.json                           # Root monorepo scripts
└── README.md                              # Complete documentation
```

---

## 🌐 Running Locally

The application is currently hosted and running locally:
- **Development App (with HMR)**: [http://localhost:5173](http://localhost:5173)
- **Production Hosted Build**: [http://localhost:4173](http://localhost:4173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Manual Commands
```powershell
# Run the React Client:
npm run client

# Build the Static Site:
npm run build

# Host / Preview the Production Build:
npm run host
```

---

## 🚢 Deploying to GitHub Pages

1. **Push to GitHub**:
   Initialize git and push your project to a GitHub repository:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: Invoicify Pro with Firebase Auth"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** ➔ **Pages**.
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. **Automatic Deployment**:
   The included `.github/workflows/deploy.yml` workflow will automatically build the static application and publish it to `https://<your-username>.github.io/<your-repo-name>/`.
