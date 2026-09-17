import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  CheckSquare, 
  Square, 
  Download, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  Filter, 
  Coins, 
  CheckCircle2 
} from 'lucide-react';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  editable?: boolean;
  render?: (row: T, isEditing: boolean, onChange: (val: any) => void) => React.ReactNode;
}

interface SpreadsheetTableViewProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowUpdate?: (id: string, field: string, value: any) => void;
  onBulkApprove?: (selectedIds: string[]) => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  title?: string;
}

export function SpreadsheetTableView<T extends { id: string }>({
  data,
  columns,
  onRowUpdate,
  onBulkApprove,
  onBulkDelete,
  title = 'Data Spreadsheet',
}: SpreadsheetTableViewProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((d) => d.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sorting Handler
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Data
  let processedData = [...data];

  if (filterText) {
    const query = filterText.toLowerCase();
    processedData = processedData.filter((row) =>
      Object.values(row as any).some((val) =>
        String(val || '').toLowerCase().includes(query)
      )
    );
  }

  if (sortColumn) {
    processedData.sort((a: any, b: any) => {
      const valA = a[sortColumn] ?? '';
      const valB = b[sortColumn] ?? '';
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Inline Editing Save
  const handleCellSave = (rowId: string, colKey: string) => {
    if (onRowUpdate) {
      onRowUpdate(rowId, colKey, editValue);
    }
    setEditingCell(null);
  };

  const startEditing = (rowId: string, colKey: string, initialVal: any) => {
    setEditingCell({ rowId, colKey });
    setEditValue(initialVal);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-3 p-4">
      {/* Spreadsheet Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {processedData.length} Records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search table..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          {/* Bulk Action Buttons */}
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-900 text-white p-1 rounded-xl text-xs font-bold animate-in fade-in">
              <span className="px-2 text-[11px] font-mono">{selectedIds.length} Selected</span>
              {onBulkApprove && (
                <button
                  type="button"
                  onClick={() => onBulkApprove(selectedIds)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bulk Approve</span>
                </button>
              )}
              {onBulkDelete && (
                <button
                  type="button"
                  onClick={() => onBulkDelete(selectedIds)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Excel Spreadsheet Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              {/* Checkbox Header */}
              <th className="p-2.5 w-10 text-center border-r border-slate-200">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-900"
                >
                  {selectedIds.length === data.length && data.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className="p-2.5 border-r border-slate-200 select-none cursor-pointer hover:bg-slate-200 transition"
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {processedData.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`hover:bg-indigo-50/40 transition ${
                    isSelected ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="p-2.5 text-center border-r border-slate-200">
                    <button
                      type="button"
                      onClick={() => toggleSelectRow(row.id)}
                      className="text-slate-400 hover:text-slate-800"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {columns.map((col) => {
                    const colKey = String(col.key);
                    const isEditing =
                      editingCell?.rowId === row.id && editingCell?.colKey === colKey;
                    const cellValue = (row as any)[colKey];

                    return (
                      <td
                        key={colKey}
                        className="p-2.5 border-r border-slate-200 truncate relative group font-sans text-slate-800"
                        onDoubleClick={() =>
                          col.editable && startEditing(row.id, colKey, cellValue)
                        }
                      >
                        {col.render ? (
                          col.render(row, isEditing, (val) => setEditValue(val))
                        ) : isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-2 py-0.5 border border-emerald-500 rounded bg-white text-xs font-mono focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleCellSave(row.id, colKey)}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCell(null)}
                              className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="truncate">{cellValue ?? '—'}</span>
                            {col.editable && (
                              <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer transition shrink-0 ml-1" />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
