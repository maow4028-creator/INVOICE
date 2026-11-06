import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  onToggleSidebar: () => void;
  onCreateInvoice: () => void;
  onSearch?: (query: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onCreateInvoice,
  onSearch,
  setCurrentTab,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Payment Received',
      desc: 'Invoice INV-2026-1002 marked as partially paid (₹60,000)',
      time: '10m ago',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      id: 2,
      title: 'Invoice Sent',
      desc: 'INV-2026-1003 sent to Nova Commerce Corp',
      time: '2h ago',
      icon: FileText,
      color: 'text-[#55B9E8]',
    },
    {
      id: 3,
      title: 'System Ready',
      desc: 'All invoice calculation engines and PDF generators online',
      time: 'Today',
      icon: AlertCircle,
      color: 'text-[#123B5D]',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    setCurrentTab('invoices');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#DCE5EB] flex items-center justify-between px-4 sm:px-8 no-print">
      {/* Left items: Mobile menu & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
          <input
            type="text"
            placeholder="Search invoices, clients, or numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] placeholder-[#718596] focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/30 focus:border-[#55B9E8] transition-all"
          />
        </form>
      </div>

      {/* Right items: Primary Action, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Create Invoice Primary Button */}
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all group"
        >
          <Plus className="w-4 h-4 text-[#55B9E8] group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Create Invoice</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#718596] hover:text-[#123B5D] hover:bg-[#F5F7F9] rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#55B9E8] rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#DCE5EB] py-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#DCE5EB] flex items-center justify-between">
                <span className="text-xs font-bold text-[#123B5D]">Notifications</span>
                <span className="text-[10px] bg-[#EAF6FC] text-[#55B9E8] font-bold px-1.5 py-0.5 rounded">
                  3 New
                </span>
              </div>
              <div className="divide-y divide-[#DCE5EB]/60 max-h-64 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-[#F5F7F9] transition-colors flex items-start gap-3 cursor-pointer"
                      onClick={() => setShowNotifications(false)}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                      <div className="text-xs flex-1">
                        <p className="font-semibold text-[#183247]">{n.title}</p>
                        <p className="text-[#718596] text-[11px] leading-tight mt-0.5">{n.desc}</p>
                        <span className="text-[10px] text-[#718596]/80 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[#F5F7F9] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EAF6FC] border border-[#55B9E8]/30 flex items-center justify-center text-[#123B5D] font-bold text-xs">
              {(user?.name || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#183247] leading-tight">
                {user?.name || 'Alexander Hayes'}
              </div>
              <div className="text-[10px] text-[#718596] leading-tight">Owner</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#718596] hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#DCE5EB] py-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#DCE5EB]">
                <p className="text-xs font-bold text-[#183247] truncate">{user?.name}</p>
                <p className="text-[11px] text-[#718596] truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setCurrentTab('business-profile');
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#183247] hover:bg-[#F5F7F9] transition-colors"
              >
                Business Profile
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setCurrentTab('settings');
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#183247] hover:bg-[#F5F7F9] transition-colors"
              >
                Workspace Settings
              </button>

              <div className="border-t border-[#DCE5EB] my-1" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

