import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Edit2, 
  Copy, 
  FileDown, 
  Home, 
  FolderInput, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface DashboardOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  activeTabTitle: string;
  tabsCount: number;
  onRename: (newName: string) => void;
  onDuplicate: () => void;
  onExportPdf: () => void;
  onSetAsHome: () => void;
  onMove: (targetSpace: string) => void;
  onDelete: () => void;
}

export const DashboardOptionsDropdown: React.FC<DashboardOptionsProps> = ({
  isOpen,
  onClose,
  activeTabTitle,
  tabsCount,
  onRename,
  onDuplicate,
  onExportPdf,
  onSetAsHome,
  onMove,
  onDelete,
}) => {
  const [modalMode, setModalMode] = useState<'menu' | 'rename' | 'move' | 'delete'>('menu');
  const [renameInput, setRenameInput] = useState(activeTabTitle);
  const [selectedSpace, setSelectedSpace] = useState('West Africa Humanitarian Mission');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRenameInput(activeTabTitle);
    setModalMode('menu');
  }, [activeTabTitle, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && modalMode === 'menu') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, modalMode, onClose]);

  if (!isOpen) return null;

  // SUB-MODAL: Rename Tab
  if (modalMode === 'rename') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <h3 className="text-sm">Rename Dashboard</h3>
            <button onClick={() => setModalMode('menu')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Dashboard Tab Name</label>
            <input
              type="text"
              required
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode('menu')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (renameInput.trim()) {
                  onRename(renameInput.trim());
                  onClose();
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Save Name
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUB-MODAL: Move Dashboard
  if (modalMode === 'move') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <h3 className="text-sm">Move Dashboard</h3>
            <button onClick={() => setModalMode('menu')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Target Mission / Space</label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 bg-white"
            >
              <option value="West Africa Humanitarian Mission">West Africa Humanitarian Mission</option>
              <option value="Northern Region WASH Space">Northern Region WASH Space</option>
              <option value="Executive Governance Board">Executive Governance Board</option>
              <option value="Field Logistics & Stock Space">Field Logistics & Stock Space</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode('menu')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                onMove(selectedSpace);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Move Here
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUB-MODAL: Confirm Delete
  if (modalMode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-rose-600 font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm">Delete Dashboard "{activeTabTitle}"?</h3>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {tabsCount <= 1
              ? 'This is your only dashboard tab. Deleting it will reset all widgets to factory defaults.'
              : `Are you sure you want to permanently delete the "${activeTabTitle}" dashboard tab? This action cannot be undone.`}
          </p>
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode('menu')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Delete Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRIMARY DROPDOWN MENU
  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between font-bold text-slate-800">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Dashboard Actions</span>
        <span className="text-[10px] text-emerald-600 font-mono">{activeTabTitle}</span>
      </div>

      <div className="py-1">
        {/* 1. Rename */}
        <button
          type="button"
          onClick={() => setModalMode('rename')}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition"
        >
          <Edit2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Rename</span>
        </button>

        {/* 2. Duplicate */}
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition"
        >
          <Copy className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Duplicate</span>
        </button>

        {/* 3. Export to PDF */}
        <button
          type="button"
          onClick={() => {
            onExportPdf();
            onClose();
          }}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition"
        >
          <FileDown className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Export to PDF</span>
        </button>

        {/* 4. Set as Home */}
        <button
          type="button"
          onClick={() => {
            onSetAsHome();
            onClose();
          }}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition"
        >
          <Home className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Set as home</span>
        </button>

        {/* 5. Move */}
        <button
          type="button"
          onClick={() => setModalMode('move')}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition"
        >
          <FolderInput className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Move</span>
        </button>

        <div className="h-px bg-slate-100 my-1" />

        {/* 6. Delete */}
        <button
          type="button"
          onClick={() => setModalMode('delete')}
          className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-rose-50 text-rose-600 transition font-semibold"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
