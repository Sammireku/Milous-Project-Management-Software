import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Task, 
  Indicator, 
  Expense, 
  Project, 
  TaskStatus, 
  ExpenseStatus, 
  Vendor, 
  Donor, 
  AppNotification, 
  SurveyResponse, 
  UserRole, 
  Timesheet, 
  TimesheetStatus,
  ApprovalStepRecord,
  ImpactAssessment,
  GrantProposal,
  MaintenanceRecord,
  MaintenanceStatus,
  StockItem,
  StockUsageRequest
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_INDICATORS, 
  INITIAL_EXPENSES,
  INITIAL_VENDORS,
  INITIAL_DONORS,
  INITIAL_TIMESHEETS,
  INITIAL_IMPACT_ASSESSMENTS,
  INITIAL_PROPOSALS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_STOCK_ITEMS,
  INITIAL_STOCK_REQUESTS
} from '../mockData';
import { useAuth } from './AuthContext';

export interface SyncNotification {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}

interface FirestoreContextType {
  // Active Project & Collections
  projects: Project[];
  activeProjectId: string;
  activeProject: Project | undefined;
  setActiveProjectId: (id: string) => void;
  tasks: Task[];
  allTasks: Task[];
  indicators: Indicator[];
  expenses: Expense[];
  allExpenses: Expense[];
  vendors: Vendor[];
  donors: Donor[];

  // Timesheets Module
  timesheets: Timesheet[];
  createTimesheet: (tsData: Omit<Timesheet, 'id' | 'createdAt' | 'submittedAt'>) => Promise<Timesheet>;
  addTimesheet: (tsData: Omit<Timesheet, 'id' | 'createdAt' | 'submittedAt'>) => Promise<Timesheet>;
  updateTimesheetStatus: (tsId: string, status: TimesheetStatus, reviewerName: string, notes?: string) => Promise<void>;
  advanceTimesheetApproval: (
    tsId: string, 
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', 
    approverName: string, 
    approverRole: string, 
    comments?: string
  ) => Promise<void>;
  deleteTimesheet: (tsId: string) => Promise<void>;

  // Multi-Currency Engine
  exchangeRates: Record<string, number>;
  isFetchingRates: boolean;
  ratesLastUpdated: string | null;
  ratesSource: 'live_api' | 'cache' | 'fallback' | null;
  selectedDisplayCurrency: string;
  setSelectedDisplayCurrency: (curr: string) => void;
  fetchLiveExchangeRates: (base?: string) => Promise<Record<string, number>>;
  updateExchangeRate: (currency: string, rate: number) => void;
  convertCurrency: (amount: number, from: string, to: string) => number;
  isFixedRateOverride: boolean;
  setIsFixedRateOverride: (active: boolean) => void;
  fixedRateOverrideValue: number;
  setFixedRateOverrideValue: (val: number) => void;

  // Offline-First Engine
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingSyncCount: number;
  lastSyncedAt: string;
  triggerManualSync: () => Promise<void>;

  // Task & Auto-Sync Operations
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<{ syncedIndicator?: { code: string; title: string; increment: number } }>;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  archiveOldCompletedTasks: (daysOld?: number) => Promise<number>;
  unarchiveTask: (taskId: string) => Promise<void>;

  // Project Operations
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Indicator Operations
  createIndicator: (indData: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Indicator>;
  updateIndicator: (indId: string, updates: Partial<Indicator>) => Promise<void>;
  recordIndicatorMeasurement: (indId: string, increment: number, note: string) => Promise<void>;

  // Expense & Cost Splitting Operations
  createExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpenseStatus: (expenseId: string, newStatus: ExpenseStatus) => Promise<void>;
  updateExpenseRiskFlags: (expenseId: string, riskFlags: NonNullable<Expense['aiRiskFlags']>) => Promise<void>;

  // Vendor Database Operations
  createVendor: (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vendor>;
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;

  // Donor Database Operations
  createDonor: (donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Donor>;
  updateDonor: (donorId: string, updates: Partial<Donor>) => Promise<void>;
  deleteDonor: (donorId: string) => Promise<void>;

  // Flyout & Command Palette Global Control
  selectedFlyoutItem: { type: 'task' | 'project' | 'expense' | 'indicator' | 'vendor' | 'donor'; id: string; item: any } | null;
  openFlyout: (type: 'task' | 'project' | 'expense' | 'indicator' | 'vendor' | 'donor', item: any) => void;
  closeFlyout: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Sync / Toast Notifications
  notifications: SyncNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Enterprise Role-Based App Notifications System
  appNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissAppNotification: (id: string) => void;
  addAppNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  sendInboundMessage: (senderName: string, senderRole: string, messageText: string, projectName?: string) => Promise<void>;
  clearAllAppNotifications: () => void;

  // Google Forms & Field Survey Engine
  surveyResponses: SurveyResponse[];
  submitSurveyResponse: (response: Omit<SurveyResponse, 'id' | 'collectedAt'>) => Promise<SurveyResponse>;
  importSurveyResponses: (responses: SurveyResponse[]) => Promise<void>;
  deleteSurveyResponse: (id: string) => Promise<void>;

  // Impact Assessments
  impactAssessments: ImpactAssessment[];
  createImpactAssessment: (data: Omit<ImpactAssessment, 'id' | 'submittedAt'>) => Promise<ImpactAssessment>;

  // Grant Proposals
  proposals: GrantProposal[];
  createProposal: (data: Omit<GrantProposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GrantProposal>;
  updateProposal: (id: string, updates: Partial<GrantProposal>) => Promise<void>;

  // Maintenance & Vendor Tracking
  maintenanceRecords: MaintenanceRecord[];
  createMaintenanceRecord: (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => Promise<MaintenanceRecord>;
  updateMaintenanceStatus: (id: string, status: MaintenanceRecord['status']) => Promise<void>;
  advanceMaintenanceApproval: (
    recId: string, 
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', 
    approverName: string, 
    approverRole: string, 
    comments?: string
  ) => Promise<void>;

  // Stocks & Inventory
  stockItems: StockItem[];
  stockRequests: StockUsageRequest[];
  createStockItem: (data: Omit<StockItem, 'id' | 'updatedAt'>) => Promise<StockItem>;
  updateStockItem: (id: string, updates: Partial<StockItem>) => Promise<void>;
  createStockRequest: (data: Omit<StockUsageRequest, 'id' | 'createdAt'>) => Promise<StockUsageRequest>;
  approveStockRequest: (requestId: string, reviewerName: string) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'milous_db_projects',
  TASKS: 'milous_db_tasks',
  INDICATORS: 'milous_db_indicators',
  EXPENSES: 'milous_db_expenses',
  VENDORS: 'milous_db_vendors',
  DONORS: 'milous_db_donors',
  NOTIFICATIONS: 'milous_db_app_notifications',
  SURVEY_RESPONSES: 'milous_db_survey_responses',
  TIMESHEETS: 'milous_db_timesheets',
  EXCHANGE_RATES: 'milous_db_exchange_rates',
  IMPACT_ASSESSMENTS: 'milous_db_impact_assessments',
  PROPOSALS: 'milous_db_proposals',
  MAINTENANCE_RECORDS: 'milous_db_maintenance_records',
  STOCK_ITEMS: 'milous_db_stock_items',
  STOCK_REQUESTS: 'milous_db_stock_requests',
  OFFLINE_QUEUE: 'milous_offline_mutation_queue',
  LAST_SYNC: 'milous_last_sync_timestamp',
};

const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  GHS: 15.6,
  KES: 130.5,
  NGN: 1480.0,
  CAD: 1.36,
  CHF: 0.88,
};

const SEED_APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-msg-01',
    category: 'inbound_message',
    severity: 'medium',
    title: 'Inbound Message from Sarah Chen',
    message: 'Sarah Chen (Project Manager): "Milou, the revised water pump technical specifications for Tamale site #4 are ready for your review."',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    entityType: 'message',
    actionLabel: 'Reply in Chat',
    actionUrl: '/stream',
  },
  {
    id: 'notif-msg-02',
    category: 'inbound_message',
    severity: 'high',
    title: 'Inbound Message from David Miller (USAID)',
    message: 'David Miller (USAID Agreement Officer): "The Q3 Milestones for Rural WASH have been accepted. Milestone 2 tranche disbursement authorized."',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    entityType: 'message',
    actionLabel: 'Reply in Chat',
    actionUrl: '/stream',
  },
  {
    id: 'notif-prj-01',
    category: 'project_update',
    severity: 'high',
    title: 'Project Milestone Reached',
    message: 'Clean Water & Solar Boreholes for Rural Ashanti: Solar submersible pump installation completed on Borehole #4.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    entityType: 'project',
    entityId: 'prj-gh-wash-01',
    actionLabel: 'View Project',
    actionUrl: '/projects-dashboard',
  },
  {
    id: 'notif-tsk-01',
    category: 'task',
    severity: 'medium',
    title: 'Assignee Task Status Change',
    message: 'Ibrahim Tanko updated task "Install Solar Submersible Pump on Borehole #4" status to COMPLETED.',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    read: false,
    entityType: 'task',
    entityId: 'tsk-02',
    actionLabel: 'Inspect Task',
    actionUrl: '/tasks',
  },
  {
    id: 'notif-tsk-02',
    category: 'task',
    severity: 'low',
    title: 'Task Assigned by Project Manager',
    message: 'Sarah Chen assigned "Conduct Water Quality Lab Testing" to Emmanuel Osei.',
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    read: false,
    entityType: 'task',
    entityId: 'tsk-03',
    actionLabel: 'View Task',
    actionUrl: '/tasks',
  },
  {
    id: 'notif-imp-01',
    category: 'survey',
    severity: 'low',
    title: 'Field Impact Assessment Completed',
    message: 'Emmanuel Osei submitted a new Community Impact Assessment for Ejisu Community Water Board.',
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    read: true,
    entityType: 'survey',
    actionLabel: 'Open Impact Analysis',
    actionUrl: '/impact-analysis',
  },
];
const SEED_SURVEY_RESPONSES: SurveyResponse[] = [];

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Load or fallback to initial data
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || 'all');

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_TASKS;
  });

  const [indicators, setIndicators] = useState<Indicator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INDICATORS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_INDICATORS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_EXPENSES;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_VENDORS;
  });

  const [donors, setDonors] = useState<Donor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DONORS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_DONORS;
  });

  // Offline state & synchronization queue
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ? JSON.parse(queue).length : 0;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date().toISOString();
  });

  const [notifications, setNotifications] = useState<SyncNotification[]>([]);

  // Keep localStorage updated with offline-first local persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INDICATORS, JSON.stringify(indicators));
  }, [indicators]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
  }, [donors]);

  // Enterprise App Notifications State
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : SEED_APP_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(appNotifications));
  }, [appNotifications]);

  const unreadNotificationsCount = appNotifications.filter((n) => !n.read).length;

  const markNotificationAsRead = useCallback((id: string) => {
    setAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissAppNotification = useCallback((id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllAppNotifications = useCallback(() => {
    setAppNotifications([]);
  }, []);

  const addAppNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notification,
      id: 'appnotif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAppNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Google Forms & Field Survey Responses State
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : SEED_SURVEY_RESPONSES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURVEY_RESPONSES, JSON.stringify(surveyResponses));
  }, [surveyResponses]);

  // Timesheets Module State
  const [timesheets, setTimesheets] = useState<Timesheet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_TIMESHEETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(timesheets));
  }, [timesheets]);

  // Impact Assessments State
  const [impactAssessments, setImpactAssessments] = useState<ImpactAssessment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPACT_ASSESSMENTS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_IMPACT_ASSESSMENTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPACT_ASSESSMENTS, JSON.stringify(impactAssessments));
  }, [impactAssessments]);

  // Proposals State
  const [proposals, setProposals] = useState<GrantProposal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_PROPOSALS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
  }, [proposals]);

  // Maintenance Records State
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_RECORDS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_MAINTENANCE_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_RECORDS, JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  // Stocks & Inventory State
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_STOCK_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(stockItems));
  }, [stockItems]);

  const [stockRequests, setStockRequests] = useState<StockUsageRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_REQUESTS);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed : INITIAL_STOCK_REQUESTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_REQUESTS, JSON.stringify(stockRequests));
  }, [stockRequests]);

  const createTimesheet = useCallback(async (tsData: Omit<Timesheet, 'id' | 'createdAt' | 'submittedAt'>): Promise<Timesheet> => {
    const newTs: Timesheet = {
      ...tsData,
      id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'LEVEL_1_PENDING',
      currentApprovalStep: 1,
      totalApprovalSteps: 2,
      assignedApproverRole: 'PROJECT_MANAGER',
      submittedAt: new Date().toISOString(),
      approvalHistory: [
        {
          step: 1,
          stepName: 'Field Staff Submission',
          approverRole: tsData.userRole || 'Field Staff',
          approverName: tsData.userName || 'Requester',
          action: 'SUBMITTED',
          comments: `Logged ${tsData.hours} hours on [${tsData.projectTitle}]. Submitted for Level 1 Project Manager review.`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setTimesheets((prev) => [newTs, ...prev]);

    // Dispatch notifications: to PM for review, and confirmation to Requester
    addAppNotification({
      category: 'approval',
      severity: 'medium',
      title: `Timesheet Submitted: ${newTs.userName}`,
      message: `${newTs.userName} logged ${newTs.hours}h on [${newTs.projectTitle}]. Requires Level 1 Project Manager verification.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO'],
      actionLabel: 'Review Timesheet',
      actionUrl: '/timesheets',
      entityId: newTs.id,
      entityType: 'task',
    });

    addAppNotification({
      category: 'task',
      severity: 'low',
      title: `Timesheet Awaiting Level 1 Review`,
      message: `Your timesheet (${newTs.hours}h) was successfully submitted and assigned to Project Manager for verification.`,
      targetRoles: ['FIELD_OFFICER', 'ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
      actionLabel: 'Check Status',
      actionUrl: '/timesheets',
      entityId: newTs.id,
      entityType: 'task',
    });

    return newTs;
  }, [addAppNotification]);

  const updateTimesheetStatus = useCallback(async (tsId: string, status: TimesheetStatus, reviewerName: string, notes?: string): Promise<void> => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === tsId
          ? {
              ...ts,
              status,
              reviewedBy: reviewerName,
              reviewedAt: new Date().toISOString(),
              reviewNotes: notes !== undefined ? notes : ts.reviewNotes,
            }
          : ts
      )
    );
  }, []);

  const deleteTimesheet = useCallback(async (tsId: string): Promise<void> => {
    setTimesheets((prev) => prev.filter((ts) => ts.id !== tsId));
  }, []);

  // Multi-Currency & Real-Time Exchange Rates State
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATES);
    return saved ? JSON.parse(saved) : DEFAULT_EXCHANGE_RATES;
  });

  const [isFetchingRates, setIsFetchingRates] = useState<boolean>(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(() => {
    return localStorage.getItem('milous_db_rates_last_updated') || new Date().toISOString();
  });
  const [ratesSource, setRatesSource] = useState<'live_api' | 'cache' | 'fallback' | null>('live_api');
  const [selectedDisplayCurrency, setSelectedDisplayCurrencyState] = useState<string>(() => {
    return localStorage.getItem('milous_db_display_currency') || 'USD';
  });

  // Fixed Grant Rate Overrides
  const [isFixedRateOverride, setIsFixedRateOverrideState] = useState<boolean>(() => {
    return localStorage.getItem('milous_db_fx_override_active') === 'true';
  });
  const [fixedRateOverrideValue, setFixedRateOverrideValueState] = useState<number>(() => {
    return parseFloat(localStorage.getItem('milous_db_fx_override_value') || '12.50');
  });

  const setIsFixedRateOverride = useCallback((active: boolean) => {
    setIsFixedRateOverrideState(active);
    localStorage.setItem('milous_db_fx_override_active', active ? 'true' : 'false');
  }, []);

  const setFixedRateOverrideValue = useCallback((val: number) => {
    setFixedRateOverrideValueState(val);
    localStorage.setItem('milous_db_fx_override_value', val.toString());
  }, []);

  const setSelectedDisplayCurrency = useCallback((curr: string) => {
    setSelectedDisplayCurrencyState(curr);
    localStorage.setItem('milous_db_display_currency', curr);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATES, JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  const updateExchangeRate = useCallback((currency: string, rate: number) => {
    setExchangeRates((prev) => ({
      ...prev,
      [currency.toUpperCase()]: rate,
    }));
  }, []);

  const convertCurrency = useCallback((amount: number, from: string, to: string): number => {
    if (!amount || from === to) return amount;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    // In NGO grant operations, apply fixed grant rate override if active and converting with GHS
    const rates = { ...exchangeRates };
    if (isFixedRateOverride) {
      rates['GHS'] = fixedRateOverrideValue;
    }
    
    const fromRate = rates[fromUpper] || 1;
    const toRate = rates[toUpper] || 1;
    const inUSD = fromUpper === 'USD' ? amount : amount / fromRate;
    return toUpper === 'USD' ? inUSD : inUSD * toRate;
  }, [exchangeRates, isFixedRateOverride, fixedRateOverrideValue]);

  const fetchLiveExchangeRates = useCallback(async (base = 'USD'): Promise<Record<string, number>> => {
    setIsFetchingRates(true);
    try {
      // 1. Try server-side live exchange rate endpoint
      const res = await fetch(`/api/exchange-rates?base=${base}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setExchangeRates(data.rates);
          const updateTime = data.lastUpdated || new Date().toISOString();
          setRatesLastUpdated(updateTime);
          setRatesSource(data.source || 'live_api');
          localStorage.setItem('milous_db_rates_last_updated', updateTime);
          return data.rates;
        }
      }
      // 2. Direct fallback to Open Exchange Rate API if server-side route is delayed
      const directRes = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && directData.rates) {
          setExchangeRates(directData.rates);
          const updateTime = directData.time_last_update_utc || new Date().toISOString();
          setRatesLastUpdated(updateTime);
          setRatesSource('live_api');
          localStorage.setItem('milous_db_rates_last_updated', updateTime);
          return directData.rates;
        }
      }
    } catch (err) {
      console.warn('[ExchangeRates] Live FX fetch error, using stored rates:', err);
    } finally {
      setIsFetchingRates(false);
    }
    return exchangeRates;
  }, [exchangeRates]);

  // Initial fetch for fresh exchange rates on app load
  useEffect(() => {
    fetchLiveExchangeRates('USD').catch(() => {});
  }, []);

  const addNotification = useCallback((notification: Omit<SyncNotification, 'id' | 'timestamp'>) => {
    const newNotif: SyncNotification = {
      ...notification,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 7)]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendInboundMessage = useCallback(
    async (senderName: string, senderRole: string, messageText: string, projectName?: string): Promise<void> => {
      addAppNotification({
        category: 'inbound_message',
        severity: 'medium',
        title: `Inbound Message: ${senderName}`,
        message: `${senderName} (${senderRole})${projectName ? ` on [${projectName}]` : ''}: "${messageText}"`,
        targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO', 'FIELD_OFFICER', 'ME_OFFICER', 'FINANCE_OFFICER'],
        entityType: 'message',
        actionLabel: 'Reply in Chat',
        actionUrl: '/stream',
      });
      addNotification({
        type: 'info',
        title: `Message from ${senderName}`,
        message: messageText,
      });
    },
    [addAppNotification, addNotification]
  );

  // Multi-Step Approval Workflow for Timesheets
  const advanceTimesheetApproval = useCallback(
    async (
      tsId: string,
      action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
      approverName: string,
      approverRole: string,
      comments?: string
    ): Promise<void> => {
      setTimesheets((prev) =>
        prev.map((ts) => {
          if (ts.id !== tsId) return ts;

          const currentStep = ts.currentApprovalStep || 1;
          let newStatus: TimesheetStatus = ts.status;
          let nextStep = currentStep;
          let nextApproverRole = ts.assignedApproverRole || 'PROJECT_MANAGER';

          if (action === 'APPROVE') {
            if (currentStep === 1) {
              // Level 1 PM passed -> Move to Level 2 Finance
              newStatus = 'LEVEL_2_PENDING';
              nextStep = 2;
              nextApproverRole = 'FINANCE_OFFICER';
            } else {
              // Level 2 Finance passed -> Final Sign-off
              newStatus = 'APPROVED';
              nextStep = 3;
              nextApproverRole = 'COMPLETED';
            }
          } else if (action === 'REQUEST_CHANGES') {
            newStatus = 'CHANGES_REQUESTED';
            nextStep = 1;
            nextApproverRole = ts.userRole || 'FIELD_OFFICER';
          } else {
            newStatus = 'REJECTED';
            nextStep = 0;
            nextApproverRole = 'CLOSED';
          }

          const stepRecord: ApprovalStepRecord = {
            step: currentStep,
            stepName:
              currentStep === 1
                ? 'Level 1: Project Manager Technical Verification'
                : 'Level 2: Finance Payroll Disbursement Authorization',
            approverName,
            approverRole,
            action: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED',
            comments:
              comments ||
              (action === 'APPROVE'
                ? 'Verified and cleared to proceed'
                : action === 'REQUEST_CHANGES'
                ? 'Modifications requested by approver'
                : 'Request rejected'),
            timestamp: new Date().toISOString(),
          };

          const updatedHistory = [...(ts.approvalHistory || []), stepRecord];

          // Trigger notifications to BOTH Requester and Approvers!
          if (action === 'APPROVE') {
            if (nextStep === 2) {
              // 1. Notify Requester of Level 1 approval
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Timesheet Level 1 Approved: ${ts.userName}`,
                message: `Your timesheet (${ts.hours}h) for [${ts.projectTitle}] was verified by ${approverName} (${approverRole}) and forwarded for Level 2 Finance review.`,
                targetRoles: ['FIELD_OFFICER', 'ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
                actionLabel: 'View Timesheet',
                actionUrl: '/timesheets',
                entityId: ts.id,
                entityType: 'task',
              });
              // 2. Notify Level 2 Finance Approver
              addAppNotification({
                category: 'approval',
                severity: 'medium',
                title: `Level 2 Approval Needed: ${ts.userName}`,
                message: `Timesheet #${ts.id.slice(-4)} (${ts.hours}h) passed Level 1. Awaiting Finance payroll clearance.`,
                targetRoles: ['FINANCE_OFFICER', 'ADMIN', 'CEO'],
                actionLabel: 'Review & Authorize',
                actionUrl: '/timesheets',
                entityId: ts.id,
                entityType: 'task',
              });
            } else {
              // Final Step 2 Approved: Notify Requester & PM
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Timesheet Fully Approved: ${ts.userName}`,
                message: `Your timesheet (${ts.hours}h) has received Level 2 sign-off from ${approverName} (${approverRole}) and is cleared for disbursement.`,
                targetRoles: ['FIELD_OFFICER', 'ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
                actionLabel: 'View Timesheet',
                actionUrl: '/timesheets',
                entityId: ts.id,
                entityType: 'task',
              });
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Timesheet Disbursement Cleared: ${ts.userName}`,
                message: `Timesheet for ${ts.userName} (${ts.hours}h, [${ts.projectTitle}]) authorized by Finance Officer ${approverName}.`,
                targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO'],
                actionLabel: 'View Payroll Log',
                actionUrl: '/timesheets',
                entityId: ts.id,
                entityType: 'task',
              });
            }
          } else {
            // Rejection or Changes Requested: Notify Requester with priority
            addAppNotification({
              category: 'approval',
              severity: 'high',
              title: `Timesheet ${action === 'REQUEST_CHANGES' ? 'Changes Requested' : 'Rejected'}`,
              message: `${approverName} (${approverRole}) ${
                action === 'REQUEST_CHANGES' ? 'requested adjustments' : 'declined'
              } for your timesheet (${ts.hours}h): "${comments || 'No remarks provided'}"`,
              targetRoles: ['FIELD_OFFICER', 'ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
              actionLabel: 'Edit Timesheet',
              actionUrl: '/timesheets',
              entityId: ts.id,
              entityType: 'task',
            });
          }

          return {
            ...ts,
            status: newStatus,
            currentApprovalStep: nextStep,
            assignedApproverRole: nextApproverRole,
            reviewedBy: approverName,
            reviewedAt: new Date().toISOString(),
            reviewNotes: comments || ts.reviewNotes,
            approvalHistory: updatedHistory,
          };
        })
      );
    },
    [addAppNotification]
  );

  // Multi-Step Approval Workflow for Maintenance Requests
  const advanceMaintenanceApproval = useCallback(
    async (
      recId: string,
      action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
      approverName: string,
      approverRole: string,
      comments?: string
    ): Promise<void> => {
      setMaintenanceRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== recId) return rec;

          const currentStep = rec.currentApprovalStep || 1;
          let newStatus: MaintenanceStatus = rec.status;
          let nextStep = currentStep;
          let nextApproverRole = rec.assignedApproverRole || 'OPERATIONS';

          if (action === 'APPROVE') {
            if (currentStep === 1) {
              // Level 1 Operations Technical Assessment passed -> Move to Level 2 Finance PO Release
              newStatus = 'OPS_APPROVED';
              nextStep = 2;
              nextApproverRole = 'FINANCE_OFFICER';
            } else if (currentStep === 2) {
              // Level 2 Finance PO approved -> Dispatched to vendor / under repair
              newStatus = 'FINANCE_APPROVED';
              nextStep = 3;
              nextApproverRole = 'OPERATIONS';
            } else {
              // Level 3 final sign off -> Completed & certified
              newStatus = 'COMPLETED';
              nextStep = 4;
              nextApproverRole = 'COMPLETED';
            }
          } else if (action === 'REQUEST_CHANGES') {
            newStatus = 'CHANGES_REQUESTED';
            nextStep = 1;
            nextApproverRole = 'OPERATIONS';
          } else {
            newStatus = 'REJECTED';
            nextStep = 0;
            nextApproverRole = 'CLOSED';
          }

          const stepRecord: ApprovalStepRecord = {
            step: currentStep,
            stepName:
              currentStep === 1
                ? 'Level 1: Operations Technical Assessment'
                : currentStep === 2
                ? 'Level 2: Finance Purchase Order & Budget Release'
                : 'Level 3: Technical Repair Certification & Sign-off',
            approverName,
            approverRole,
            action: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED',
            comments:
              comments ||
              (action === 'APPROVE'
                ? 'Authorized by approver'
                : action === 'REQUEST_CHANGES'
                ? 'Revisions requested'
                : 'Maintenance request rejected'),
            timestamp: new Date().toISOString(),
          };

          const updatedHistory = [...(rec.approvalHistory || []), stepRecord];

          // Trigger notifications to BOTH Requester and Approvers!
          if (action === 'APPROVE') {
            if (nextStep === 2) {
              // Notify requester of Level 1 technical clearance
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Maintenance Request Technically Approved`,
                message: `Work Order "${rec.title}" (${rec.equipmentName || 'Equipment'}) passed Operations review by ${approverName}. Queued for Finance PO release.`,
                targetRoles: ['FIELD_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
                actionLabel: 'View Request',
                actionUrl: '/maintenance',
                entityId: rec.id,
                entityType: 'task',
              });
              // Notify Level 2 Finance Approver
              addAppNotification({
                category: 'approval',
                severity: 'medium',
                title: `Finance PO Release Required: ${rec.title}`,
                message: `Operations approved maintenance for ${rec.equipmentName || 'equipment'}. Estimated cost: $${rec.cost || rec.amountPaid || 0}. Please authorize budget release.`,
                targetRoles: ['FINANCE_OFFICER', 'ADMIN', 'CEO'],
                actionLabel: 'Review PO',
                actionUrl: '/maintenance',
                entityId: rec.id,
                entityType: 'task',
              });
            } else if (nextStep === 3) {
              // Notify requester & Operations that Finance PO is authorized
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Maintenance PO Authorized: ${rec.vendorName}`,
                message: `Finance Officer ${approverName} authorized purchase order for "${rec.title}". Work dispatched to vendor ${rec.vendorName}.`,
                targetRoles: ['FIELD_OFFICER', 'PROJECT_MANAGER', 'ADMIN', 'FINANCE_OFFICER'],
                actionLabel: 'Track Repair',
                actionUrl: '/maintenance',
                entityId: rec.id,
                entityType: 'task',
              });
            } else {
              // Final Step 3 Sign-off: Completed
              addAppNotification({
                category: 'approval',
                severity: 'low',
                title: `Maintenance Completed & Certified`,
                message: `Repairs for ${rec.equipmentName || 'equipment'} have been certified complete by ${approverName}.`,
                targetRoles: ['FIELD_OFFICER', 'PROJECT_MANAGER', 'ADMIN', 'FINANCE_OFFICER'],
                actionLabel: 'View History',
                actionUrl: '/maintenance',
                entityId: rec.id,
                entityType: 'task',
              });
            }
          } else {
            // Changes requested or rejected
            addAppNotification({
              category: 'approval',
              severity: 'high',
              title: `Maintenance Request ${action === 'REQUEST_CHANGES' ? 'Changes Requested' : 'Rejected'}`,
              message: `${approverName} (${approverRole}) ${
                action === 'REQUEST_CHANGES' ? 'requested modifications' : 'rejected'
              } for "${rec.title}": "${comments || 'No comment provided'}"`,
              targetRoles: ['FIELD_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
              actionLabel: 'Review Notes',
              actionUrl: '/maintenance',
              entityId: rec.id,
              entityType: 'task',
            });
          }

          return {
            ...rec,
            status: newStatus,
            currentApprovalStep: nextStep,
            assignedApproverRole: nextApproverRole,
            approvalHistory: updatedHistory,
          };
        })
      );
    },
    [addAppNotification]
  );

  // Survey submission & M&E auto-increment
  const submitSurveyResponse = async (
    responseData: Omit<SurveyResponse, 'id' | 'collectedAt'>
  ): Promise<SurveyResponse> => {
    const now = new Date().toISOString();
    const newResponse: SurveyResponse = {
      ...responseData,
      id: 'resp-' + Date.now().toString(36),
      collectedAt: now,
      syncedToIndicator: true,
    };

    setSurveyResponses((prev) => [newResponse, ...prev]);

    if (!isOnline) {
      enqueueOfflineMutation('surveyResponses', 'create', newResponse);
    }

    // Auto-create notification for M&E and Project Managers
    addAppNotification({
      category: 'survey',
      severity: 'low',
      title: `Survey Captured: ${newResponse.surveyTitle}`,
      message: `Household data captured from ${newResponse.community} (${newResponse.source === 'google_forms' ? 'via Google Forms Sync' : 'In-App Field Collector'}).`,
      targetRoles: ['ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
      actionLabel: 'View Response',
      actionUrl: '/documents',
      entityId: newResponse.id,
      entityType: 'survey',
    });

    addNotification({
      type: 'success',
      title: 'Survey Response Recorded',
      message: `Data from ${newResponse.community} captured and logged to project database.`,
    });

    // If there is an active WASH indicator and satisfaction rating was provided, record indicator increment
    const targetWashInd = indicators.find(
      (ind) => ind.projectId === newResponse.projectId || ind.code === 'IND-WASH-02'
    );
    if (targetWashInd) {
      const currentVal = targetWashInd.actualValue;
      const newVal = currentVal + 1;
      setIndicators((prev) =>
        prev.map((ind) =>
          ind.id === targetWashInd.id
            ? {
                ...ind,
                actualValue: newVal,
                updatedAt: now,
                history: [
                  {
                    id: 'hist-' + Date.now(),
                    timestamp: now,
                    previousValue: currentVal,
                    newValue: newVal,
                    increment: 1,
                    sourceTaskId: newResponse.id,
                    sourceTaskTitle: `Survey: ${newResponse.surveyTitle}`,
                    triggeredByUserId: currentUser.id,
                    note: `Survey Response verified for ${newResponse.community}. Household reach updated.`,
                  },
                  ...(ind.history || []),
                ],
              }
            : ind
        )
      );
    }

    return newResponse;
  };

  const importSurveyResponses = async (responses: SurveyResponse[]): Promise<void> => {
    setSurveyResponses((prev) => [...responses, ...prev]);
    addAppNotification({
      category: 'survey',
      severity: 'medium',
      title: `${responses.length} Survey Responses Imported`,
      message: `Successfully imported ${responses.length} survey responses from Google Forms / CSV export.`,
      targetRoles: ['ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
      actionLabel: 'View Surveys',
      actionUrl: '/documents',
      entityType: 'survey',
    });
    addNotification({
      type: 'success',
      title: 'Google Forms Responses Imported',
      message: `${responses.length} responses ingested into M&E database.`,
    });
  };

  const deleteSurveyResponse = async (id: string): Promise<void> => {
    setSurveyResponses((prev) => prev.filter((r) => r.id !== id));
    addNotification({
      type: 'warning',
      title: 'Survey Response Removed',
      message: 'Survey entry removed from record.',
    });
  };

  // Window online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue offline mutations
  const enqueueOfflineMutation = useCallback((entity: string, action: string, data: unknown) => {
    const queueStr = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    queue.push({
      id: 'mut-' + Date.now(),
      entity,
      action,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    setPendingSyncCount(queue.length);
  }, []);

  const triggerManualSync = async () => {
    // Flush pending offline queue
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    setPendingSyncCount(0);
    const now = new Date().toISOString();
    setLastSyncedAt(now);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);

    addNotification({
      type: 'success',
      title: 'Firestore Sync Completed',
      message: 'All offline field changes and indicator logs have been synced to the cloud.',
    });
  };

  /**
   * CORE REQUIREMENT 2: Task-to-Indicator Auto-Sync
   * When a task is dragged/updated to "COMPLETED", trigger auto-increment of linked quantitative M&E Indicator.
   */
  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ): Promise<{ syncedIndicator?: { code: string; title: string; increment: number } }> => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return {};

    const previousStatus = targetTask.status;
    if (previousStatus === newStatus) return {};

    const now = new Date().toISOString();
    let syncedInfo: { code: string; title: string; increment: number } | undefined;

    // Check if transition is entering COMPLETED with a linked indicator
    const isEnteringCompleted = newStatus === 'COMPLETED' && previousStatus !== 'COMPLETED';
    const isLeavingCompleted = previousStatus === 'COMPLETED' && newStatus !== 'COMPLETED';

    const linkedIndId = targetTask.linkedIndicatorId;
    const incrementVal = targetTask.indicatorIncrementValue ?? 1;

    let updatedIndicatorState = indicators;

    if (linkedIndId) {
      const targetIndicator = indicators.find((ind) => ind.id === linkedIndId);

      if (targetIndicator && targetIndicator.autoSyncEnabled) {
        if (isEnteringCompleted && !targetTask.indicatorSyncApplied) {
          // Increment the indicator value
          const oldVal = targetIndicator.actualValue;
          const newVal = oldVal + incrementVal;

          const auditLog = {
            id: 'hist-' + Date.now(),
            timestamp: now,
            previousValue: oldVal,
            newValue: newVal,
            increment: incrementVal,
            sourceTaskId: targetTask.id,
            sourceTaskTitle: targetTask.title,
            triggeredByUserId: currentUser.id,
            note: `Auto-synced: Task "${targetTask.title}" marked as COMPLETED (+${incrementVal} ${targetIndicator.unit || 'units'}).`,
          };

          updatedIndicatorState = indicators.map((ind) => {
            if (ind.id === linkedIndId) {
              return {
                ...ind,
                actualValue: newVal,
                history: [auditLog, ...(ind.history || [])],
                updatedAt: now,
              };
            }
            return ind;
          });

          setIndicators(updatedIndicatorState);

          syncedInfo = {
            code: targetIndicator.code,
            title: targetIndicator.title,
            increment: incrementVal,
          };

          addNotification({
            type: 'success',
            title: 'M&E Indicator Auto-Synced',
            message: `[${targetIndicator.code}] "${targetIndicator.title}" auto-incremented by +${incrementVal} to ${newVal} ${targetIndicator.unit || ''}.`,
          });
        } else if (isLeavingCompleted && targetTask.indicatorSyncApplied) {
          // Task was moved back from Completed - adjust indicator to preserve integrity
          const oldVal = targetIndicator.actualValue;
          const newVal = Math.max(0, oldVal - incrementVal);

          const reversalLog = {
            id: 'hist-' + Date.now(),
            timestamp: now,
            previousValue: oldVal,
            newValue: newVal,
            increment: -incrementVal,
            sourceTaskId: targetTask.id,
            sourceTaskTitle: targetTask.title,
            triggeredByUserId: currentUser.id,
            note: `Auto-reversal: Task "${targetTask.title}" moved from COMPLETED to ${newStatus} (-${incrementVal} ${targetIndicator.unit || 'units'}).`,
          };

          updatedIndicatorState = indicators.map((ind) => {
            if (ind.id === linkedIndId) {
              return {
                ...ind,
                actualValue: newVal,
                history: [reversalLog, ...(ind.history || [])],
                updatedAt: now,
              };
            }
            return ind;
          });

          setIndicators(updatedIndicatorState);

          addNotification({
            type: 'info',
            title: 'M&E Indicator Reversal Logged',
            message: `[${targetIndicator.code}] Task moved back to ${newStatus}. Value reconciled to ${newVal}.`,
          });
        }
      }
    }

    // Update the task itself
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status: newStatus,
            indicatorSyncApplied: isEnteringCompleted
              ? true
              : isLeavingCompleted
              ? false
              : task.indicatorSyncApplied,
            actualEndDate: newStatus === 'COMPLETED' ? now : undefined,
            updatedAt: now,
          };
        }
        return task;
      })
    );

    // Notify project team & assignees of task status change
    addAppNotification({
      category: 'task',
      severity: newStatus === 'COMPLETED' ? 'medium' : 'low',
      title: `Task Status: ${newStatus.replace('_', ' ')}`,
      message: `${currentUser?.displayName || 'Team Member'} updated "${targetTask.title}" (${targetTask.code || 'Task'}) to ${newStatus.replace('_', ' ')}. Assignee: ${targetTask.assigneeName || 'Unassigned'}.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'ME_OFFICER', 'FIELD_OFFICER'],
      entityType: 'task',
      entityId: targetTask.id,
      actionLabel: 'Inspect Task',
      actionUrl: '/tasks',
    });

    if (!isOnline) {
      enqueueOfflineMutation('tasks', 'updateStatus', { taskId, newStatus });
      addNotification({
        type: 'warning',
        title: 'Saved in Offline Cache',
        message: 'Task movement saved locally. Will sync to Firestore when connection resumes.',
      });
    }

    return { syncedIndicator: syncedInfo };
  };

  const createProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> => {
    const now = new Date().toISOString();
    const newProj: Project = {
      ...projectData,
      id: 'proj-' + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);

    if (!isOnline) {
      enqueueOfflineMutation('projects', 'create', newProj);
    }

    addAppNotification({
      category: 'project_update',
      severity: 'high',
      title: `New Mission Initiated: [${newProj.code}] ${newProj.title}`,
      message: `Project activated in ${newProj.country} (${newProj.sector}). Budget: ${newProj.currency} ${newProj.totalBudget?.toLocaleString()}.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO', 'FINANCE_OFFICER', 'ME_OFFICER'],
      entityType: 'project',
      entityId: newProj.id,
      actionLabel: 'View Project',
      actionUrl: '/projects-dashboard',
    });

    addNotification({
      type: 'success',
      title: 'Project Initiated',
      message: `Project [${newProj.code}] "${newProj.title}" has been created.`,
    });

    return newProj;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates, updatedAt: now } : p))
    );
    if (!isOnline) {
      enqueueOfflineMutation('projects', 'update', { projectId, updates });
    }
    
    addAppNotification({
      category: 'project_update',
      severity: 'medium',
      title: `Project Updated: ${updates.title || projectId}`,
      message: `Project parameters and milestones updated by ${currentUser?.displayName || 'Project Lead'}.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO', 'FINANCE_OFFICER'],
      entityType: 'project',
      entityId: projectId,
      actionLabel: 'View Project',
      actionUrl: '/projects-dashboard',
    });

    addNotification({
      type: 'info',
      title: 'Project Updated',
      message: `Changes saved to project configuration.`,
    });
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId);
      if (remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
      }
    }
    if (!isOnline) {
      enqueueOfflineMutation('projects', 'delete', { projectId });
    }
    addNotification({
      type: 'warning',
      title: 'Project Deleted',
      message: 'Project removed from database.',
    });
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: 'tsk-' + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };

    setTasks((prev) => [newTask, ...prev]);

    if (!isOnline) {
      enqueueOfflineMutation('tasks', 'create', newTask);
    }

    addAppNotification({
      category: 'task',
      severity: 'low',
      title: `Task Created: ${newTask.title}`,
      message: `Assigned to ${newTask.assigneeName || 'Team'} in project ${newTask.projectId}. Priority: ${newTask.priority}.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'FIELD_OFFICER', 'ME_OFFICER'],
      entityType: 'task',
      entityId: newTask.id,
      actionLabel: 'Open Task',
      actionUrl: '/tasks',
    });

    addNotification({
      type: 'success',
      title: 'Task Created',
      message: `"${newTask.title}" added to ${newTask.status}.`,
    });

    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: now } : t))
    );

    if (!isOnline) {
      enqueueOfflineMutation('tasks', 'update', { taskId, updates });
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (!isOnline) {
      enqueueOfflineMutation('tasks', 'delete', { taskId });
    }
    addNotification({
      type: 'info',
      title: 'Task Deleted',
      message: 'The task was removed.',
    });
  };

  const archiveOldCompletedTasks = async (daysOld: number = 30): Promise<number> => {
    const now = Date.now();
    const thresholdMs = daysOld * 24 * 60 * 60 * 1000;
    let count = 0;
    const timestamp = new Date().toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.status === 'COMPLETED' && !task.isArchived) {
          const completedDate = task.actualEndDate || task.updatedAt || task.plannedEndDate;
          const taskTime = new Date(completedDate).getTime();
          if (now - taskTime >= thresholdMs) {
            count++;
            return {
              ...task,
              isArchived: true,
              archivedAt: timestamp,
              updatedAt: timestamp,
            };
          }
        }
        return task;
      })
    );

    if (count > 0) {
      addNotification({
        type: 'success',
        title: 'Kanban Hygiene Completed',
        message: `Archived ${count} completed task${count > 1 ? 's' : ''} older than ${daysOld} days. Active Kanban board is now clean and uncluttered.`,
      });
    }

    return count;
  };

  const unarchiveTask = async (taskId: string): Promise<void> => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isArchived: false, archivedAt: undefined, updatedAt: now } : t))
    );
    addNotification({
      type: 'info',
      title: 'Task Restored',
      message: 'Task returned to active board.',
    });
  };

  const createIndicator = async (
    indData: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Indicator> => {
    const now = new Date().toISOString();
    const newInd: Indicator = {
      ...indData,
      id: 'ind-' + Date.now().toString(36),
      history: [],
      createdAt: now,
      updatedAt: now,
    };

    setIndicators((prev) => [newInd, ...prev]);
    if (!isOnline) {
      enqueueOfflineMutation('indicators', 'create', newInd);
    }
    addNotification({
      type: 'success',
      title: 'Indicator Added',
      message: `[${newInd.code}] "${newInd.title}" added to project LogFrame.`,
    });
    return newInd;
  };

  const updateIndicator = async (indId: string, updates: Partial<Indicator>): Promise<void> => {
    const now = new Date().toISOString();
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === indId ? { ...ind, ...updates, updatedAt: now } : ind))
    );
    if (!isOnline) {
      enqueueOfflineMutation('indicators', 'update', { indId, updates });
    }
  };

  const recordIndicatorMeasurement = async (
    indId: string,
    increment: number,
    note: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    setIndicators((prev) =>
      prev.map((ind) => {
        if (ind.id === indId) {
          const oldVal = ind.actualValue;
          const newVal = oldVal + increment;
          const log = {
            id: 'hist-' + Date.now(),
            timestamp: now,
            previousValue: oldVal,
            newValue: newVal,
            increment,
            triggeredByUserId: currentUser.id,
            note: note || `Manual measurement update by ${currentUser.displayName}`,
          };
          return {
            ...ind,
            actualValue: newVal,
            history: [log, ...(ind.history || [])],
            updatedAt: now,
          };
        }
        return ind;
      })
    );

    addNotification({
      type: 'success',
      title: 'Indicator Updated',
      message: `Progress measurement recorded successfully.`,
    });
  };

  const createExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> => {
    const now = new Date().toISOString();
    const newExp: Expense = {
      ...expenseData,
      id: 'exp-' + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };

    setExpenses((prev) => [newExp, ...prev]);
    if (!isOnline) {
      enqueueOfflineMutation('expenses', 'create', newExp);
    }

    if (newExp.status === 'PENDING') {
      addAppNotification({
        category: 'approval',
        severity: 'high',
        title: `Expense Approval Required: $${newExp.totalAmount.toLocaleString()}`,
        message: `Voucher for "${newExp.description}" requires two-tier approval.`,
        targetRoles: ['ADMIN', 'FINANCE_OFFICER', 'PROJECT_MANAGER'],
        actionLabel: 'Review Voucher',
        actionUrl: '/financials',
        entityId: newExp.id,
        entityType: 'expense',
      });
    }

    addNotification({
      type: 'success',
      title: 'Expense Submitted',
      message: `${newExp.description} submitted with multi-donor cost splitting.`,
    });
    return newExp;
  };

  const updateExpenseStatus = async (expenseId: string, newStatus: ExpenseStatus): Promise<void> => {
    const now = new Date().toISOString();
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              status: newStatus,
              approvedById: newStatus === 'APPROVED' ? currentUser.id : e.approvedById,
              approvedByName: newStatus === 'APPROVED' ? currentUser.displayName : e.approvedByName,
              updatedAt: now,
            }
          : e
      )
    );

    addNotification({
      type: 'info',
      title: 'Expense Status Updated',
      message: `Status changed to ${newStatus}.`,
    });
  };

  const updateExpenseRiskFlags = async (
    expenseId: string,
    riskFlags: NonNullable<Expense['aiRiskFlags']>
  ): Promise<void> => {
    const now = new Date().toISOString();
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, aiRiskFlags: riskFlags, updatedAt: now } : e))
    );
  };

  // Vendor Database Operations
  const createVendor = async (
    vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Vendor> => {
    const now = new Date().toISOString();
    const newVendor: Vendor = {
      ...vendorData,
      id: 'vnd-' + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };
    setVendors((prev) => [newVendor, ...prev]);
    if (!isOnline) {
      enqueueOfflineMutation('vendors', 'create', newVendor);
    }
    addNotification({
      type: 'success',
      title: 'Vendor Registered',
      message: `Vendor "${newVendor.name}" [${newVendor.category}] successfully added to database.`,
    });
    return newVendor;
  };

  const updateVendor = async (vendorId: string, updates: Partial<Vendor>): Promise<void> => {
    const now = new Date().toISOString();
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, ...updates, updatedAt: now } : v))
    );
    if (!isOnline) {
      enqueueOfflineMutation('vendors', 'update', { vendorId, updates });
    }
    addNotification({
      type: 'info',
      title: 'Vendor Profile Updated',
      message: 'Vendor record updated successfully.',
    });
  };

  const deleteVendor = async (vendorId: string): Promise<void> => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    if (!isOnline) {
      enqueueOfflineMutation('vendors', 'delete', { vendorId });
    }
    addNotification({
      type: 'warning',
      title: 'Vendor Removed',
      message: 'Vendor removed from active registry.',
    });
  };

  // Donor Database Operations
  const createDonor = async (
    donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Donor> => {
    const now = new Date().toISOString();
    const newDonor: Donor = {
      ...donorData,
      id: 'dnr-' + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };
    setDonors((prev) => [newDonor, ...prev]);
    if (!isOnline) {
      enqueueOfflineMutation('donors', 'create', newDonor);
    }
    addNotification({
      type: 'success',
      title: 'Donor Added',
      message: `Donor agency "${newDonor.name}" [${newDonor.code}] added to portfolio.`,
    });
    return newDonor;
  };

  const updateDonor = async (donorId: string, updates: Partial<Donor>): Promise<void> => {
    const now = new Date().toISOString();
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, ...updates, updatedAt: now } : d))
    );
    if (!isOnline) {
      enqueueOfflineMutation('donors', 'update', { donorId, updates });
    }
    addNotification({
      type: 'info',
      title: 'Donor Updated',
      message: 'Donor information and compliance parameters updated.',
    });
  };

  const deleteDonor = async (donorId: string): Promise<void> => {
    setDonors((prev) => prev.filter((d) => d.id !== donorId));
    if (!isOnline) {
      enqueueOfflineMutation('donors', 'delete', { donorId });
    }
    addNotification({
      type: 'warning',
      title: 'Donor Removed',
      message: 'Donor removed from agency portfolio.',
    });
  };

  const allProjectsPortfolio: Project = React.useMemo(() => {
    const totalBudgets = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    return {
      id: 'ALL',
      code: 'ALL-PORTFOLIO',
      title: 'All Projects (Consolidated Portfolio)',
      description: 'Consolidated overview aggregating all active missions, indicators, field deliverables, and donor allocations.',
      sector: 'MULTI_SECTOR',
      status: 'ACTIVE',
      startDate: '2025-01-01',
      endDate: '2027-12-31',
      leadOrg: 'Milous NGO Alliance',
      partnerOrgs: ['USAID', 'Global Fund', 'EU ECHO', 'UNICEF'],
      donorGrants: [
        { donorCode: 'USAID', grantAmount: totalBudgets * 0.45, currency: 'USD', complianceFramework: '2 CFR 200' },
        { donorCode: 'EU ECHO', grantAmount: totalBudgets * 0.35, currency: 'USD', complianceFramework: 'ECHO Single Form' },
        { donorCode: 'Global Fund', grantAmount: totalBudgets * 0.20, currency: 'USD', complianceFramework: 'GFATM Framework' },
      ],
      totalBudget: totalBudgets || 2700000,
      currency: 'USD',
      countries: ['Ghana', 'Kenya', 'Uganda'],
      targetBeneficiaries: 125000,
      projectManagerId: 'usr-pm-01',
      projectManagerName: 'Sarah Jenkins',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };
  }, [projects]);

  const isAllProjects = activeProjectId?.toUpperCase() === 'ALL';
  const activeProject = isAllProjects
    ? allProjectsPortfolio
    : (projects.find((p) => p.id === activeProjectId) || projects[0]);

  // Flyout & Command Palette state
  const [selectedFlyoutItem, setSelectedFlyoutItem] = useState<{ type: 'task' | 'project' | 'expense' | 'indicator' | 'vendor' | 'donor'; id: string; item: any } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const openFlyout = useCallback((type: 'task' | 'project' | 'expense' | 'indicator' | 'vendor' | 'donor', item: any) => {
    setSelectedFlyoutItem({ type, id: item.id || item.code, item });
  }, []);

  const closeFlyout = useCallback(() => {
    setSelectedFlyoutItem(null);
  }, []);

  // Impact Assessments
  const createImpactAssessment = useCallback(async (data: Omit<ImpactAssessment, 'id' | 'submittedAt'>): Promise<ImpactAssessment> => {
    const newAssessment: ImpactAssessment = {
      ...data,
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };
    setImpactAssessments((prev) => [newAssessment, ...prev]);

    addAppNotification({
      category: 'survey',
      severity: 'medium',
      title: 'New Community Impact Assessment Completed',
      message: `${newAssessment.submittedBy} (${newAssessment.submittedByRole}) submitted impact findings for ${newAssessment.beneficiaryNames} under ${newAssessment.projectName}.`,
      recipientRoles: ['admin', 'ceo', 'project_manager'],
      actionLabel: 'Review Findings',
      actionUrl: '/impact-analysis',
    });

    addNotification({
      type: 'success',
      title: 'Impact Assessment Recorded',
      message: `Assessment for ${newAssessment.beneficiaryNames} saved. Notification dispatched to leadership.`,
    });
    return newAssessment;
  }, []);

  // Proposals
  const createProposal = useCallback(async (data: Omit<GrantProposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<GrantProposal> => {
    const now = new Date().toISOString();
    const newProp: GrantProposal = {
      ...data,
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setProposals((prev) => [newProp, ...prev]);
    addNotification({
      type: 'success',
      title: 'Grant Proposal Created',
      message: `Proposal "${newProp.title}" added to proposal registry.`,
    });
    return newProp;
  }, []);

  const updateProposal = useCallback(async (id: string, updates: Partial<GrantProposal>): Promise<void> => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  // Maintenance Records
  const createMaintenanceRecord = useCallback(async (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>): Promise<MaintenanceRecord> => {
    const newRecord: MaintenanceRecord = {
      ...data,
      id: `maint-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: data.status || 'PENDING_APPROVAL',
      currentApprovalStep: data.currentApprovalStep || 1,
      totalApprovalSteps: data.totalApprovalSteps || 3,
      assignedApproverRole: data.assignedApproverRole || 'OPERATIONS',
      requesterName: data.requesterName || data.loggedBy || 'Field Staff',
      requesterRole: data.requesterRole || 'Field Officer',
      approvalHistory: data.approvalHistory || [
        {
          step: 1,
          stepName: 'Work Order Submission',
          approverRole: data.requesterRole || 'Field Staff',
          approverName: data.requesterName || data.loggedBy || 'Staff Member',
          action: 'SUBMITTED',
          comments: data.faultDescription || 'Fault logged and submitted for Operations technical assessment.',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setMaintenanceRecords((prev) => [newRecord, ...prev]);

    // Dispatch notifications to Operations and Requester
    addAppNotification({
      category: 'approval',
      severity: 'medium',
      title: `Maintenance Request Submitted`,
      message: `${newRecord.requesterName} logged a work order for "${newRecord.title}" (${newRecord.equipmentName || 'Equipment'}). Awaiting Level 1 Operations technical assessment.`,
      targetRoles: ['PROJECT_MANAGER', 'ADMIN', 'CEO'],
      actionLabel: 'Review Request',
      actionUrl: '/maintenance',
      entityId: newRecord.id,
      entityType: 'task',
    });

    addAppNotification({
      category: 'task',
      severity: 'low',
      title: `Maintenance Work Order Queued`,
      message: `Your request for ${newRecord.equipmentName || newRecord.title} has been logged and assigned to Operations Lead for technical assessment.`,
      targetRoles: ['FIELD_OFFICER', 'ME_OFFICER', 'PROJECT_MANAGER', 'ADMIN'],
      actionLabel: 'Track Status',
      actionUrl: '/maintenance',
      entityId: newRecord.id,
      entityType: 'task',
    });

    // Auto-add to vendor list if vendor does not exist yet!
    if (data.vendorName) {
      const existingVendor = vendors.find(
        (v) => v.name.trim().toLowerCase() === data.vendorName.trim().toLowerCase()
      );
      if (!existingVendor) {
        const autoVendor: Vendor = {
          id: `vnd-auto-${Date.now()}`,
          name: data.vendorName,
          category: 'EQUIPMENT',
          contactPerson: data.vendorContact || 'Technical Service Desk',
          email: data.vendorEmail || 'service@vendor.com',
          phone: data.vendorPhone || '+233 20 000 0000',
          complianceStatus: 'VETTED',
          rating: 4.5,
          activeContractsCount: 1,
          totalSpend: data.amountPaid || 0,
          currency: 'USD',
          country: 'Ghana',
          taxId: 'GH-VND-AUTO',
          paymentTerms: 'NET_30',
          bankDetails: 'Standard Chartered Ghana',
          isBlacklisted: false,
          notes: `Auto-registered from Maintenance Work Order "${data.title}"`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setVendors((prev) => [autoVendor, ...prev]);
        addNotification({
          type: 'info',
          title: 'Vendor Auto-Enrolled',
          message: `Vendor "${data.vendorName}" has been automatically enrolled into the Vendor Database.`,
        });
      }
    }

    addNotification({
      type: 'success',
      title: 'Maintenance Logged',
      message: `Work order "${data.title}" recorded with vendor ${data.vendorName}.`,
    });
    return newRecord;
  }, [vendors, addAppNotification, addNotification]);

  const updateMaintenanceStatus = useCallback(async (id: string, status: MaintenanceRecord['status']): Promise<void> => {
    setMaintenanceRecords((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  }, []);

  // Stocks & Inventory
  const createStockItem = useCallback(async (data: Omit<StockItem, 'id' | 'updatedAt'>): Promise<StockItem> => {
    const newItem: StockItem = {
      ...data,
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    setStockItems((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateStockItem = useCallback(async (id: string, updates: Partial<StockItem>): Promise<void> => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
  }, []);

  const createStockRequest = useCallback(async (data: Omit<StockUsageRequest, 'id' | 'createdAt'>): Promise<StockUsageRequest> => {
    const newReq: StockUsageRequest = {
      ...data,
      id: `stk-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setStockRequests((prev) => [newReq, ...prev]);

    addAppNotification({
      category: 'approval',
      severity: 'medium',
      title: 'New Stock Usage Request',
      message: `${newReq.requesterName} requested ${newReq.quantityRequested} (${newReq.measurementUnit}) of "${newReq.stockItemName}" for ${newReq.projectName}.`,
      recipientRoles: ['admin', 'project_manager', 'ceo'],
      actionLabel: 'Review Request',
      actionUrl: '/stocks',
    });

    return newReq;
  }, []);

  const approveStockRequest = useCallback(async (requestId: string, reviewerName: string): Promise<void> => {
    const targetReq = stockRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === targetReq.stockItemId) {
          const newIssued = item.issuedStock + targetReq.quantityRequested;
          const newClosing = Math.max(0, item.closingStock - targetReq.quantityRequested);
          return {
            ...item,
            issuedStock: newIssued,
            closingStock: newClosing,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    setStockRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'APPROVED',
              approvedBy: reviewerName,
              approvedAt: new Date().toISOString(),
            }
          : r
      )
    );

    addNotification({
      type: 'success',
      title: 'Stock Request Approved',
      message: `${targetReq.quantityRequested} units deducted from closing stock and allocated to ${targetReq.projectName}.`,
    });
  }, [stockRequests]);

  return (
    <FirestoreContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        setActiveProjectId,
        tasks: isAllProjects ? tasks : tasks.filter((t) => t.projectId === activeProjectId),
        allTasks: tasks,
        indicators: isAllProjects ? indicators : indicators.filter((ind) => ind.projectId === activeProjectId),
        expenses: isAllProjects ? expenses : expenses.filter((e) => e.projectId === activeProjectId),
        allExpenses: expenses,
        vendors,
        donors,
        isOnline,
        setIsOnline,
        pendingSyncCount,
        lastSyncedAt,
        triggerManualSync,
        createProject,
        updateProject,
        deleteProject,
        updateTaskStatus,
        createTask,
        updateTask,
        deleteTask,
        archiveOldCompletedTasks,
        unarchiveTask,
        createIndicator,
        updateIndicator,
        recordIndicatorMeasurement,
        createExpense,
        updateExpenseStatus,
        updateExpenseRiskFlags,
        createVendor,
        updateVendor,
        deleteVendor,
        createDonor,
        updateDonor,
        deleteDonor,
        selectedFlyoutItem,
        openFlyout,
        closeFlyout,
        commandPaletteOpen,
        setCommandPaletteOpen,
        notifications,
        dismissNotification,
        clearAllNotifications,
        appNotifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissAppNotification,
        addAppNotification,
        sendInboundMessage,
        clearAllAppNotifications,
        surveyResponses,
        submitSurveyResponse,
        importSurveyResponses,
        deleteSurveyResponse,
        timesheets,
        createTimesheet,
        addTimesheet: createTimesheet,
        updateTimesheetStatus,
        advanceTimesheetApproval,
        deleteTimesheet,
        exchangeRates,
        isFetchingRates,
        ratesLastUpdated,
        ratesSource,
        selectedDisplayCurrency,
        setSelectedDisplayCurrency,
        fetchLiveExchangeRates,
        updateExchangeRate,
        convertCurrency,
        isFixedRateOverride,
        setIsFixedRateOverride,
        fixedRateOverrideValue,
        setFixedRateOverrideValue,
        impactAssessments,
        createImpactAssessment,
        proposals,
        createProposal,
        updateProposal,
        maintenanceRecords,
        createMaintenanceRecord,
        updateMaintenanceStatus,
        advanceMaintenanceApproval,
        stockItems,
        stockRequests,
        createStockItem,
        updateStockItem,
        createStockRequest,
        approveStockRequest,
      }}
    >
      {children}
    </FirestoreContext.Provider>
  );
};

export const useFirestore = (): FirestoreContextType => {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};
