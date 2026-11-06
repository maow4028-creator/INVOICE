import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Navbar } from './components/layout/Navbar.js';
import { DashboardView } from './views/DashboardView.js';
import { CreateInvoiceView } from './views/CreateInvoiceView.js';
import { AllInvoicesView } from './views/AllInvoicesView.js';
import { ClientsView } from './views/ClientsView.js';
import { ProductsView } from './views/ProductsView.js';
import { BusinessProfileView } from './views/BusinessProfileView.js';
import { SettingsView } from './views/SettingsView.js';
import { AuthView } from './views/AuthView.js';
import { Invoice, Client } from './types/index.js';
import { RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#123B5D] flex items-center justify-center text-white shadow-lg animate-pulse">
            <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
          </div>
          <p className="text-xs font-semibold text-[#718596]">Loading Invoicify Pro Suite...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleStartCreateInvoice = () => {
    setEditingInvoice(null);
    setCurrentTab('create-invoice');
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCurrentTab('create-invoice');
  };

  const handleCreateInvoiceForClient = (client: Client) => {
    // Generate draft invoice object with pre-filled client
    const draftForClient: Partial<Invoice> = {
      clientId: client.id,
      clientName: client.businessName || client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      clientAddress: client.billingAddress,
      clientGstin: client.gstin,
      clientPan: client.pan,
    };
    setEditingInvoice(draftForClient as Invoice);
    setCurrentTab('create-invoice');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'create-invoice') setEditingInvoice(null);
          setCurrentTab(tab);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateInvoice={handleStartCreateInvoice}
          onSearch={(q) => {
            setSearchQuery(q);
            setCurrentTab('invoices');
          }}
          setCurrentTab={setCurrentTab}
        />

        {/* Page Content View Router */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onCreateInvoice={handleStartCreateInvoice}
              onViewAllInvoices={() => setCurrentTab('invoices')}
              onEditInvoice={handleStartEditInvoice}
            />
          )}

          {currentTab === 'create-invoice' && (
            <CreateInvoiceView
              initialInvoice={editingInvoice}
              onInvoiceSaved={(saved) => {
                setEditingInvoice(null);
                setCurrentTab('invoices');
              }}
              onCancel={() => {
                setEditingInvoice(null);
                setCurrentTab('invoices');
              }}
            />
          )}

          {currentTab === 'invoices' && (
            <AllInvoicesView
              onCreateInvoice={handleStartCreateInvoice}
              onEditInvoice={handleStartEditInvoice}
              initialSearchQuery={searchQuery}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView onCreateInvoiceForClient={handleCreateInvoiceForClient} />
          )}

          {currentTab === 'products' && <ProductsView />}

          {currentTab === 'business-profile' && <BusinessProfileView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
