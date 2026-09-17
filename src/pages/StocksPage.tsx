import React, { useState } from 'react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ClipboardList, 
  Package, 
  Layers, 
  X, 
  Check, 
  Clock, 
  Filter,
  ShieldAlert,
  Send
} from 'lucide-react';
import { StockItem, StockUsageRequest } from '../types';

export const StocksPage: React.FC = () => {
  const { stockItems, stockRequests, projects, createStockItem, createStockRequest, approveStockRequest } = useFirestore();
  const { currentUser } = useAuth();

  const isLeadership = 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'ceo' || 
    currentUser?.role === 'project_manager';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'REQUESTS'>('INVENTORY');

  // New Stock Item Modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Water Treatment');
  const [measurementUnit, setMeasurementUnit] = useState<StockItem['measurementUnit']>('BAGS');
  const [startingStock, setStartingStock] = useState<number>(100);
  const [minimumThreshold, setMinimumThreshold] = useState<number>(20);
  const [unitCost, setUnitCost] = useState<number>(15);
  const [location, setLocation] = useState('Central Warehouse Accra');

  // Stock Usage Requisition Modal
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(stockItems[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [quantityRequested, setQuantityRequested] = useState<number>(10);
  const [requestPurpose, setRequestPurpose] = useState('');

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    await createStockItem({
      name: itemName.trim(),
      category: itemCategory,
      measurementUnit,
      startingStock: Number(startingStock),
      receivedStock: 0,
      issuedStock: 0,
      closingStock: Number(startingStock),
      minimumThreshold: Number(minimumThreshold),
      unitCost: Number(unitCost),
      currency: 'USD',
      location,
    });

    setItemName('');
    setStartingStock(100);
    setMinimumThreshold(20);
    setUnitCost(15);
    setIsNewItemModalOpen(false);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = stockItems.find((s) => s.id === selectedStockId);
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (!item || !requestPurpose.trim()) return;

    await createStockRequest({
      stockItemId: item.id,
      stockItemName: item.name,
      measurementUnit: item.measurementUnit,
      quantityRequested: Number(quantityRequested),
      projectId: proj?.id || 'prj-wash-01',
      projectName: proj?.title || 'Community Water Project',
      requestedBy: currentUser?.id || 'usr-01',
      requesterName: currentUser?.displayName || 'Field Supervisor',
      purpose: requestPurpose.trim(),
      status: 'PENDING',
    });

    setRequestPurpose('');
    setQuantityRequested(10);
    setIsNewRequestModalOpen(false);
    setActiveTab('REQUESTS');
  };

  const filteredItems = stockItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = stockItems.filter((item) => item.closingStock <= item.minimumThreshold).length;
  const totalStockValue = stockItems.reduce((acc, curr) => acc + curr.closingStock * curr.unitCost, 0);
  const pendingRequestsCount = stockRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Stocks & Inventory Management</h1>
              <p className="text-xs text-slate-500">
                Monitor starting/closing stock levels, package measurements, and manage project usage requests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsNewRequestModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span>Request Stock Usage</span>
          </button>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Valuation</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">${totalStockValue.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stockItems.length} SKUs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Alert</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-red-600">{lowStockCount}</span>
            <span className="text-xs text-red-600 font-medium">below threshold</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Usage Requisitions</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{pendingRequestsCount}</span>
            <span className="text-xs text-amber-600 font-medium">pending approval</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'INVENTORY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock Items & Balances ({stockItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'REQUESTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Stock Usage Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Content depending on Active Tab */}
      {activeTab === 'INVENTORY' ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inventory items by name, category, warehouse location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="Water Treatment">Water Treatment</option>
              <option value="Pipes & Plumbing">Pipes & Plumbing</option>
              <option value="Solar Equipment">Solar Equipment</option>
              <option value="Educational Materials">Educational Materials</option>
            </select>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Name & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Measurement Unit</th>
                    <th className="py-3 px-4 text-center">Starting Stock</th>
                    <th className="py-3 px-4 text-center">Issued Out</th>
                    <th className="py-3 px-4 text-center">Closing Stock</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isLow = item.closingStock <= item.minimumThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-purple-600 shrink-0" />
                            <div>
                              <div>{item.name}</div>
                              {isLow && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-600">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Low stock (Min {item.minimumThreshold})</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {item.category}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                            {item.measurementUnit}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-center text-slate-600">
                          {item.startingStock}
                        </td>

                        <td className="py-3 px-4 font-mono text-center text-slate-600">
                          {item.issuedStock}
                        </td>

                        <td className="py-3 px-4 font-mono text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {item.closingStock}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {item.location}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                          ${item.unitCost.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                        No inventory items found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Requests Tab */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Requested Item</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Target Project</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Leadership Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {req.stockItemName}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {req.quantityRequested} {req.measurementUnit}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {req.projectName}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{req.requesterName}</div>
                        <div className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                      </td>

                      <td className="py-3 px-4 max-w-[240px] truncate text-slate-600">
                        {req.purpose}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'APPROVED' && <Check className="w-3 h-3 text-emerald-600" />}
                          {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {req.status === 'PENDING' && isLeadership ? (
                          <button
                            onClick={() => approveStockRequest(req.id, currentUser?.displayName || 'Authorized PM')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve & Deduct</span>
                          </button>
                        ) : req.status === 'APPROVED' ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Approved by {req.approvedBy}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Pending Review</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {stockRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No usage requests submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Stock / Inventory SKU</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Item Description *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Rapid Water Testing Chemical Kits"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="Water Treatment">Water Treatment</option>
                    <option value="Pipes & Plumbing">Pipes & Plumbing</option>
                    <option value="Solar Equipment">Solar Equipment</option>
                    <option value="Educational Materials">Educational Materials</option>
                    <option value="Medical & Sanitation Supplies">Medical & Sanitation Supplies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Measurement / Packaging *
                  </label>
                  <select
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="BAGS">Bags (e.g. 50kg)</option>
                    <option value="BOXES">Boxes / Cartons</option>
                    <option value="UNITS">Single Units / Pieces</option>
                    <option value="LITERS">Liters (Liquid)</option>
                    <option value="METERS">Meters (Pipes/Cables)</option>
                    <option value="BUNDLES">Bundles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Starting Stock *</label>
                  <input
                    type="number"
                    required
                    value={startingStock}
                    onChange={(e) => setStartingStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Min Threshold Alert</label>
                  <input
                    type="number"
                    required
                    value={minimumThreshold}
                    onChange={(e) => setMinimumThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit Cost ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Storage Warehouse</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kumasi Hub Depot"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Stock Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Usage Request Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Request Stock for Project Usage</h3>
              <button onClick={() => setIsNewRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Stock Item *</label>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                >
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.closingStock} {s.measurementUnit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Allocated Project *</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quantity to Issue *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantityRequested}
                    onChange={(e) => setQuantityRequested(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Requisition Purpose / Justification *</label>
                <textarea
                  rows={2}
                  required
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  placeholder="e.g. Distribution to 3 community clinics for water sterilization..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Requisition for Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
