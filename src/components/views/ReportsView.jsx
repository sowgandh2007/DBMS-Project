import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Download, 
  Code2, 
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
    alert("Export CSV: Generating downloadable report data...");
  };

  const totalCostBasisAll = valuationData.reduce((sum, v) => sum + v.total_cost_basis, 0);
  const totalRetailValueAll = valuationData.reduce((sum, v) => sum + v.total_retail_value, 0);
  const totalProjectedProfit = valuationData.reduce((sum, v) => sum + v.projected_gross_profit, 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregate valuation, rack occupancy, and sales turnover reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('reports')}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Inspect SQL Query"
          >
            <Code2 className="w-3.5 h-3.5 text-teal-600" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs & Date Filter */}
      <div className="premium-card p-3.5 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'valuation', label: 'Category Valuation', icon: DollarSign },
            { id: 'racks', label: 'Rack Space Utilization', icon: Layers },
            { id: 'turnover', label: 'Product Turnover', icon: TrendingUp },
          ].map((rep) => {
            const Icon = rep.icon;
            return (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  activeReport === rep.id
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
            className="form-input text-xs py-1.5 w-auto"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="End Date"
            className="form-input text-xs py-1.5 w-auto"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={loadReports} className="btn-secondary text-xs py-1">
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="p-8 text-center premium-card text-slate-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Computing aggregate report from PostgreSQL...</span>
        </div>
      )}

      {/* REPORT 1: Inventory Valuation by Category */}
      {activeReport === 'valuation' && (
        <div className="flex flex-col gap-5">
          {/* Summary counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="premium-card p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Cost Basis</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ₹{totalCostBasisAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Capital invested in stock on hand</span>
            </div>

            <div className="premium-card p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Retail Value</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ₹{totalRetailValueAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Estimated sales revenue if 100% sold</span>
            </div>

            <div className="premium-card p-4">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Projected Gross Profit</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{totalProjectedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Estimated gross margin</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="premium-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Category Valuation & Margin Breakdown</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{valuationData.length} Categories</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">SKU Count</th>
                    <th className="py-3 px-4 text-center">Units in Stock</th>
                    <th className="py-3 px-4 text-right">Cost Basis</th>
                    <th className="py-3 px-4 text-right">Retail Value</th>
                    <th className="py-3 px-4 text-right">Proj. Profit</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {valuationData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">{row.category}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{row.total_products}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{row.total_units_in_stock}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{row.total_cost_basis.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">₹{row.total_retail_value.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{row.projected_gross_profit.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
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
        <div className="flex flex-col gap-5">
          <div className="premium-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aisle Warehouse Space Utilization</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{rackData.length} Aisles Analyzed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Aisle & Zone</th>
                    <th className="py-3 px-4 text-center">Racks Count</th>
                    <th className="py-3 px-4 text-center">Unit Capacity</th>
                    <th className="py-3 px-4 text-center">Units Stored</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4">Occupancy %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rackData.map((row, idx) => {
                    const util = parseFloat(row.overall_utilization_pct || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{row.aisle_number}</div>
                          <div className="text-[11px] text-slate-500">{row.zone}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">{row.total_racks}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{row.total_unit_capacity}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.total_units_stored}</td>
                        <td className="py-3 px-4 text-center font-mono text-teal-700 font-bold">{row.available_capacity}</td>
                        <td className="py-3 px-4 min-w-[180px]">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>{row.total_units_stored} / {row.total_unit_capacity}</span>
                            <span className="font-bold text-slate-900">{row.overall_utilization_pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                            <div 
                              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full"
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
        <div className="flex flex-col gap-5">
          <div className="premium-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Fast-Moving Products</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{turnoverData.length} Ranked Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Rank & Product Name</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right">Gross Sales</th>
                    <th className="py-3 px-4 text-right">Cost Basis</th>
                    <th className="py-3 px-4 text-right">Net Profit Realized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {turnoverData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center border border-slate-200">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{row.product_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-teal-700 text-xs">
                        {row.units_sold} units
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">₹{row.revenue.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{row.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
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
