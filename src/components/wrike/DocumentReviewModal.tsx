import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Pin, 
  MessageSquare, 
  Check, 
  Trash2, 
  Paperclip, 
  Send, 
  Sparkles, 
  FileText, 
  Eye, 
  Download 
} from 'lucide-react';

export interface ProofPinMarkup {
  id: string;
  pinNumber: number;
  xPercent: number;
  yPercent: number;
  authorName: string;
  resolved: boolean;
  comments: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }[];
}

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  documentUrl?: string;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle = 'Field_Borehole_Inspection_Report_v2.pdf',
  documentUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Document File State
  const [activeDocumentUrl, setActiveDocumentUrl] = useState<string>(documentUrl);
  const [activeDocumentTitle, setActiveDocumentTitle] = useState<string>(documentTitle);

  // Pin Markups State
  const [pins, setPins] = useState<ProofPinMarkup[]>([
    {
      id: 'pin-1',
      pinNumber: 1,
      xPercent: 35,
      yPercent: 42,
      authorName: 'Ama Osei (M&E Officer)',
      resolved: false,
      comments: [
        {
          id: 'c-1',
          authorName: 'Ama Osei',
          text: 'Piping depth looks compliant at 45m. Need pressure gauge calibration certificate.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'pin-2',
      pinNumber: 2,
      xPercent: 68,
      yPercent: 70,
      authorName: 'Kofi Mensah (Lead Engineer)',
      resolved: false,
      comments: [
        {
          id: 'c-2',
          authorName: 'Kofi Mensah',
          text: 'Solar inverter serial number matches donor grant ledger GH-882.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ]);

  const [activePinId, setActivePinId] = useState<string | null>('pin-1');
  const [newCommentInput, setNewCommentInput] = useState<string>('');

  if (!isOpen) return null;

  // Handle canvas click to place a new coordinate pin markup
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    const newPin: ProofPinMarkup = {
      id: `pin-${Date.now()}`,
      pinNumber: pins.length + 1,
      xPercent,
      yPercent,
      authorName: 'Current User',
      resolved: false,
      comments: [
        {
          id: `c-${Date.now()}`,
          authorName: 'Current User',
          text: `Marked pin #${pins.length + 1} at coordinates (${xPercent}%, ${yPercent}%).`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setPins((prev) => [...prev, newPin]);
    setActivePinId(newPin.id);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveDocumentTitle(file.name);
    const url = URL.createObjectURL(file);
    setActiveDocumentUrl(url);
    setPins([]); // reset pins for new file
  };

  const handleAddComment = () => {
    if (!newCommentInput.trim() || !activePinId) return;

    setPins((prev) =>
      prev.map((pin) => {
        if (pin.id === activePinId) {
          return {
            ...pin,
            comments: [
              ...pin.comments,
              {
                id: `c-${Date.now()}`,
                authorName: 'Current User',
                text: newCommentInput.trim(),
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return pin;
      })
    );

    setNewCommentInput('');
  };

  const handleToggleResolve = (pinId: string) => {
    setPins((prev) =>
      prev.map((p) => (p.id === pinId ? { ...p, resolved: !p.resolved } : p))
    );
  };

  const activePin = pins.find((p) => p.id === activePinId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header Bar */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <span>Document &amp; Asset Proofing Workspace</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  Coordinate Pin Annotations
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeDocumentTitle} • Click anywhere on document to drop pin comments
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition flex items-center space-x-1.5 border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload File / PDF</span>
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-x divide-slate-200">
          
          {/* Document Canvas (8 Cols) */}
          <div className="lg:col-span-8 p-4 bg-slate-950 flex flex-col items-center justify-center overflow-auto relative">
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative max-w-full max-h-full cursor-crosshair rounded-xl overflow-hidden shadow-2xl border border-slate-800 select-none"
            >
              <img
                src={activeDocumentUrl}
                alt="Proof Document"
                className="max-h-[65vh] object-contain rounded-xl"
              />

              {/* Render Pins at exact relative coordinate percentages */}
              {pins.map((pin) => {
                const isSelected = pin.id === activePinId;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinId(pin.id);
                    }}
                    style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center shadow-lg transition transform ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/40 scale-125 z-20'
                        : pin.resolved
                        ? 'bg-slate-600 text-slate-300 z-10'
                        : 'bg-rose-500 text-white z-10 hover:scale-110'
                    }`}
                  >
                    {pin.pinNumber}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 font-mono text-center">
              Click anywhere on document preview to add new coordinate pin markups.
            </div>
          </div>

          {/* Threaded Pin Comments Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-50 p-4 space-y-4 overflow-y-auto flex flex-col">
            
            {/* Pins Summary Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center space-x-1.5">
                <Pin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Proofing Pins ({pins.length})</span>
              </h4>
              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                {pins.filter((p) => p.resolved).length} Resolved
              </span>
            </div>

            {/* Pins Selector List */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {pins.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => setActivePinId(pin.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1 ${
                    activePinId === pin.id
                      ? 'bg-slate-900 text-white'
                      : pin.resolved
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <span>Pin #{pin.pinNumber}</span>
                  {pin.resolved && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>

            {/* Active Pin Details & Threaded Comments */}
            {activePin ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 flex-1 flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">
                        Pin #{activePin.pinNumber} Markup Point
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">
                        Coordinates: X: {activePin.xPercent}% | Y: {activePin.yPercent}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleResolve(activePin.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase transition ${
                        activePin.resolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {activePin.resolved ? 'Resolved' : 'Mark Resolved'}
                    </button>
                  </div>

                  {/* Comment Thread List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto text-xs pr-1">
                    {activePin.comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>{comment.authorName}</span>
                          <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Comment Input Box */}
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add feedback for Pin..."
                    value={newCommentInput}
                    onChange={(e) => setNewCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">
                Click any pin on image to view feedback thread
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewModal;
