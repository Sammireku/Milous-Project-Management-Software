import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  StickyNote, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Palette, 
  MousePointer, 
  Square, 
  Circle, 
  Minus, 
  ArrowUpRight, 
  Eraser, 
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StickyNoteItem {
  id: string;
  title: string;
  content: string;
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'purple';
  author: string;
  createdAt: string;
}

export const WhiteboardPage: React.FC = () => {
  const { user } = useAuth();

  // Tab: 'WHITEBOARD' | 'STICKIES' | 'GOOGLE_SUITE'
  const [activeTab, setActiveTab] = useState<'WHITEBOARD' | 'STICKIES' | 'GOOGLE_SUITE'>('WHITEBOARD');

  // Google Workspace Tool selection
  const [selectedGSuiteApp, setSelectedGSuiteApp] = useState<'DOCS' | 'SHEETS' | 'SLIDES'>('DOCS');

  // Sticky Notes State
  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>([
    {
      id: 'sn-1',
      title: 'Community Borehole Site A',
      content: 'Hydrological survey confirmed high aquifer yield at GPS: 6.745° N, 1.583° W. Water committee elected 7 women leaders.',
      color: 'yellow',
      author: 'Milou Mireku',
      createdAt: 'Today, 09:30 AM'
    },
    {
      id: 'sn-2',
      title: 'USAID Audit Readiness',
      content: 'Verify all fuel log receipts against vehicle GPS telemetry logs before Thursday handover.',
      color: 'pink',
      author: 'Finance Unit',
      createdAt: 'Yesterday'
    },
    {
      id: 'sn-3',
      title: 'Cold-Chain Solar Batteries',
      content: 'Contractor delivered 4 lithium battery banks to Kenema Central Hospital. Inspection pending sign-off.',
      color: 'green',
      author: 'Field Ops',
      createdAt: '2 days ago'
    },
    {
      id: 'sn-4',
      title: 'Quarterly Review Meeting Agenda',
      content: '1. Phase 2 disbursements\n2. Donor risk analysis\n3. Mobile app offline telemetry roll-out',
      color: 'blue',
      author: 'CEO Office',
      createdAt: '3 days ago'
    }
  ]);

  const [newStickyTitle, setNewStickyTitle] = useState('');
  const [newStickyContent, setNewStickyContent] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'green' | 'pink' | 'blue' | 'purple'>('yellow');
  const [isAddingSticky, setIsAddingSticky] = useState(false);

  // In-app Whiteboard Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle'>('pen');
  const [color, setColor] = useState('#059669'); // emerald-600 default
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initial white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw a subtle dot grid pattern like Klaxoon
    ctx.fillStyle = '#e2e8f0';
    for (let x = 20; x < rect.width; x += 30) {
      for (let y = 20; y < rect.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 24;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 18;
      ctx.globalAlpha = 0.3;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 1.0;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // redraw grid
    ctx.fillStyle = '#e2e8f0';
    for (let x = 20; x < rect.width; x += 30) {
      for (let y = 20; y < rect.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Milous_Whiteboard_${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  };

  const handleAddSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyTitle.trim() && !newStickyContent.trim()) return;

    const newNote: StickyNoteItem = {
      id: `sn-${Date.now()}`,
      title: newStickyTitle.trim() || 'Quick Note',
      content: newStickyContent.trim(),
      color: newStickyColor,
      author: user?.displayName || 'Team Member',
      createdAt: 'Just now'
    };

    setStickyNotes([newNote, ...stickyNotes]);
    setNewStickyTitle('');
    setNewStickyContent('');
    setIsAddingSticky(false);
  };

  const deleteSticky = (id: string) => {
    setStickyNotes(stickyNotes.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-xs">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Collaborative Whiteboard &amp; Workstation
            </h1>
            <p className="text-xs text-slate-500">
              Interactive Klaxoon canvas, physical-feel sticky notes, and Google Workspace Suite
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('WHITEBOARD')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'WHITEBOARD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>Klaxoon Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STICKIES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'STICKIES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>Sticky Notes ({stickyNotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GOOGLE_SUITE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'GOOGLE_SUITE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Docs, Slides, Sheets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KLAXOON IN-APP WHITEBOARD CANVAS */}
      {activeTab === 'WHITEBOARD' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
          
          {/* Whiteboard Toolbar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Tools */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg font-bold flex items-center space-x-1 ${
                  tool === 'pen' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Pen"
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Pen</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('highlighter')}
                className={`p-2 rounded-lg font-bold flex items-center space-x-1 ${
                  tool === 'highlighter' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Highlighter"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Highlighter</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg font-bold flex items-center space-x-1 ${
                  tool === 'eraser' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Eraser</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
              {['#059669', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0f172a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    color === c ? 'border-slate-900 scale-110 shadow-xs' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Thickness */}
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">Thickness:</span>
              <input
                type="range"
                min="1"
                max="12"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-20 cursor-pointer accent-emerald-600"
              />
              <span className="font-mono text-xs font-bold text-slate-700 w-4">{lineWidth}</span>
            </div>

            {/* Actions: Clear & Export */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition flex items-center space-x-1"
                title="Clear whiteboard"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={downloadCanvas}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center space-x-1.5 shadow-xs"
                title="Download canvas image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full h-[650px] bg-white cursor-crosshair overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full block"
            />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-medium backdrop-blur-xs pointer-events-none">
              Milous Klaxoon Canvas • Freehand brainstorming &amp; flowcharts
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CUSTOM STICKY PAPER NOTES */}
      {activeTab === 'STICKIES' && (
        <div className="space-y-6">
          {/* Sticky Notes Header & Add Button */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Interactive Sticky Notes Board</h2>
              <p className="text-xs text-slate-500">Post quick thoughts, field findings, risk items, and reminders</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingSticky(!isAddingSticky)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingSticky ? 'Close Sticky Form' : '+ New Sticky Note'}</span>
            </button>
          </div>

          {/* Add Sticky Form */}
          {isAddingSticky && (
            <form onSubmit={handleAddSticky} className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200 shadow-md space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Pin a Paper Sticky Note</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-500">Color:</span>
                  {(['yellow', 'pink', 'green', 'blue', 'purple'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStickyColor(c)}
                      className={`w-6 h-6 rounded-md border transition ${
                        newStickyColor === c ? 'ring-2 ring-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                      } ${
                        c === 'yellow' ? 'bg-amber-200 border-amber-300' :
                        c === 'pink' ? 'bg-rose-200 border-rose-300' :
                        c === 'green' ? 'bg-emerald-200 border-emerald-300' :
                        c === 'blue' ? 'bg-blue-200 border-blue-300' :
                        'bg-purple-200 border-purple-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Sticky Title (e.g., Water Sample Result - Village 4)"
                value={newStickyTitle}
                onChange={(e) => setNewStickyTitle(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <textarea
                placeholder="Write your observation, action item, or note here..."
                value={newStickyContent}
                onChange={(e) => setNewStickyContent(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 h-24"
                required
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSticky(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Pin Note to Board
                </button>
              </div>
            </form>
          )}

          {/* Sticky Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stickyNotes.map((note) => {
              let noteBg = 'bg-amber-100 border-amber-200 text-amber-950';
              let pinBg = 'bg-amber-400';
              if (note.color === 'pink') {
                noteBg = 'bg-rose-100 border-rose-200 text-rose-950';
                pinBg = 'bg-rose-400';
              } else if (note.color === 'green') {
                noteBg = 'bg-emerald-100 border-emerald-200 text-emerald-950';
                pinBg = 'bg-emerald-400';
              } else if (note.color === 'blue') {
                noteBg = 'bg-blue-100 border-blue-200 text-blue-950';
                pinBg = 'bg-blue-400';
              } else if (note.color === 'purple') {
                noteBg = 'bg-purple-100 border-purple-200 text-purple-950';
                pinBg = 'bg-purple-400';
              }

              return (
                <div
                  key={note.id}
                  className={`p-5 rounded-2xl border shadow-md relative group transition-transform hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[220px] ${noteBg}`}
                >
                  {/* Top Pin Accent */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3.5 h-3.5 rounded-full ${pinBg} shadow-xs border border-white/60`} />
                    <button
                      type="button"
                      onClick={() => deleteSticky(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-600 transition"
                      title="Remove note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Note Body */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-sm tracking-tight leading-snug">{note.title}</h3>
                    <p className="text-xs opacity-90 whitespace-pre-line leading-relaxed">{note.content}</p>
                  </div>

                  {/* Footer Author */}
                  <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[10px] opacity-70 mt-2">
                    <span>{note.author}</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE DOCS, SLIDES, SHEETS INTEGRATION */}
      {activeTab === 'GOOGLE_SUITE' && (
        <div className="space-y-6">
          
          {/* Sub-selector */}
          <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedGSuiteApp('DOCS')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedGSuiteApp === 'DOCS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Google Docs</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGSuiteApp('SHEETS')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedGSuiteApp === 'SHEETS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGSuiteApp('SLIDES')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedGSuiteApp === 'SLIDES'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span>Google Slides</span>
            </button>
          </div>

          {/* Docs View */}
          {selectedGSuiteApp === 'DOCS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Google Docs Workspace Integration</h2>
                    <p className="text-xs text-slate-500">Draft project proposals, compliance audits, and field memos</p>
                  </div>
                </div>
                <a
                  href="https://docs.new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <span>Open docs.new</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    DOC
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">USAID Grant Charter Template</h3>
                  <p className="text-xs text-slate-500">Pre-structured with USAID automated compliance clauses, deliverables, and M&amp;E indicators.</p>
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Create from Template</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    MEMO
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Field Handover Protocol</h3>
                  <p className="text-xs text-slate-500">Official protocol for handing completed community infrastructure to local government.</p>
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Create from Template</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    LOG
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Procurement Inspection Memo</h3>
                  <p className="text-xs text-slate-500">Sign-off documentation verifying physical equipment delivery from vendors.</p>
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Create from Template</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Sheets View */}
          {selectedGSuiteApp === 'SHEETS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Google Sheets Financial &amp; Data Matrix</h2>
                    <p className="text-xs text-slate-500">Multi-donor co-funding tables, procurement ledgers, and raw survey data</p>
                  </div>
                </div>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <span>Open sheets.new</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    XLS
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Multi-Donor Budget Matrix</h3>
                  <p className="text-xs text-slate-500">Dynamic co-share formulas preventing grant double-charging across USAID and Global Fund.</p>
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:underline pt-1"
                  >
                    <span>Launch Spreadsheet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    XLS
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">M&amp;E Household Sampling Data</h3>
                  <p className="text-xs text-slate-500">Structured beneficiary enumeration roster with household baseline metrics and GPS tags.</p>
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:underline pt-1"
                  >
                    <span>Launch Spreadsheet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    XLS
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Exchange Rate Fluctuation Ledger</h3>
                  <p className="text-xs text-slate-500">Track variance between USD grant commitments and local currency disbursements.</p>
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:underline pt-1"
                  >
                    <span>Launch Spreadsheet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Slides View */}
          {selectedGSuiteApp === 'SLIDES' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Google Slides Presentation Builder</h2>
                    <p className="text-xs text-slate-500">Donor briefing decks, milestone photo presentations, and executive reviews</p>
                  </div>
                </div>
                <a
                  href="https://slides.new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <span>Open slides.new</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    PPT
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Quarterly Donor Progress Deck</h3>
                  <p className="text-xs text-slate-500">12-slide template highlighting key deliverables, budget burn rate, and community photo proof.</p>
                  <a
                    href="https://slides.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:underline pt-1"
                  >
                    <span>Launch Slide Deck</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    PPT
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Community Stakeholder Briefing</h3>
                  <p className="text-xs text-slate-500">Visual, non-technical presentation for village elders and water committee members.</p>
                  <a
                    href="https://slides.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:underline pt-1"
                  >
                    <span>Launch Slide Deck</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-200 transition space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    PPT
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Board Executive Summary</h3>
                  <p className="text-xs text-slate-500">High-level strategic KPIs, risk exposure heatmap, and future grant pipeline.</p>
                  <a
                    href="https://slides.new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:underline pt-1"
                  >
                    <span>Launch Slide Deck</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
