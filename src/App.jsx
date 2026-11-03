import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import QueryInspectorModal from './components/layout/QueryInspectorModal';

// Views
import DashboardView from './components/views/DashboardView';
import ProductSearchView from './components/views/ProductSearchView';
import CategoriesView from './components/views/CategoriesView';
import StoreInventoryView from './components/views/StoreInventoryView';
import LocationFinderView from './components/views/LocationFinderView';
import RacksShelvesView from './components/views/RacksShelvesView';
import LowStockAlertsView from './components/views/LowStockAlertsView';
import SuppliersView from './components/views/SuppliersView';
import PurchaseOrdersView from './components/views/PurchaseOrdersView';
import SalesPOSView from './components/views/SalesPOSView';
import ReportsView from './components/views/ReportsView';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Navigation contextual parameters
  const [locationSearchPrefill, setLocationSearchPrefill] = useState('');
  const [poPrefillItem, setPoPrefillItem] = useState(null);
  const [poPrefillSupplier, setPoPrefillSupplier] = useState(null);

  // Inspector modal state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorViewId, setInspectorViewId] = useState('dashboard');

  const handleOpenInspector = (viewId = null) => {
    setInspectorViewId(viewId || currentView);
    setIsInspectorOpen(true);
  };

  const handleNavigateToLocation = (sku) => {
    setLocationSearchPrefill(sku);
    setCurrentView('locations');
  };

  const handleGeneratePOFromAlert = (item) => {
    setPoPrefillItem(item);
    setPoPrefillSupplier(null);
    setCurrentView('purchase-orders');
  };

  const handleNewPOForSupplier = (supplier) => {
    setPoPrefillSupplier(supplier);
    setPoPrefillItem(null);
    setCurrentView('purchase-orders');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(viewId) => {
          setCurrentView(viewId);
          setLocationSearchPrefill('');
          setPoPrefillItem(null);
          setPoPrefillSupplier(null);
          setIsMobileSidebarOpen(false);
        }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenInspector={() => handleOpenInspector(currentView)}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic View Workspace */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onOpenInspector={() => handleOpenInspector('dashboard')}
              onAddProduct={() => setCurrentView('products')}
              onNewSale={() => setCurrentView('sales')}
            />
          )}

          {currentView === 'products' && (
            <ProductSearchView
              onOpenInspector={() => handleOpenInspector('products')}
              onNavigateToLocation={handleNavigateToLocation}
            />
          )}

          {currentView === 'categories' && (
            <CategoriesView />
          )}

          {currentView === 'inventory' && (
            <StoreInventoryView
              onOpenInspector={() => handleOpenInspector('inventory')}
              onAddProduct={() => setCurrentView('products')}
            />
          )}

          {currentView === 'locations' && (
            <LocationFinderView
              onOpenInspector={() => handleOpenInspector('locations')}
              prefilledSearch={locationSearchPrefill}
            />
          )}

          {currentView === 'racks' && (
            <RacksShelvesView
              onOpenInspector={() => handleOpenInspector('racks')}
            />
          )}

          {currentView === 'low-stock' && (
            <LowStockAlertsView
              onOpenInspector={() => handleOpenInspector('low-stock')}
              onGeneratePO={handleGeneratePOFromAlert}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersView
              onOpenInspector={() => handleOpenInspector('suppliers')}
              onNewPOForSupplier={handleNewPOForSupplier}
            />
          )}

          {currentView === 'purchase-orders' && (
            <PurchaseOrdersView
              onOpenInspector={() => handleOpenInspector('purchase-orders')}
              prefilledItem={poPrefillItem}
              prefilledSupplier={poPrefillSupplier}
            />
          )}

          {currentView === 'sales' && (
            <SalesPOSView
              onOpenInspector={() => handleOpenInspector('sales')}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              onOpenInspector={() => handleOpenInspector('reports')}
            />
          )}
        </main>
      </div>

      {/* SQL & API Integration Inspector Modal */}
      <QueryInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentViewId={inspectorViewId}
      />
    </div>
  );
}
