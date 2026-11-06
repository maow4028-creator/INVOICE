import React, { useState } from 'react';
import { X, UserPlus, Building } from 'lucide-react';
import { Client } from '../../types/index.js';
import { api } from '../../services/api.js';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName && !name) {
      setError('Please provide at least a Business Name or Contact Person Name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.createClient({
        businessName,
        name: name || businessName,
        email,
        phone,
        billingAddress,
        shippingAddress,
        gstin,
        pan,
        notes,
      });

      onClientCreated(res.client);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DCE5EB] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-[#DCE5EB] bg-[#F5F7F9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EAF6FC] text-[#55B9E8] rounded-lg">
              <UserPlus className="w-5 h-5 text-[#123B5D]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#123B5D]">Add New Client</h3>
              <p className="text-xs text-[#718596]">Save client details for fast invoice auto-population</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#718596] hover:text-[#183247] p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Client Business / Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="billing@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              placeholder="Street address, City, State, Postal code, Country"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Shipping Address (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Leave blank if same as billing address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                PAN Number (Optional)
              </label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Net 30 preference, special instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8]"
            />
          </div>

          <div className="pt-3 border-t border-[#DCE5EB] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DCE5EB] text-xs font-semibold text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

