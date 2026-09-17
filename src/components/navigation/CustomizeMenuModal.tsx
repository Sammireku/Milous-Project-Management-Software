import React, { useState } from 'react';
import { X, GripVertical, Eye, EyeOff, Check } from 'lucide-react';

export interface MenuItemConfig {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  to: string;
}

interface CustomizeMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  shownItems: MenuItemConfig[];
  hiddenItems: MenuItemConfig[];
  onSave: (shown: MenuItemConfig[], hidden: MenuItemConfig[]) => void;
}

export const CustomizeMenuModal: React.FC<CustomizeMenuModalProps> = ({
  isOpen,
  onClose,
  shownItems: initialShown,
  hiddenItems: initialHidden,
  onSave,
}) => {
  const [shown, setShown] = useState<MenuItemConfig[]>(initialShown);
  const [hidden, setHidden] = useState<MenuItemConfig[]>(initialHidden);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const hideItem = (item: MenuItemConfig) => {
    setShown((prev) => prev.filter((i) => i.id !== item.id));
    setHidden((prev) => [...prev, item]);
  };

  const showItem = (item: MenuItemConfig) => {
    setHidden((prev) => prev.filter((i) => i.id !== item.id));
    setShown((prev) => [...prev, item]);
  };

  const handleDragStart = (e: React.DragEvent, id: string, source: 'shown' | 'hidden') => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
  };

  const handleDropOnShown = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    try {
      const { id, source } = JSON.parse(dataStr);
      let item: MenuItemConfig | undefined;
      if (source === 'shown') {
        item = shown.find((i) => i.id === id);
        if (!item) return;
        const newShown = shown.filter((i) => i.id !== id);
        if (targetIndex !== undefined) {
          newShown.splice(targetIndex, 0, item);
        } else {
          newShown.push(item);
        }
        setShown(newShown);
      } else {
        item = hidden.find((i) => i.id === id);
        if (!item) return;
        setHidden((prev) => prev.filter((i) => i.id !== id));
        const newShown = [...shown];
        if (targetIndex !== undefined) {
          newShown.splice(targetIndex, 0, item);
        } else {
          newShown.push(item);
        }
        setShown(newShown);
      }
    } catch {
      // ignore
    }
    setDraggingId(null);
  };

  const handleDropOnHidden = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    try {
      const { id, source } = JSON.parse(dataStr);
      if (source === 'shown') {
        const item = shown.find((i) => i.id === id);
        if (item) {
          setShown((prev) => prev.filter((i) => i.id !== id));
          setHidden((prev) => [...prev, item]);
        }
      }
    } catch {
      // ignore
    }
    setDraggingId(null);
  };

  const handleSave = () => {
    onSave(shown, hidden);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Customize menu</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose what you&apos;d like to see in your menu, then drag and drop to reorder.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Shown in menu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Shown in menu ({shown.length})
              </span>
              <span className="text-xs text-slate-400">Drag to reorder</span>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnShown(e)}
              className="space-y-1.5 min-h-[100px] p-2 bg-slate-50/70 rounded-lg border border-slate-200/60"
            >
              {shown.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id, 'shown')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDropOnShown(e, idx);
                  }}
                  className={`flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing ${
                    draggingId === item.id ? 'opacity-40 border-dashed border-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => hideItem(item)}
                    title="Hide from menu"
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {shown.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Drop items here to show them in the sidebar
                </div>
              )}
            </div>
          </div>

          {/* Hidden from menu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hidden from menu ({hidden.length})
              </span>
              <span className="text-xs text-slate-400">Click eye to show</span>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnHidden}
              className="space-y-1.5 min-h-[80px] p-2 bg-slate-50/70 rounded-lg border border-slate-200/60"
            >
              {hidden.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id, 'hidden')}
                  className={`flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing ${
                    draggingId === item.id ? 'opacity-40 border-dashed border-slate-400' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <span className="font-medium text-slate-600">{item.name}</span>
                  </div>
                  <button
                    onClick={() => showItem(item)}
                    title="Show in menu"
                    className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {hidden.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  All items are currently shown in your menu
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
