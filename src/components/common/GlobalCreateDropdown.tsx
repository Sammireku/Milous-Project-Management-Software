import React, { useEffect, useRef } from 'react';
import { 
  CheckSquare, 
  FolderKanban, 
  FolderPlus, 
  LayoutGrid, 
  Send, 
  UserPlus, 
  PenTool, 
  X 
} from 'lucide-react';

export type CreateType = 'task' | 'project' | 'folder' | 'space' | 'request' | 'invite' | 'whiteboard';

interface GlobalCreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: CreateType) => void;
  positionClasses?: string;
}

export const GlobalCreateDropdown: React.FC<GlobalCreateDropdownProps> = ({
  isOpen,
  onClose,
  onSelect,
  positionClasses = 'top-14 right-4'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      type: 'task' as CreateType,
      label: 'Task',
      desc: 'Add to-do item, deliverable, or milestone',
      icon: <CheckSquare className="w-4 h-4 text-emerald-600" />,
      badge: 'Quick',
    },
    {
      type: 'project' as CreateType,
      label: 'Project',
      desc: 'Launch new humanitarian grant or project',
      icon: <FolderKanban className="w-4 h-4 text-blue-600" />,
      badge: 'Grant',
    },
    {
      type: 'folder' as CreateType,
      label: 'Folder',
      desc: 'Create folder to group documents & tasks',
      icon: <FolderPlus className="w-4 h-4 text-amber-600" />,
    },
    {
      type: 'space' as CreateType,
      label: 'Space',
      desc: 'Set up department workspace or mission',
      icon: <LayoutGrid className="w-4 h-4 text-indigo-600" />,
    },
    {
      type: 'request' as CreateType,
      label: 'Request',
      desc: 'Submit inventory usage or expense approval',
      icon: <Send className="w-4 h-4 text-purple-600" />,
    },
    {
      type: 'invite' as CreateType,
      label: 'Invite',
      desc: 'Invite team member, auditor, or donor',
      icon: <UserPlus className="w-4 h-4 text-rose-600" />,
    },
    {
      type: 'whiteboard' as CreateType,
      label: 'Whiteboard',
      desc: 'Open collaborative whiteboard & stickies',
      icon: <PenTool className="w-4 h-4 text-teal-600" />,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className={`fixed ${positionClasses} z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 animate-in fade-in zoom-in-95 duration-150`}
    >
      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
          Create New
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-1 space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => {
              onSelect(item.type);
              onClose();
            }}
            className="w-full text-left px-3 py-2 flex items-center space-x-3 hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-2xs transition">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
