import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ArrowRight,
  X,
  CreditCard,
  RefreshCw,
  Building,
} from 'lucide-react';
import { Client, Invoice } from '../types/index.js';
import { api } from '../services/api.js';
import { AddClientModal } from '../components/modals/AddClientModal.js';

interface ClientsViewProps {
  onCreateInvoiceForClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onCreateInvoiceForClient,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await api.getClients();
      setClients(res.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenClientDetails = async (client: Client) => {
    try {
      setIsLoadingDetails(true);
      const res = await api.getClient(client.id);
      setSelectedClientDetails(res);
    } catch (err) {
      console.error('Failed to fetch client profile:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.businessName || client.name}?`)) {
      return;
    }

    try {
      await api.deleteClient(client.id);
      fetchClients();
      if (selectedClientDetails?.client.id === client.id) {
        setSelectedClientDetails(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete client.');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Client Management
          </h1>
          <p className="text-xs text-[#718596] mt-0.5">
            Maintain your customer directory, addresses, tax IDs and lifetime invoice statements.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all"
        >
          <Plus className="w-4 h-4 text-[#55B9E8]" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE5EB] shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
          <input
            type="text"
            placeholder="Search clients by name, business or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] placeholder-[#718596] focus:outline-none focus:border-[#55B9E8]"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="p-16 flex justify-center">
          <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#DCE5EB] text-center shadow-xs">
          <Users className="w-12 h-12 text-[#718596] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[#183247]">No Clients Found</h3>
          <p className="text-xs text-[#718596] mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search query.' : 'Add your first client to streamline invoicing.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Add New Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-5 rounded-2xl border border-[#DCE5EB] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF6FC] border border-[#55B9E8]/30 flex items-center justify-center text-[#123B5D] font-bold text-sm">
                      {(client.businessName || client.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#123B5D] leading-tight">
                        {client.businessName || client.name}
                      </h3>
                      {client.businessName && client.name && (
                        <p className="text-xs text-[#718596]">{client.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-1 text-[#718596] hover:text-[#123B5D] hover:bg-slate-100 rounded"
                      title="Edit Client"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#718596] my-4">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#55B9E8] shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#55B9E8] shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.billingAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#55B9E8] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.billingAddress}</span>
                    </div>
                  )}
                </div>

                {/* Lifetime metrics banner */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#F5F7F9] rounded-xl border border-[#DCE5EB] text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-[#718596] block">Invoices</span>
                    <span className="font-bold text-[#183247]">{client.totalInvoices || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718596] block">Billed</span>
                    <span className="font-bold text-[#183247]">₹{(client.totalBilled || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718596] block">Balance</span>
                    <span className={`font-bold ${(client.totalPending || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₹{(client.totalPending || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#DCE5EB]">
                <button
                  onClick={() => handleOpenClientDetails(client)}
                  className="text-xs font-semibold text-[#55B9E8] hover:text-[#123B5D] transition-colors"
                >
                  View Statement
                </button>

                <button
                  onClick={() => onCreateInvoiceForClient(client)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <span>New Invoice</span>
                  <ArrowRight className="w-3 h-3 text-[#55B9E8]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Statement / History Drawer Modal */}
      {selectedClientDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DCE5EB] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#DCE5EB] bg-[#F5F7F9]">
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">
                  {selectedClientDetails.client.businessName || selectedClientDetails.client.name}
                </h3>
                <p className="text-xs text-[#718596]">Client Ledger & Invoice History</p>
              </div>
              <button
                onClick={() => setSelectedClientDetails(null)}
                className="p-1.5 text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#EAF6FC] rounded-xl border border-[#DCE5EB]">
                  <span className="text-xs text-[#718596]">Total Billed</span>
                  <p className="text-xl font-bold text-[#123B5D]">
                    ₹{selectedClientDetails.stats.totalBilled.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-700">Total Paid</span>
                  <p className="text-xl font-bold text-emerald-700">
                    ₹{selectedClientDetails.stats.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-700">Outstanding Balance</span>
                  <p className="text-xl font-bold text-amber-700">
                    ₹{selectedClientDetails.stats.balanceDue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                    Invoices ({selectedClientDetails.client.invoices.length})
                  </h4>
                  <button
                    onClick={() => {
                      const c = selectedClientDetails.client;
                      setSelectedClientDetails(null);
                      onCreateInvoiceForClient(c);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#55B9E8] hover:text-[#123B5D]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Invoice for Client
                  </button>
                </div>

                <div className="border border-[#DCE5EB] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F7F9] text-[#718596] uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EB]">
                      {selectedClientDetails.client.invoices.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#123B5D]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-[#718596]">
                            {new Date(inv.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-[#718596]">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            {inv.currencySymbol}{inv.grandTotal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-amber-600">
                            {inv.currencySymbol}{inv.balanceDue.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <AddClientModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onClientCreated={() => fetchClients()}
        />
      )}
    </div>
  );
};

