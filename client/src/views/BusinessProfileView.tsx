import React, { useState, useEffect } from 'react';
import {
  Building2,
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { BusinessProfile } from '../types/index.js';
import { api } from '../services/api.js';

export const BusinessProfileView: React.FC = () => {
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    website: '',
    gstin: '',
    panNumber: '',
    registrationNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    logoUrl: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.getBusinessProfile();
      if (res.profile) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('Failed to load business profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const res = await api.updateBusinessProfile(profile);
      if (res.profile) {
        setProfile(res.profile);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Business Profile & Brand Identity
          </h1>
          <p className="text-xs text-[#718596] mt-0.5">
            Details configured here automatically appear on all newly created invoices and official documents.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Profile Saved!</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Identity */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB]">
            Company Logo & Branding
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#DCE5EB] bg-[#F5F7F9] flex items-center justify-center relative overflow-hidden group">
              {profile.logoUrl ? (
                <>
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span className="text-[10px] mt-1 font-semibold">Remove</span>
                  </button>
                </>
              ) : (
                <div className="text-center p-3">
                  <Building2 className="w-8 h-8 text-[#718596] mx-auto opacity-40" />
                  <span className="text-[10px] text-[#718596] font-semibold mt-1 block">No Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#DCE5EB] hover:bg-slate-50 text-[#183247] text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#55B9E8]" />
                <span>Upload New Logo</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#718596]">
                Recommended dimensions: 300x300px or rectangular vector. Supports PNG, JPG, SVG up to 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Core Company Details */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB]">
            Primary Business Credentials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Business / Legal Name *
              </label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Owner / Managing Director Name
              </label>
              <input
                type="text"
                value={profile.ownerName}
                onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Official Website
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              Registered Office Street Address
            </label>
            <textarea
              rows={2}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">State / Province</label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">Postal Code</label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">Country</label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>
        </div>

        {/* Tax & Registration IDs */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB]">
            Tax & Legal Identification (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                PAN Number
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={profile.panNumber}
                onChange={(e) => setProfile({ ...profile, panNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Business Registration / CIN
              </label>
              <input
                type="text"
                placeholder="e.g. U72200KA2023PTC123456"
                value={profile.registrationNumber}
                onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>
        </div>

        {/* Banking & Digital Payment Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider pb-3 border-b border-[#DCE5EB]">
            Banking & Instant UPI Settlement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank Ltd"
                value={profile.bankName}
                onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="502000..."
                value={profile.accountNumber}
                onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183247] mb-1">
                IFSC / SWIFT / Routing Code
              </label>
              <input
                type="text"
                placeholder="HDFC0000240"
                value={profile.ifscCode}
                onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono text-[#183247] focus:outline-none focus:border-[#55B9E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#183247] mb-1">
              UPI ID (Auto-generates Scan-to-Pay QR code on invoices)
            </label>
            <input
              type="text"
              placeholder="e.g. apexstudio@hdfcbank or phone@upi"
              value={profile.upiId}
              onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs font-mono font-bold text-[#55B9E8] focus:outline-none focus:border-[#55B9E8]"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#55B9E8]" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Business Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

