import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Plus, 
  CheckSquare, 
  DollarSign, 
  FolderKanban, 
  FolderPlus, 
  LayoutGrid, 
  Send, 
  UserPlus, 
  PenTool, 
  Sparkles, 
  Building2, 
  User, 
  Calendar,
  Search,
  Mail,
  MessageSquare,
  Phone,
  Check,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { TaskStatus, TaskPriority, ProjectSector } from '../../types';
import { CreateType } from './GlobalCreateDropdown';

interface GlobalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CreateType;
}

export const GlobalCreateModal: React.FC<GlobalCreateModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'task'
}) => {
  const navigate = useNavigate();
  const { 
    createTask, 
    createExpense, 
    createProject, 
    projects, 
    activeProject, 
    addAppNotification,
    stockItems,
    createStockRequest
  } = useFirestore();
  const { currentUser, userRole, allUsers } = useAuth();

  const [activeTab, setActiveTab] = useState<CreateType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('HIGH');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('TODO');
  const [taskProjectId, setTaskProjectId] = useState<string>(activeProject?.id || projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [assigneeSearch, setAssigneeSearch] = useState<string>('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  // Project form state
  const [projTitle, setProjTitle] = useState('');
  const [projCode, setProjCode] = useState('');
  const [projSectorSelect, setProjSectorSelect] = useState<string>('WASH');
  const [projCurrency, setProjCurrency] = useState('USD');
  const [projBudget, setProjBudget] = useState<number>(150000);
  const [projLocation, setProjLocation] = useState('Tamale & Northern Region');

  // Folder form state
  const [folderName, setFolderName] = useState('');
  const [folderTargetProject, setFolderTargetProject] = useState(projects[0]?.id || '');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderColor, setFolderColor] = useState('emerald');

  // Space form state
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceIcon, setSpaceIcon] = useState('🌍');

  // Request form state
  const [requestType, setRequestType] = useState<'STOCK' | 'EXPENSE'>('STOCK');
  const [requestItemName, setRequestItemName] = useState('');
  const [requestQty, setRequestQty] = useState<number>(10);
  const [requestProjectId, setRequestProjectId] = useState(projects[0]?.id || '');
  const [requestPurpose, setRequestPurpose] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('field_officer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteChannel, setInviteChannel] = useState<'email' | 'whatsapp'>('email');
  const [inviteWhatsappNumber, setInviteWhatsappNumber] = useState('+233');

  // Whiteboard quick launch
  const [wbTitle, setWbTitle] = useState('Sprint Planning Session');
  const [wbTemplate, setWbTemplate] = useState('Retrospective & Action Matrix');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => 
    u.displayName.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await createTask({
      projectId: taskProjectId || projects[0]?.id || 'proj-wash-01',
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      status: taskStatus,
      priority: taskPriority,
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName || 'Unassigned',
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      dependencies: [],
      fieldData: {
        gpsCoordinates: { lat: 9.4074, lng: -0.8533 },
      },
    });

    if (assigneeId && assigneeName) {
      const activeChannels: string[] = [];
      if (notifyEmail) activeChannels.push('Email');
      if (notifySms) activeChannels.push('SMS');
      if (notifyWhatsapp) activeChannels.push('WhatsApp');

      addAppNotification({
        category: 'project_update',
        title: `Task Assigned: ${taskTitle.trim()}`,
        message: `Assigned to ${assigneeName}. Dispatched alerts via [${activeChannels.join(', ')}].`,
        targetRoles: ['PROJECT_MANAGER', 'FIELD_OFFICER', 'CEO', 'ADMIN'],
        severity: 'medium',
      });
    }

    onClose();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    await createProject({
      code: projCode.trim() || `GH-${projSectorSelect.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
      title: projTitle.trim(),
      description: `New ${projSectorSelect} mission in ${projLocation}.`,
      country: 'Ghana',
      location: projLocation,
      sector: projSectorSelect,
      status: 'ACTIVE',
      currency: projCurrency,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      donors: [
        {
          donorCode: 'USAID',
          grantCode: `USAID-GRANT-${new Date().getFullYear()}`,
          totalAllocation: Math.round(projBudget * 0.6),
          currency: projCurrency,
          reportingCycle: 'QUARTERLY',
        },
        {
          donorCode: 'EU',
          grantCode: `EU-FED-${new Date().getFullYear()}`,
          totalAllocation: Math.round(projBudget * 0.4),
          currency: projCurrency,
          reportingCycle: 'MONTHLY',
        },
      ],
      totalBudget: projBudget,
      leadManagerId: currentUser?.id || 'usr-pm-01',
      leadManagerName: currentUser?.displayName || 'Kofi Mensah',
      teamMemberIds: [currentUser?.id || 'usr-pm-01'],
    });

    addAppNotification({
      category: 'project_update',
      title: `New Project Created: ${projTitle.trim()}`,
      message: `Allocated $${projBudget.toLocaleString()} under ${projSectorSelect} sector.`,
      severity: 'low',
    });

    onClose();
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    addAppNotification({
      category: 'project_update',
      title: `Project Folder Created: ${folderName}`,
      message: `Folder established for organizing deliverables and documents.`,
      severity: 'low',
    });

    onClose();
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    addAppNotification({
      category: 'project_update',
      title: `Mission Space Created: ${spaceName}`,
      message: `${spaceIcon} New collaborative workspace created for cross-functional workflows.`,
      severity: 'low',
    });

    onClose();
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === requestProjectId);

    if (requestType === 'STOCK') {
      const stock = stockItems.find((s) => s.id === requestItemName) || stockItems[0];
      await createStockRequest({
        stockItemId: stock?.id || 'stk-1',
        stockItemName: stock?.name || 'Water Treatment Chemicals',
        measurementUnit: stock?.measurementUnit || 'BAGS',
        quantityRequested: Number(requestQty),
        projectId: proj?.id || 'prj-wash-01',
        projectName: proj?.title || 'Community Water Project',
        requestedBy: currentUser?.id || 'usr-1',
        requesterName: currentUser?.displayName || 'Field Officer',
        purpose: requestPurpose.trim() || 'Urgent field distribution',
        status: 'PENDING',
      });
    } else {
      await createExpense({
        projectId: proj?.id || 'prj-wash-01',
        amount: Number(requestQty),
        currency: 'USD',
        category: 'SUPPLIES',
        description: requestPurpose.trim() || 'Urgent field operational requisition',
        vendor: 'Authorized Vendor',
        status: 'PENDING',
        donorAllocations: [],
      });
    }

    addAppNotification({
      category: 'approval',
      title: `New ${requestType === 'STOCK' ? 'Stock' : 'Expense'} Requisition Submitted`,
      message: `Submitted by ${currentUser?.displayName} for ${proj?.title}. Awaiting leadership signoff.`,
      severity: 'medium',
    });

    onClose();
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() && inviteChannel === 'email') return;

    addAppNotification({
      category: 'inbound_message',
      title: `Invitation Dispatched to ${inviteName || inviteEmail}`,
      message: `Role: ${inviteRole}. Dispatched via ${inviteChannel.toUpperCase()}${
        inviteChannel === 'whatsapp' ? ` (${inviteWhatsappNumber})` : ` (${inviteEmail})`
      }.`,
      severity: 'low',
    });

    onClose();
  };

  const handleLaunchWhiteboard = () => {
    onClose();
    navigate('/whiteboard');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create New Entity</h3>
              <p className="text-[10px] text-emerald-400 font-mono">Milous Project Enterprise Workflows</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
          {[
            { id: 'task', label: 'Task', icon: CheckSquare },
            { id: 'project', label: 'Project', icon: FolderKanban },
            { id: 'folder', label: 'Folder', icon: FolderPlus },
            { id: 'space', label: 'Space', icon: LayoutGrid },
            { id: 'request', label: 'Request', icon: Send },
            { id: 'invite', label: 'Invite', icon: UserPlus },
            { id: 'whiteboard', label: 'Whiteboard', icon: PenTool },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CreateType)}
                className={`py-3 px-3.5 flex items-center space-x-1.5 transition border-b-2 shrink-0 ${
                  isActive
                    ? 'border-emerald-600 text-slate-900 bg-white font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Bodies */}
        <div className="p-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* TASK FORM */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct water sanitation field audit at Tamale Clinic"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Deliverables</label>
                <textarea
                  rows={2}
                  placeholder="Detailed specifications, safety protocols, and donor output milestones..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Associated Project *</label>
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    <option value="URGENT">🔴 Urgent</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee Search */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1">Assign Task To</label>
                <input
                  type="text"
                  placeholder="Type to search team member or field officer..."
                  value={assigneeName ? `${assigneeName} (${assigneeId})` : assigneeSearch}
                  onFocus={() => setIsAssigneeDropdownOpen(true)}
                  onChange={(e) => {
                    setAssigneeSearch(e.target.value);
                    setAssigneeName('');
                    setAssigneeId('');
                    setIsAssigneeDropdownOpen(true);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />

                {isAssigneeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssigneeId(u.id);
                          setAssigneeName(u.displayName);
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{u.displayName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{u.role.replace('_', ' ')}</div>
                        </div>
                        {assigneeId === u.id && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <Check className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          )}

          {/* PROJECT FORM */}
          {activeTab === 'project' && (
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project / Grant Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northern Region Water & Sanitation Initiative"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grant Code</label>
                  <input
                    type="text"
                    placeholder="e.g. GH-WASH-2026"
                    value={projCode}
                    onChange={(e) => setProjCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector *</label>
                  <select
                    value={projSectorSelect}
                    onChange={(e) => setProjSectorSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    <option value="WASH">WASH (Water, Sanitation, Hygiene)</option>
                    <option value="HEALTH">Community Health & Nutrition</option>
                    <option value="EDUCATION">Rural Education & Schools</option>
                    <option value="FOOD_SECURITY">Food Security & Agriculture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Grant Budget ($)</label>
                  <input
                    type="number"
                    value={projBudget}
                    onChange={(e) => setProjBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / District</label>
                  <input
                    type="text"
                    value={projLocation}
                    onChange={(e) => setProjLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <FolderKanban className="w-4 h-4" />
                  <span>Initiate Project Grant</span>
                </button>
              </div>
            </form>
          )}

          {/* FOLDER FORM */}
          {activeTab === 'folder' && (
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Folder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Field Inspection Audits"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Project</label>
                <select
                  value={folderTargetProject}
                  onChange={(e) => setFolderTargetProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Folder Purpose & Description</label>
                <textarea
                  rows={2}
                  placeholder="Group documents, scanned receipts, and community surveys..."
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Folder</span>
                </button>
              </div>
            </form>
          )}

          {/* SPACE FORM */}
          {activeTab === 'space' && (
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Icon</label>
                  <select
                    value={spaceIcon}
                    onChange={(e) => setSpaceIcon(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-center font-bold text-base"
                  >
                    <option value="🌍">🌍</option>
                    <option value="💧">💧</option>
                    <option value="🏥">🏥</option>
                    <option value="📚">📚</option>
                    <option value="🌾">🌾</option>
                    <option value="⚡">⚡</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Space Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Africa Operations"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Space Scope & Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Cross-functional humanitarian programs, regional field offices, and donor boards..."
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <LayoutGrid className="w-4 h-4" />
                  <span>Create Mission Space</span>
                </button>
              </div>
            </form>
          )}

          {/* REQUEST FORM */}
          {activeTab === 'request' && (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRequestType('STOCK')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                    requestType === 'STOCK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Stock Inventory Requisition
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('EXPENSE')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                    requestType === 'EXPENSE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Direct Financial Expense Claim
                </button>
              </div>

              {requestType === 'STOCK' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Stock Item *</label>
                  <select
                    value={requestItemName}
                    onChange={(e) => setRequestItemName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    {stockItems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.closingStock} {s.measurementUnit} in stock)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={requestQty}
                    onChange={(e) => setRequestQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allocated Project *</label>
                  <select
                    value={requestProjectId}
                    onChange={(e) => setRequestProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.title}</option>
                    ))}
                  </select>
                </div>

                {requestType === 'STOCK' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity Requested *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={requestQty}
                      onChange={(e) => setRequestQty(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose & Justification *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the humanitarian justification for this stock or expense authorization..."
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <Send className="w-4 h-4" />
                  <span>Submit Requisition</span>
                </button>
              </div>
            </form>
          )}

          {/* INVITE FORM */}
          {activeTab === 'invite' && (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Member Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Kwame Mensah"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Authorization *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 capitalize"
                  >
                    <option value="field_officer">Field Officer</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="me_officer">M&E Officer</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="auditor">Auditor / Donor Observer</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInviteChannel('email')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center space-x-1 ${
                    inviteChannel === 'email' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invite via Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInviteChannel('whatsapp')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center space-x-1 ${
                    inviteChannel === 'whatsapp' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Invite via WhatsApp</span>
                </button>
              </div>

              {inviteChannel === 'email' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="kwame.mensah@alliance.ngo"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+233 24 123 4567"
                    value={inviteWhatsappNumber}
                    onChange={(e) => setInviteWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Welcome Message (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="You've been invited to join the Milous Project workspace for Northern Region initiatives..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center space-x-1.5 shadow-xs">
                  <UserPlus className="w-4 h-4" />
                  <span>Send Official Invitation</span>
                </button>
              </div>
            </form>
          )}

          {/* WHITEBOARD QUICK LAUNCH */}
          {activeTab === 'whiteboard' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  value={wbTitle}
                  onChange={(e) => setWbTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Whiteboard Template</label>
                <select
                  value={wbTemplate}
                  onChange={(e) => setWbTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900"
                >
                  <option value="Retrospective & Action Matrix">Retrospective & Action Matrix</option>
                  <option value="Logframe / Results Framework Canvas">Logframe / Results Framework Canvas</option>
                  <option value="Sticky Notes Brainstorming Board">Sticky Notes Brainstorming Board</option>
                  <option value="Gantt & Milestone Flowchart">Gantt & Milestone Flowchart</option>
                  <option value="Blank Collaborative Canvas">Blank Collaborative Canvas</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <PenTool className="w-4 h-4 text-teal-700" />
                  <span>Interactive Klaxoon-style Whiteboard</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Whiteboard integrates sticky notes, real-time drawing, Klaxoon boards, and Google Docs/Slides/Sheets live embedding.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-700">Cancel</button>
                <button
                  type="button"
                  onClick={handleLaunchWhiteboard}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Launch Whiteboard Workstation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalCreateModal;
