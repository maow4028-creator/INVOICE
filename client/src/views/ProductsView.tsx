import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Tag,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../types/index.js';
import { api } from '../services/api.js';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Product' | 'Service'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [defaultTax, setDefaultTax] = useState<number>(18);
  const [type, setType] = useState<'Product' | 'Service'>('Service');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setUnitPrice(0);
    setDefaultTax(18);
    setType('Service');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setUnitPrice(p.unitPrice);
    setDefaultTax(p.defaultTax);
    setType(p.type);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product or service name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name,
          description,
          unitPrice,
          defaultTax,
          type,
        });
      } else {
        await api.createProduct({
          name,
          description,
          unitPrice,
          defaultTax,
          type,
        });
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.deleteProduct(p.id);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#DCE5EB] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Products & Services Catalog
          </h1>
          <p className="text-xs text-[#718596] mt-0.5">
            Save predefined billable items and services to instantly insert them into invoices.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all"
        >
          <Plus className="w-4 h-4 text-[#55B9E8]" />
          <span>Add Product / Service</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE5EB] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718596]" />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-xl text-xs text-[#183247] placeholder-[#718596] focus:outline-none focus:border-[#55B9E8]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          {(['ALL', 'Service', 'Product'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                typeFilter === t
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#718596] hover:text-[#183247] hover:bg-[#F5F7F9]'
              }`}
            >
              {t === 'ALL' ? 'All Types' : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-[#DCE5EB] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <RefreshCw className="w-6 h-6 text-[#55B9E8] animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-[#718596] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[#183247]">No Items Found</h3>
            <p className="text-xs text-[#718596] mt-1 max-w-sm mx-auto">
              Add products or services to speed up invoice drafting.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] border-b border-[#DCE5EB] text-[#718596] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Default Tax</th>
                  <th className="py-3.5 px-4 text-right">Standard Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EB]/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F7F9]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#183247]">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.type === 'Service'
                            ? 'bg-[#EAF6FC] text-[#55B9E8] border border-[#55B9E8]/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#718596] max-w-xs truncate">
                      {p.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#718596]">
                      {p.defaultTax}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#123B5D]">
                      ₹{p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-[#718596] hover:text-[#123B5D] hover:bg-[#EAF6FC] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#DCE5EB] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#DCE5EB] bg-[#F5F7F9]">
              <h3 className="text-base font-bold text-[#123B5D]">
                {editingProduct ? 'Edit Catalog Item' : 'New Catalog Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#718596] hover:text-[#183247] p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Item / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Application UI/UX Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs font-semibold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#183247] mb-1">
                    Item Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Physical Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#183247] mb-1">
                    Standard Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs font-bold text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Default Tax Rate (%)
                </label>
                <select
                  value={defaultTax}
                  onChange={(e) => setDefaultTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#183247] focus:outline-none focus:border-[#55B9E8]"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183247] mb-1">
                  Default Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Standard deliverables, deliverables description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DCE5EB] rounded-lg text-xs text-[#718596] focus:outline-none focus:border-[#55B9E8] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#DCE5EB] text-xs font-semibold text-[#718596] hover:text-[#183247] rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

