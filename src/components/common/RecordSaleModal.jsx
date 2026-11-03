import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  QrCode, 
  Banknote,
  Plus,
  Minus,
  Package,
  Layers
} from 'lucide-react';
import { recordSale } from '../../services/salesService';

export default function RecordSaleModal({ isOpen, onClose, product, onSaleSuccess }) {
  if (!product) return null;

  const costPrice = parseFloat(product.cost_price ?? product.buy_price ?? 0);
  const regularRetailPrice = parseFloat(product.unit_price ?? product.selling_price ?? 0);
  const availableStock = parseInt(product.total_stock ?? product.current_stock ?? product.stock_quantity ?? 0, 10);

  const [quantity, setQuantity] = useState(1);
  const [soldPrice, setSoldPrice] = useState(regularRetailPrice);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync state whenever product changes or modal opens
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSoldPrice(parseFloat(product.unit_price ?? product.selling_price ?? 0));
      setCustomerName('Walk-in Customer');
      setPaymentMethod('UPI');
      setError(null);
    }
  }, [product, isOpen]);

  // Derived financial metrics
  const validQty = Math.max(1, parseInt(quantity, 10) || 1);
  const validPrice = Math.max(0, parseFloat(soldPrice) || 0);
  const totalRevenue = validQty * validPrice;
  const totalCostBasis = validQty * costPrice;
  const realizedProfit = totalRevenue - totalCostBasis;
  const profitMarginPct = totalRevenue > 0 
    ? ((realizedProfit / totalRevenue) * 100).toFixed(1) 
    : '0.0';

  const handleQtyChange = (delta) => {
    const next = validQty + delta;
    if (next >= 1 && (availableStock <= 0 || next <= availableStock)) {
      setQuantity(next);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availableStock > 0 && validQty > availableStock) {
      setError(`Cannot sell ${validQty} units; only ${availableStock} currently in stock.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await recordSale({
        customer_name: customerName.trim() || 'Walk-in Customer',
        payment_method: paymentMethod,
        subtotal: totalRevenue,
        tax_amount: 0,
        discount_amount: Math.max(0, (regularRetailPrice - validPrice) * validQty),
        total_amount: totalRevenue,
        cashier_name: 'Store Cashier',
        items: [
          {
            product_id: product.product_id,
            sku: product.sku,
            product_name: product.product_name,
            quantity: validQty,
            unit_price: validPrice,
            buy_price: costPrice,
            shelf_code: product.shelf_code || product.shelf_number || 'A1-S1'
          }
        ]
      });

      if (onSaleSuccess) {
        onSaleSuccess({
          product,
          quantity: validQty,
          totalRevenue,
          realizedProfit,
          receipt: res?.receipt || res?.data
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record sale transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Product Sale"
      subtitle="Instantly bill product, deduct stock, and book gross profit into ledger."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Summary Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product Selection</span>
              <div className="font-bold text-slate-900 text-sm truncate mt-0.5">{product.product_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-slate-500 font-bold text-[11px]">{product.sku}</span>
                {product.shelf_code && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    <Layers className="w-3 h-3 text-slate-500" />
                    {product.shelf_code}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">In Stock</span>
              <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                availableStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {availableStock > 0 ? `${availableStock} units` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Cost Basis (Buy)</span>
              <span className="font-mono font-semibold text-slate-700">₹{costPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Standard Retail (MSRP)</span>
              <span className="font-mono font-semibold text-slate-700">₹{regularRetailPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Quantities & Pricing Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Units to Sell
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                disabled={validQty <= 1}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold touch-manipulation transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="1"
                max={availableStock > 0 ? availableStock : undefined}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input text-center font-bold text-slate-900 py-1.5 w-full font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                disabled={availableStock > 0 && validQty >= availableStock}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold touch-manipulation transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Max available: {availableStock}</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sale Price per Unit (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={soldPrice}
              onChange={(e) => setSoldPrice(e.target.value)}
              className="form-input font-bold font-mono text-slate-900 py-1.5 text-sm"
              placeholder="0.00"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">MSRP: ₹{regularRetailPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer & Payment details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="form-input text-xs py-1.5"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'UPI', label: 'UPI', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'CASH', label: 'Cash', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-1.5 rounded-lg border text-center text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 touch-manipulation ${
                      paymentMethod === m.id
                        ? 'bg-teal-50 text-teal-800 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Profit Preview Banner (Scaled up from sowgandh.vercel.app) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/90 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Realized Gross Margin
            </span>
            <span className="text-base font-black text-emerald-700 font-mono">
              +₹{realizedProfit.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Billed</span>
              <span className="font-bold font-mono text-slate-900">₹{totalRevenue.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Cost Basis</span>
              <span className="font-mono text-slate-600">₹{totalCostBasis.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Margin</span>
              <span className="font-bold text-emerald-700 font-mono">+{profitMarginPct}%</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (availableStock <= 0)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Recording...' : `Record Sale (₹${totalRevenue.toFixed(2)})`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}