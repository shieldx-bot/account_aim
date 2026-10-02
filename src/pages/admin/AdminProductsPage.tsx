import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { productsApi } from '@/services/api';
import { ProductPlan, ProductCategory, usdToVnd } from '@/types';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Layers,
  DollarSign,
  Tag,
  RefreshCw,
  X,
  Save,
} from 'lucide-react';

const CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'coding', label: 'Coding AI' },
  { key: 'llm', label: 'LLM Models' },
  { key: 'design', label: 'Design & Creative' },
  { key: 'enterprise', label: 'Enterprise' },
];

export const AdminProductsPage: React.FC = () => {
  const { token } = useAuth();
  const { formatPrice, refreshProducts: refreshGlobalProducts } = useApp();

  const [products, setProducts] = useState<ProductPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    brandLogo: '/assets/logos/logo_brand_cursor.svg',
    category: 'coding' as ProductCategory,
    originalPriceVND: usdToVnd(20.0),
    currentPriceVND: usdToVnd(9.99),
    originalPriceUSD: 20.0,
    currentPriceUSD: 9.99,
    discountPercent: 50,
    stockCount: 30,
    badge: '🔥 Hot Deal',
    platformSubtext: 'Windows / macOS / Linux',
    quotaFeaturesText: 'Unlimited AI access\nUltra-fast speed\nAutomatic 1-for-1 warranty',
    fastQuota: '500 Requests/mo',
    contextWindow: '200K Tokens',
    models: 'Claude 3.7 Sonnet, GPT-4.5',
    multiDevice: 'Sync across 3 devices',
    instantDelivery: true,
    isActive: true,
  });

  // Fetch all products (including inactive for admin)
  const loadAdminProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getAll({ all: true });
      setProducts(data);
    } catch (err: any) {
      setActionError(err.message || 'Unable to load the product list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProducts();
  }, []);

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      brand: '',
      brandLogo: '/assets/logos/logo_brand_cursor.svg',
      category: 'coding',
      originalPriceVND: usdToVnd(20.0),
      currentPriceVND: usdToVnd(9.99),
      originalPriceUSD: 20.0,
      currentPriceUSD: 9.99,
      discountPercent: 50,
      stockCount: 30,
      badge: '🔥 New Release',
      platformSubtext: 'Web / Desktop App',
      quotaFeaturesText: 'Premium AI model access\nInstant response time < 2s\n1-for-1 warranty for the full term',
      fastQuota: 'Unlimited standard usage',
      contextWindow: '128K Tokens',
      models: 'GPT-4o, Claude 3.7 Sonnet',
      multiDevice: 'Sync across multiple devices',
      instantDelivery: true,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (prod: ProductPlan) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      slug: prod.slug,
      brand: prod.brand,
      brandLogo: prod.brandLogo,
      category: prod.category,
      originalPriceVND: prod.originalPriceVND,
      currentPriceVND: prod.currentPriceVND,
      originalPriceUSD: prod.originalPriceUSD,
      currentPriceUSD: prod.currentPriceUSD,
      discountPercent: prod.discountPercent,
      stockCount: prod.stockCount,
      badge: prod.badge || '',
      platformSubtext: prod.platformSubtext,
      quotaFeaturesText: (prod.quotaFeatures || []).join('\n'),
      fastQuota: prod.specs?.fastQuota || '',
      contextWindow: prod.specs?.contextWindow || '',
      models: prod.specs?.models || '',
      multiDevice: prod.specs?.multiDevice || '',
      instantDelivery: prod.instantDelivery,
      isActive: (prod as any).isActive !== undefined ? (prod as any).isActive : true,
    });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showNotification('Please sign in with an administrator account.', true);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<ProductPlan> = {
        name: formData.name,
        slug: formData.slug.toLowerCase().trim().replace(/\s+/g, '-'),
        brand: formData.brand,
        brandLogo: formData.brandLogo,
        category: formData.category,
        originalPriceVND: usdToVnd(Number(formData.originalPriceUSD)),
        currentPriceVND: usdToVnd(Number(formData.currentPriceUSD)),
        originalPriceUSD: Number(formData.originalPriceUSD),
        currentPriceUSD: Number(formData.currentPriceUSD),
        discountPercent: Number(formData.discountPercent),
        stockCount: Number(formData.stockCount),
        badge: formData.badge,
        platformSubtext: formData.platformSubtext,
        quotaFeatures: formData.quotaFeaturesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        specs: {
          fastQuota: formData.fastQuota,
          contextWindow: formData.contextWindow,
          models: formData.models,
          multiDevice: formData.multiDevice,
        },
        instantDelivery: formData.instantDelivery,
        ...( { isActive: formData.isActive } as any ),
      };

      if (editingProduct) {
        await productsApi.update(token, editingProduct.id, payload);
        showNotification(`Product "${formData.name}" updated successfully.`);
      } else {
        await productsApi.create(token, payload);
        showNotification(`Product "${formData.name}" added to the database.`);
      }

      setIsModalOpen(false);
      await loadAdminProducts();
      await refreshGlobalProducts();
    } catch (err: any) {
      showNotification(err.message || 'Error saving the product.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async (prod: ProductPlan) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the product "${prod.name}" (${prod.slug}) from the PostgreSQL database?`
    );
    if (!confirmDelete) return;

    try {
      await productsApi.delete(token, prod.id);
      showNotification(`Product "${prod.name}" deleted.`);
      await loadAdminProducts();
      await refreshGlobalProducts();
    } catch (err: any) {
      showNotification(err.message || 'Error deleting the product.', true);
    }
  };

  // Toggle quick Active status
  const handleToggleActive = async (prod: ProductPlan) => {
    if (!token) return;
    const currentActive = (prod as any).isActive !== undefined ? (prod as any).isActive : true;
    try {
      await productsApi.update(token, prod.id, {
        ...( { isActive: !currentActive } as any ),
      });
      showNotification(
        `Product "${prod.name}" ${!currentActive ? 'activated' : 'hidden'}.`
      );
      await loadAdminProducts();
      await refreshGlobalProducts();
    } catch (err: any) {
      showNotification(err.message || 'Error toggling the product status.', true);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStock = products.reduce((acc, cur) => acc + (cur.stockCount || 0), 0);
  const activeCount = products.filter((p) => (p as any).isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-status-success/15 border border-status-success/40 text-status-success text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-status-error/15 border border-status-error/40 text-status-error text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-status-warning/15 text-status-warning">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-text-primary tracking-tight">
              AgentLabduct Management (PostgreSQL Catalog)
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            All price, stock, and category changes are persisted in the PostgreSQL <code className="font-mono text-accent-cyan">products</code> table.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminProducts}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Reload from database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted">Total products</span>
          <div className="text-2xl font-black font-mono text-text-primary mt-1">
            {products.length} <span className="text-xs font-normal text-text-muted">plans</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted">Active (on sale)</span>
          <div className="text-2xl font-black font-mono text-status-success mt-1">
            {activeCount} <span className="text-xs font-normal text-text-muted">shown in store</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border-subtle">
          <span className="text-xs text-text-muted">Total automated stock</span>
          <div className="text-2xl font-black font-mono text-accent-cyan mt-1">
            {totalStock} <span className="text-xs font-normal text-text-muted">slots</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, brand, or slug..."
            className="w-full pl-9 pr-4 py-2 bg-canvas border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary-blue"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-canvas text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="rounded-2xl bg-surface border border-border-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-blue" />
            <p>Loading the product catalog from PostgreSQL...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs space-y-2">
            <Package className="w-10 h-10 mx-auto text-text-muted/40" />
            <p className="font-semibold text-text-primary">No matching products found.</p>
            <p>Try changing the keyword or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface text-text-muted uppercase text-[10px] tracking-wider border-b border-border-subtle">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product &amp; Brand</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Price (USD)</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredProducts.map((prod) => {
                  const isActive = (prod as any).isActive !== false;
                  return (
                    <tr key={prod.id} className="hover:bg-canvas/50 transition-colors">
                      {/* Product Name & Brand */}
                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.brandLogo}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-contain bg-canvas p-1 border border-border-subtle shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/logos/logo_brand_cursor.svg';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-text-primary">{prod.name}</span>
                              {prod.badge && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-cyan/15 text-accent-cyan">
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted font-mono block">
                              /{prod.slug} &bull; {prod.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-[11px] text-text-secondary capitalize">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-text-primary">
                          ${prod.currentPriceUSD.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-[#FFC439]">
                          USD (-{prod.discountPercent}%)
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            prod.stockCount > 20
                              ? 'bg-status-success/15 text-status-success'
                              : prod.stockCount > 0
                              ? 'bg-status-warning/15 text-status-warning'
                              : 'bg-status-error/15 text-status-error'
                          }`}
                        >
                          {prod.stockCount > 0 ? `${prod.stockCount} in stock` : 'Out of stock'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-status-success/15 text-status-success border border-status-success/30 hover:bg-status-success/25'
                              : 'bg-text-muted/15 text-text-muted border border-text-muted/30 hover:bg-text-muted/25'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            title="Edit product details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 rounded-lg bg-canvas hover:bg-status-error/15 border border-border-subtle text-text-muted hover:text-status-error transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary-blue/20 text-primary-blue">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product to Database'}
                  </h3>
                  <span className="text-[11px] text-text-muted font-mono">
                    PostgreSQL Table: public.products
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Product name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g.: Cursor Pro 2026"
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-sans text-xs"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    URL slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="E.g.: cursor-pro"
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-mono text-xs"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Developer (Brand) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="E.g.: Cursor AI, Anthropic, OpenAI"
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-sans text-xs"
                  />
                </div>

                {/* Brand Logo URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Brand Logo (SVG/Image URL)
                  </label>
                  <input
                    type="text"
                    value={formData.brandLogo}
                    onChange={(e) => setFormData({ ...formData, brandLogo: e.target.value })}
                    placeholder="/assets/logos/logo_brand_cursor.svg"
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-mono text-xs"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-sans text-xs cursor-pointer"
                  >
                    <option value="coding">Coding AI (Programming)</option>
                    <option value="llm">LLM Models (Chat &amp; Reasoning)</option>
                    <option value="design">Design &amp; Creative (Design)</option>
                    <option value="enterprise">Enterprise (Business)</option>
                  </select>
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Highlighted badge (Badge)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="E.g.: 🔥 Recommended for Devs"
                    className="w-full px-3.5 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-primary-blue font-sans text-xs"
                  />
                </div>
              </div>

              {/* Price & Stock Section */}
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-3">
                  Price &amp; Stock
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Price USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.currentPriceUSD}
                      onChange={(e) => setFormData({ ...formData, currentPriceUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Original price USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPriceUSD}
                      onChange={(e) => setFormData({ ...formData, originalPriceUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-muted font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Stock quantity</label>
                    <input
                      type="number"
                      value={formData.stockCount}
                      onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Quota & Specs */}
              <div className="pt-2 border-t border-border-subtle space-y-3">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Perks &amp; Technical Specs
                </span>

                <div>
                  <label className="block text-[10px] text-text-muted uppercase mb-1">
                    Feature list (one feature per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.quotaFeaturesText}
                    onChange={(e) => setFormData({ ...formData, quotaFeaturesText: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary font-sans text-xs focus:outline-none focus:border-primary-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Quota (Fast Quota)</label>
                    <input
                      type="text"
                      value={formData.fastQuota}
                      onChange={(e) => setFormData({ ...formData, fastQuota: e.target.value })}
                      placeholder="E.g.: 500 Fast Requests/mo"
                      className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Context (Context Window)</label>
                    <input
                      type="text"
                      value={formData.contextWindow}
                      onChange={(e) => setFormData({ ...formData, contextWindow: e.target.value })}
                      placeholder="E.g.: 200K Tokens"
                      className="w-full px-3 py-2 bg-canvas border border-border-subtle rounded-xl text-text-primary font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="pt-2 border-t border-border-subtle flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border-subtle text-primary-blue focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-text-primary">Visible on the website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instantDelivery}
                    onChange={(e) => setFormData({ ...formData, instantDelivery: e.target.checked })}
                    className="rounded border-border-subtle text-status-success focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-text-primary">Instant delivery, SLA &lt; 30s</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-canvas hover:bg-surface-subtle border border-border-subtle text-text-secondary text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-blue hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary-blue/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Update Database' : 'Save to Database'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
