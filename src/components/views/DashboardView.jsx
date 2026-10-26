import React, { useState, useEffect } from 'react';
import StatCard from '../common/StatCard';
import StatusBadge from '../common/StatusBadge';
import { 
  Package, 
  IndianRupee, 
  AlertTriangle, 
  Truck, 
  ClipboardList, 
  Receipt, 
  TrendingUp,
  Plus, 
  ArrowUpRight, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { getDashboardStats, getHighestMarginProducts } from '../../services/dashboardService';
import { getSuppliers } from '../../services/supplierService';
import { getPurchaseOrders } from '../../services/purchaseOrderService';
import { getSalesLog } from '../../services/salesService';

export default function DashboardView({ onNavigate, onAddProduct, onNewSale }) {
  const [stats, setStats] = useState(null);
  const [supplierCount, setSupplierCount] = useState(0);
  const [pendingPOCount, setPendingPOCount] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [marginItems, setMarginItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, sups, pos, sales, margins] = await Promise.all([
        getDashboardStats(),
        getSuppliers().catch(() => []),
        getPurchaseOrders().catch(() => []),
        getSalesLog().catch(() => []),
        getHighestMarginProducts().catch(() => [])
      ]);

      setStats(st);
      setSupplierCount((sups || []).length);
      const pending = (pos || []).filter(p => (p.status || '').toLowerCase() === 'pending').length;
      setPendingPOCount(pending);
      setRecentSales((sales || []).slice(0, 5));
      setMarginItems(margins || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || 'Failed to connect to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalProducts = stats?.totalSkus ?? 0;
  const inventoryValue = stats ? `₹${stats.totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00';
  const lowStockCount = stats?.lowStockCount ?? 0;
  const recentSalesTotal = stats ? `₹${stats.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time inventory metrics and sales data from Supabase PostgreSQL.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onNewSale}
            className="btn-secondary"
          >
            <Receipt className="w-3.5 h-3.5 text-teal-600" />
            <span>POS Checkout</span>
          </button>
          <button 
            onClick={onAddProduct}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block">Database Connection Notice</span>
              <span className="text-xs text-rose-600">{error}</span>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 6 Essential Compact KPI Cards (Requirement 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total products */}
        <StatCard
          title="Total Products"
          value={loading ? '...' : totalProducts}
          subtitle="Catalog SKUs"
          icon={Package}
          color="teal"
        />

        {/* 2. Total inventory value */}
        <StatCard
          title="Inventory Value"
          value={loading ? '...' : inventoryValue}
          subtitle="Stock valuation"
          icon={IndianRupee}
          color="lavender"
        />

        {/* 3. Low-stock items */}
        <StatCard
          title="Low-Stock Items"
          value={loading ? '...' : lowStockCount}
          subtitle="Needs reorder"
          icon={AlertTriangle}
          color="amber"
          trend={lowStockCount > 0 ? "Action required" : "Healthy"}
        />

        {/* 4. Total suppliers */}
        <StatCard
          title="Total Suppliers"
          value={loading ? '...' : supplierCount}
          subtitle="Active vendors"
          icon={Truck}
          color="sky"
        />

        {/* 5. Pending purchase orders */}
        <StatCard
          title="Pending Orders"
          value={loading ? '...' : pendingPOCount}
          subtitle="Inbound shipments"
          icon={ClipboardList}
          color="peach"
        />

        {/* 6. Recent sales */}
        <StatCard
          title="Recent Sales"
          value={loading ? '...' : recentSalesTotal}
          subtitle="Today's volume"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Lower Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions Table (Left 7 cols) */}
        <div className="lg:col-span-7 premium-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Sales Transactions</h3>
              <p className="text-[11px] text-slate-500">Live order checkout records from PostgreSQL table <code className="font-mono text-teal-700">sales_order</code></p>
            </div>
            <button 
              onClick={() => onNavigate('sales')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Receipt</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.sale_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {sale.receipt_number || `#${sale.sale_id}`}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {sale.sale_date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(sale.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Margin Products (Right 5 cols) */}
        <div className="lg:col-span-5 premium-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Margin Products</h3>
              <p className="text-[11px] text-slate-500">Profit yield based on retail price vs cost basis</p>
            </div>
            <button 
              onClick={() => onNavigate('products')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {marginItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No catalog items available.</p>
            ) : (
              marginItems.map((item) => (
                <div key={item.product_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">{item.product_name}</span>
                    <span className="font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80 text-[11px]">
                      +{item.margin_pct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Cost: ₹{item.cost_price}</span>
                    <span className="font-semibold text-slate-700">Price: ₹{item.unit_price}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, parseFloat(item.margin_pct) * 1.5))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
