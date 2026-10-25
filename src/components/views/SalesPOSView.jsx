import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  Receipt, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Activity, 
  CheckCircle2, 
  Code2, 
  Eye, 
  Clock 
} from 'lucide-react';
import { getSalesLog, recordSale } from '../../services/salesService';
import { getProducts } from '../../services/productService';

export default function SalesPOSView({ onOpenInspector }) {
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'pos'
  const [salesLog, setSalesLog] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for log
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // POS State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('UPI');
  const [productSearch, setProductSearch] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, prods] = await Promise.all([
        getSalesLog({
          searchTerm,
          paymentMethod,
          fromDate,
          toDate
        }),
        getProducts()
      ]);
      setSalesLog(res || []);
      setCatalogProducts(prods || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [searchTerm, paymentMethod, fromDate, toDate]);

  // POS Cart handlers
  const handleAddToCart = (product) => {
    const existingIndex = cart.findIndex(c => c.product_id === product.product_id);
    const unitPrice = parseFloat(product.unit_price ?? product.selling_price ?? 0);
    const buyPrice = parseFloat(product.cost_price ?? 0);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          sku: product.sku,
          product_name: product.product_name,
          unit_price: unitPrice,
          buy_price: buyPrice,
          quantity: 1,
          shelf_code: product.shelf_code || 'RACK-A1-S1'
        }
      ]);
    }
  };

  const handleUpdateQty = (prodId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === prodId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveFromCart = (prodId) => {
    setCart(prev => prev.filter(item => item.product_id !== prodId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = Math.max(0, subtotal + tax - (parseFloat(discountAmount) || 0));

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Cart is empty! Add products first.");
      return;
    }

    try {
      const res = await recordSale({
        customer_name: customerName || 'Walk-in Customer',
        payment_method: posPaymentMethod,
        subtotal,
        tax_amount: tax,
        discount_amount: parseFloat(discountAmount) || 0,
        total_amount: total,
        cashier_name: 'Avadhut K.',
        items: cart
      });

      setCart([]);
      setCustomerName('');
      setDiscountAmount(0);
      setSelectedReceipt(res.receipt);
      loadSales();
      setActiveTab('log');
    } catch (err) {
      alert("Error completing sale: " + err.message);
    }
  };

  // KPI calculations for Sales Log (inspired by sowgandh.vercel.app)
  const totalUnitsSold = salesLog.reduce((sum, s) => sum + (s.total_units_sold || 0), 0);
  const totalCostBasis = salesLog.reduce((sum, s) => sum + (s.total_cost_basis || 0), 0);
  const totalGrossRevenue = salesLog.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalRealizedProfit = salesLog.reduce((sum, s) => sum + (s.realized_profit || 0), 0);

  const filteredCatalogForPOS = catalogProducts.filter(p => 
    (p.product_name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header with Tab switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Sales Counter & Billing POS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Record customer sales, deduct shelf inventory, and track realized gross profits.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('sales')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <div className="flex items-center bg-dark-800 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'log' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales History Log
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'pos' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              New POS Sale
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Sales Summary Widgets (matching sowgandh.vercel.app sales log) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-5 flex items-center justify-between glass-card-hover">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units Sold</span>
                <div className="text-2xl font-black text-white mt-1">{totalUnitsSold}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Total items checked out</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex items-center justify-between glass-card-hover">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Basis</span>
                <div className="text-2xl font-black text-white mt-1">₹{totalCostBasis.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Wholesale purchase value</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex items-center justify-between glass-card-hover">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Net Profit Realized</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalRealizedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Gross sales margin booked</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search receipt number or customer name..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-input text-white bg-dark-700 cursor-pointer w-auto"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="CASH">Cash</option>
              </select>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                title="From Date"
                className="form-input text-white bg-dark-700 w-auto text-xs"
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                title="To Date"
                className="form-input text-white bg-dark-700 w-auto text-xs"
              />
            </div>
          </div>

          {/* Sales Log Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Audit Log & Receipts</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{salesLog.length} Transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                    <th className="p-4">Receipt & Customer</th>
                    <th className="p-4">Date Sold</th>
                    <th className="p-4 text-center">Payment</th>
                    <th className="p-4 text-right">Cost Basis</th>
                    <th className="p-4 text-right">Sold Total</th>
                    <th className="p-4 text-right">Realized Profit</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          <span>Fetching transactions from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                          <span className="font-bold">{error}</span>
                          <button onClick={loadSales} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : salesLog.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 italic">
                        No recorded sales matched the selected filters.
                      </td>
                    </tr>
                  ) : (
                    salesLog.map((sale) => (
                      <tr key={sale.sale_id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white font-mono text-xs">{sale.receipt_number}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{sale.customer_name} • {sale.total_units_sold} units</div>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">{sale.sale_date}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-700 text-slate-300 border border-slate-700">
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          ₹{sale.total_cost_basis.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-white">
                          ₹{sale.total_amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                            +₹{sale.realized_profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedReceipt(sale)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-brand-400 hover:text-brand-300 transition-colors border border-slate-700"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* POS Terminal View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Catalog Selection (Left 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Scan barcode or type product name..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              {filteredCatalogForPOS.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-500 text-xs italic">
                  {catalogProducts.length === 0 ? 'No products in database catalog.' : 'No products matched your search.'}
                </div>
              ) : (
                filteredCatalogForPOS.map((p) => {
                  const stockCount = p.total_stock ?? p.current_stock ?? 0;
                  const isOutOfStock = stockCount <= 0;
                  const unitPrice = parseFloat(p.unit_price ?? p.selling_price ?? 0);

                  return (
                    <div
                      key={p.product_id}
                      onClick={() => !isOutOfStock && handleAddToCart(p)}
                      className={`glass-card rounded-xl p-3.5 flex flex-col justify-between gap-2 border transition-all ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed border-rose-500/30'
                          : 'cursor-pointer hover:border-brand-500/50 hover:bg-dark-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs truncate">{p.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="font-mono font-black text-brand-400 text-sm">₹{unitPrice.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-400' : 'text-slate-400'}`}>
                          {isOutOfStock ? 'Out of Stock' : `${stockCount} in stock`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* POS Cart & Checkout Drawer (Right 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between min-h-[500px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Current Cart</span>
                  </div>
                  <span className="text-xs text-brand-400 font-bold">{cart.length} items</span>
                </div>

                {/* Customer name input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer / Member</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer (or Customer Name)"
                    className="form-input text-xs"
                  />
                </div>

                {/* Cart items list */}
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-8 text-center">Cart is empty. Click items from catalog to add.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product_id} className="p-2 rounded-xl bg-dark-700/60 border border-slate-700/50 flex items-center justify-between text-xs">
                        <div className="flex-1 truncate pr-2">
                          <div className="font-semibold text-white truncate">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">₹{item.unit_price} each</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product_id, -1)}
                            className="w-6 h-6 rounded-lg bg-dark-600 hover:bg-dark-500 text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-white font-mono w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product_id, 1)}
                            className="w-6 h-6 rounded-lg bg-dark-600 hover:bg-dark-500 text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Checkout Summary & Payment */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-800 mt-4">
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST Tax (5%):</span>
                    <span className="font-mono">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 items-center">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-20 form-input py-1 text-right text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Due:</span>
                    <span className="text-brand-400 font-mono text-base font-black">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment method selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPosPaymentMethod(m.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                          posPaymentMethod === m.id
                            ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                            : 'bg-dark-700/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Checkout (₹{total.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={`Sales Receipt: ${selectedReceipt?.receipt_number}`}
        subtitle={`Date: ${selectedReceipt?.sale_date} • Cashier: ${selectedReceipt?.cashier_name}`}
        maxWidth="max-w-md"
      >
        {selectedReceipt && (
          <div className="flex flex-col gap-4 text-xs font-mono">
            <div className="p-3 bg-dark-800 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[10px] block">Customer</span>
                <span className="font-bold text-white">{selectedReceipt.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-right">Payment</span>
                <span className="font-bold text-brand-400 text-right block">{selectedReceipt.payment_method}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="divide-y divide-slate-800/80 border-y border-slate-800 py-2">
              {selectedReceipt.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-white font-bold block">{item.product_name}</span>
                    <span className="text-slate-500 text-[10px]">{item.quantity} x ₹{item.unit_price} (Picked: {item.shelf_code})</span>
                  </div>
                  <span className="text-white font-bold">₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>₹{selectedReceipt.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax:</span>
                <span>₹{selectedReceipt.tax_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="text-brand-400">₹{selectedReceipt.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 text-[11px] font-bold pt-1">
                <span>Realized Gross Profit:</span>
                <span>+₹{selectedReceipt.realized_profit?.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="mt-2 w-full py-2 bg-dark-700 hover:bg-dark-600 text-slate-200 rounded-xl font-bold text-xs transition-colors"
            >
              Close Receipt
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
