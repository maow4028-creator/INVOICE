import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Users,
  Package,
  Building2,
  Settings,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-invoice', label: 'Create Invoice', icon: FilePlus2, isHighlighted: true },
    { id: 'invoices', label: 'All Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'products', label: 'Products & Services', icon: Package },
    { id: 'business-profile', label: 'Business Profile', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#DCE5EB] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#DCE5EB] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#123B5D] to-[#1E4E75] flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5 text-[#55B9E8]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#123B5D]">
                Invoicify
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EAF6FC] text-[#55B9E8] rounded-md border border-[#55B9E8]/30">
                PRO
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#718596]">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#123B5D] text-white shadow-sm shadow-[#123B5D]/20'
                    : 'text-[#183247] hover:bg-[#F5F7F9] hover:text-[#123B5D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#55B9E8]' : 'text-[#718596]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.isHighlighted && !isActive && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#EAF6FC] text-[#55B9E8] rounded-md border border-[#55B9E8]/30">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User & Plan Card */}
        <div className="p-4 border-t border-[#DCE5EB] bg-[#F5F7F9]">
          <div className="p-3 bg-white rounded-xl border border-[#DCE5EB] shadow-xs mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#123B5D]">Pro Business</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                <Sparkles className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-[11px] text-[#718596] mt-1 truncate">
              {user?.email || 'demo@invoicepro.com'}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

