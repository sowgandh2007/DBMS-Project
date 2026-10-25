import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  PieChart, 
  Code2, 
  CheckCircle2, 
  ArrowUpRight,
  AlertTriangle 
} from 'lucide-react';
import { getValuationReport, getRackUtilizationReport, getProductTurnoverReport } from '../../services/reportService';

export default function ReportsView({ onOpenInspector }) {
  const [activeReport, setActiveReport] = useState('valuation'); // 'valuation', 'racks', 'turnover'
  const [valuationData, setValuationData] = useState([]);
  const [rackData, setRackData] = useState([]);
  const [turnoverData, setTurnoverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [val, racks, turn] = await Promise.all([
        getValuationReport(),
        getRackUtilizationReport(),
        getProductTurnoverReport({ fromDate, toDate })
      ]);
      setValuationData(val || []);
      setRackData(racks || []);
      setTurnoverData(turn || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [fromDate, toDate]);

  const handleExportCSV = () => {
    alert("Export CSV triggered: In your completed DBMS backend, this will stream a generated CSV file for this query.");
  };

  const totalCostBasisAll = valuationData.reduce((sum, v) => sum + v.total_cost_basis, 0);
  const totalRetailValueAll = valuationData.reduce((sum, v) => sum + v.total_retail_value, 0);
  const totalProjectedProfit = valuationData.reduce((sum, v) => sum + v.projected_gross_profit, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Executive Reports & Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Aggregate valuation, rack occupancy, and sales turnover reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('reports')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs & Date Filter */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'valuation', label: 'Inventory Valuation by Category', icon: DollarSign },
            { id: 'racks', label: 'Rack Space Utilization by Aisle', icon: Layers },
            { id: 'turnover', label: 'Fast-Moving Product Turnover', icon: TrendingUp },
          ].map((rep) => {
            const Icon = rep.icon;
            return (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                  activeReport === rep.id
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{rep.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="Start Date"
            className="form-input text-white bg-dark-700 w-auto text-xs"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="End Date"
            className="form-input text-white bg-dark-700 w-auto text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={loadReports} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold">
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Computing aggregate report from PostgreSQL...</span>
        </div>
      )}

      {/* REPORT 1: Inventory Valuation by Category */}
      {activeReport === 'valuation' && (
        <div className="flex flex-col gap-6">
          {/* Summary counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Inventory Cost Basis</span>
              <div className="text-2xl font-black text-white mt-1">
                ₹{totalCostBasisAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Capital invested in stock on hand</span>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Retail Market Value</span>
              <div className="text-2xl font-black text-white mt-1">
                ₹{totalRetailValueAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Gross sales value if 100% sold</span>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Projected Gross Profit</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ₹{totalProjectedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Estimated retail gross profit</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Category Valuation & Margin Breakdown</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{valuationData.length} Categories</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">SKU Count</th>
                    <th className="p-4 text-center">Units in Stock</th>
                    <th className="p-4 text-right">Cost Basis</th>
                    <th className="p-4 text-right">Retail Value</th>
                    <th className="p-4 text-right">Proj. Gross Profit</th>
                    <th className="p-4 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
                  {valuationData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4 font-bold text-white text-xs">{row.category}</td>
                      <td className="p-4 text-center font-semibold text-slate-300">{row.total_products}</td>
                      <td className="p-4 text-center font-bold text-white">{row.total_units_in_stock}</td>
                      <td className="p-4 text-right font-mono text-slate-400">₹{row.total_cost_basis.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-white font-bold">₹{row.total_retail_value.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">₹{row.projected_gross_profit.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                          +{row.margin_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Rack Space Utilization */}
      {activeReport === 'racks' && (
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Aisle Warehouse Space Utilization</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{rackData.length} Aisles Analyzed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                    <th className="p-4">Aisle & Zone</th>
                    <th className="p-4 text-center">Racks Count</th>
                    <th className="p-4 text-center">Total Unit Capacity</th>
                    <th className="p-4 text-center">Units Stored</th>
                    <th className="p-4 text-center">Available Space</th>
                    <th className="p-4">Occupancy % Meter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
                  {rackData.map((row, idx) => {
                    const util = parseFloat(row.overall_utilization_pct || 0);
                    return (
                      <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-xs">{row.aisle_number}</div>
                          <div className="text-[10px] text-slate-500">{row.zone}</div>
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-300">{row.total_racks}</td>
                        <td className="p-4 text-center font-mono text-slate-400">{row.total_unit_capacity}</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{row.total_units_stored}</td>
                        <td className="p-4 text-center font-mono text-emerald-400 font-bold">{row.available_capacity}</td>
                        <td className="p-4 min-w-[180px]">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>{row.total_units_stored} / {row.total_unit_capacity}</span>
                            <span className="font-bold text-white">{row.overall_utilization_pct}%</span>
                          </div>
                          <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-brand-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, util)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Fast Moving Product Turnover */}
      {activeReport === 'turnover' && (
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Top Fast-Moving Products</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{turnoverData.length} Ranked Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                    <th className="p-4">Rank & Product Name</th>
                    <th className="p-4 text-center">Units Sold</th>
                    <th className="p-4 text-right">Gross Sales</th>
                    <th className="p-4 text-right">Cost Basis</th>
                    <th className="p-4 text-right">Net Profit Realized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
                  {turnoverData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-dark-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white text-xs">{row.product_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-brand-400 text-xs">
                        {row.units_sold} units
                      </td>
                      <td className="p-4 text-right font-mono text-white font-bold">₹{row.revenue.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-slate-400">₹{row.cost.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        +₹{row.net_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
