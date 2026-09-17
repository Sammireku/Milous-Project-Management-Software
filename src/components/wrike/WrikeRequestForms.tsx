import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  MapPin, 
  Zap, 
  Clock,
  ShieldAlert,
  Building2,
  Plus,
  Trash2,
  Move,
  Sliders,
  Settings2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { TaskPriority } from '../../types';
import { logAuditEvent } from '../../lib/auditLogger';

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'file';
  options?: string[];
  required: boolean;
}

export interface ConditionalRoutingRule {
  id: string;
  fieldId: string;
  operator: 'equals' | 'greater_than' | 'contains';
  value: string;
  targetProjectId: string;
  targetPriority: TaskPriority;
}

export const WrikeRequestForms: React.FC = () => {
  const { createTask, indicators, activeProject, projects } = useFirestore();
  const { currentUser, userRole } = useAuth();

  // Mode Tab: 'SUBMIT' vs 'BUILDER'
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'BUILDER'>('SUBMIT');

  // Active Submission Form
  const [formType, setFormType] = useState<'REQUISITION' | 'INCIDENT' | 'CUSTOM'>('REQUISITION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [estimatedCost, setEstimatedCost] = useState<number>(500);
  const [targetProject, setTargetProject] = useState<string>(projects[0]?.id || 'proj-wash-01');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dynamic Builder State
  const [builderFields, setBuilderFields] = useState<CustomFormField[]>([
    { id: 'f-1', label: 'Requisition / Incident Title', type: 'text', required: true },
    { id: 'f-2', label: 'Estimated Cost (USD)', type: 'number', required: true },
    {
      id: 'f-3',
      label: 'Impact Category',
      type: 'select',
      options: ['Equipment Repair', 'Emergency WASH Outbreak', 'Donor Audit', 'General Requisition'],
      required: true,
    },
    { id: 'f-4', label: 'Site Inspection Report / Image', type: 'file', required: false },
  ]);

  const [routingRules, setRoutingRules] = useState<ConditionalRoutingRule[]>([
    {
      id: 'r-1',
      fieldId: 'f-2',
      operator: 'greater_than',
      value: '1000',
      targetProjectId: projects[0]?.id || 'proj-wash-01',
      targetPriority: 'URGENT',
    },
  ]);

  // Dragged Field Index for Reordering
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  // Add field to builder
  const handleAddField = (type: CustomFormField['type']) => {
    const newField: CustomFormField = {
      id: `f-${Date.now()}`,
      label: `New ${type.toUpperCase()} Field`,
      type,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
      required: false,
    };
    setBuilderFields((prev) => [...prev, newField]);
  };

  const handleDeleteField = (id: string) => {
    setBuilderFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIndex === null || draggedFieldIndex === index) return;

    const newFields = [...builderFields];
    const draggedItem = newFields[draggedFieldIndex];
    newFields.splice(draggedFieldIndex, 1);
    newFields.splice(index, 0, draggedItem);

    setDraggedFieldIndex(index);
    setBuilderFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Apply conditional routing
    let routedPriority = priority;
    let routedProject = targetProject;

    if (estimatedCost > 1000) {
      routedPriority = 'URGENT';
    }

    await createTask({
      projectId: routedProject,
      title: `[Dynamic Intake] ${title}`,
      description: `${description}\n\n[Form Submissions Data] Estimated Cost: $${estimatedCost} USD.`,
      status: 'TODO',
      priority: routedPriority,
      assigneeId: currentUser?.id || 'usr-field-01',
      assigneeName: currentUser?.displayName || 'Ama Osei',
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      dependencies: [],
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTitle('');
      setDescription('');
    }, 3500);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Wrike Dynamic Intake System
            </h3>
            <p className="text-xs text-slate-500">
              Drag-and-drop intake builder with conditional workflow routing rules.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('SUBMIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'SUBMIT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submit Request
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BUILDER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'BUILDER' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Form Builder &amp; Routing</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SUBMIT REQUEST */}
      {activeTab === 'SUBMIT' && (
        <div className="space-y-5">
          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold">Request Submitted &amp; Routed!</h4>
              <p className="text-xs text-emerald-800">
                Created project task with automatic workflow priority assignment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solar Borehole Pump Procurement"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Details &amp; Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specifications or field context..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  />
                  {estimatedCost > 1000 && (
                    <span className="text-[10px] text-amber-700 font-bold mt-1 block">
                      ⚡ Conditional Rule Triggered: Costs &gt; $1000 auto-elevated to URGENT priority.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Project</label>
                  <select
                    value={targetProject}
                    onChange={(e) => setTargetProject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Submit Dynamic Request</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* MODE 2: DRAG & DROP FORM BUILDER & CONDITIONAL ROUTING */}
      {activeTab === 'BUILDER' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase">
                Drag-and-Drop Form Builder Canvas
              </h4>
              <div className="flex items-center space-x-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleAddField('text')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
                >
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('number')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
                >
                  + Number
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('select')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
                >
                  + Dropdown
                </button>
              </div>
            </div>

            {/* Draggable Form Fields List */}
            <div className="space-y-2 pt-1">
              {builderFields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs cursor-move hover:border-emerald-500 transition"
                >
                  <div className="flex items-center space-x-3">
                    <Move className="w-4 h-4 text-slate-500" />
                    <div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          const updated = [...builderFields];
                          updated[index].label = e.target.value;
                          setBuilderFields(updated);
                        }}
                        className="bg-transparent font-bold text-white border-b border-slate-600 focus:outline-none focus:border-emerald-400"
                      />
                      <span className="text-[10px] text-slate-400 uppercase font-mono ml-2">
                        [{field.type}]
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1 hover:bg-slate-700 text-rose-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Workflow Routing Builder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Conditional Routing Logic Rules</span>
            </h4>

            {routingRules.map((rule) => (
              <div key={rule.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="font-bold text-slate-500">IF Field</span>
                <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-bold">Estimated Cost</span>
                <span className="font-bold text-amber-600">&gt; 1000 USD</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-500">THEN Route Priority =</span>
                <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">URGENT</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WrikeRequestForms;
