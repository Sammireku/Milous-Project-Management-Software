/**
 * Milous Project - Enterprise-Grade NGO Project Management Web Application
 * Strict TypeScript Schema & Firestore Data Model Definitions
 * 
 * Collections:
 * 1. Users (/users/{userId}) - RBAC & Google Workspace SSO
 * 2. Projects (/projects/{projectId}) - Multi-donor initiatives & grant allocations
 * 3. Tasks (/tasks/{taskId}) - Kanban lifecycle & M&E auto-sync upon 'COMPLETED'
 * 4. Indicators (/indicators/{indicatorId}) - LogFrame quantitative/qualitative metrics
 * 5. Expenses (/expenses/{expenseId}) - Multi-Donor Fractional Cost Splitting & AI Risk Flags
 */

// ==========================================
// 1. Users Collection (/users/{userId})
// ==========================================
export type UserRole = 
  | 'ADMIN'
  | 'CEO'
  | 'PROJECT_MANAGER'
  | 'ME_OFFICER'
  | 'FINANCE_OFFICER'
  | 'FIELD_OFFICER'
  | 'DONOR_AUDITOR';

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organization: string;
  assignedProjectIds: string[];
  department?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string; // ISO 8601 string for reliable serialization
  updatedAt: string;
}

export type User = UserProfile;

// ==========================================
// 2. Projects Collection (/projects/{projectId})
// ==========================================
export type ProjectSector = 
  | 'WASH'
  | 'HEALTH'
  | 'FOOD_SECURITY'
  | 'EDUCATION'
  | 'PROTECTION'
  | 'EMERGENCY_RELIEF'
  | 'ECONOMIC_DEVELOPMENT'
  | string;

export type ProjectStatus = 
  | 'PLANNING'
  | 'ACTIVE'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CLOSED';

export type ProjectFundingStatus = 
  | 'ALREADY_FUNDED'
  | 'SINGLE_FUNDED'
  | 'MULTI_FUNDED'
  | 'PENDING_FUNDING'
  | 'NOT_FUNDED';

export interface ProjectFundingPhase {
  id: string;
  phaseNumber: number;
  title: string; // e.g., "Phase 1: Inception & Community Baseline"
  deliverable: string; // Key deliverable needed for release
  targetAmount: number;
  currency: string;
  dueDate: string;
  status: 'PENDING_DELIVERABLE' | 'DELIVERABLE_SUBMITTED' | 'APPROVED' | 'FUNDS_DISBURSED';
  disbursedAmount?: number;
  disbursementDate?: string;
  notes?: string;
}

export interface ProjectDonorGrant {
  donorCode: string; // e.g. "USAID", "EU", "UNICEF", "FCDO"
  grantCode: string; // e.g. "USAID-AID-641-A-17-00001"
  totalAllocation: number;
  currency: string;
  reportingCycle: 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUAL';
}

export interface Project {
  id: string;
  code: string; // e.g., "GH-WASH-2025"
  title: string;
  description: string;
  country: string;
  location: string;
  sector: ProjectSector;
  status: ProjectStatus;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  donors: ProjectDonorGrant[];
  totalBudget: number;
  currency?: string; // e.g. "USD", "EUR", "GBP", "GHS", "KES"
  leadManagerId: string;
  leadManagerName: string;
  teamMemberIds: string[];
  fundingStatus?: ProjectFundingStatus;
  fundingPhases?: ProjectFundingPhase[];
  customExchangeRate?: number; // Custom exchange rate relative to USD
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Timesheets Collection (/timesheets/{id})
// ==========================================
export type TimesheetStatus = 
  | 'PENDING_APPROVAL' 
  | 'PENDING' 
  | 'LEVEL_1_PENDING' 
  | 'LEVEL_1_APPROVED' 
  | 'LEVEL_2_PENDING' 
  | 'APPROVED' 
  | 'CHANGES_REQUESTED' 
  | 'REJECTED';

export interface ApprovalStepRecord {
  step: number;
  stepName: string;
  approverRole: string;
  approverName: string;
  approverId?: string;
  action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'SUBMITTED';
  comments?: string;
  timestamp: string;
}

export interface Timesheet {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail?: string;
  projectId: string;
  projectTitle: string;
  taskId?: string;
  taskTitle?: string;
  date: string; // YYYY-MM-DD
  hours: number;
  activityCategory: 'M&E Field Survey' | 'Community Validation' | 'Data Entry' | 'Logistics & Travel' | 'Report Writing' | 'General Operations' | string;
  description: string;
  status: TimesheetStatus;
  submittedAt: string;
  currentApprovalStep?: number; // 1 = Level 1 PM Review, 2 = Level 2 Finance Review, 3 = Completed
  totalApprovalSteps?: number; // default 2
  assignedApproverRole?: string; // 'PROJECT_MANAGER' | 'FINANCE_OFFICER'
  reviewedBy?: string;
  approvedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approverComments?: string;
  approvalHistory?: ApprovalStepRecord[];
  createdAt: string;
}

export type TimesheetEntry = Timesheet;

// ==========================================
// 3. Tasks Collection (/tasks/{taskId})
// ==========================================
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'VERIFICATION' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskFieldData {
  gpsCoordinates?: { lat: number; lng: number };
  digitalSignatureUri?: string;
  photoUris?: string[]; // Google Cloud Storage links
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assigneeName?: string;
}

export interface TaskTimeLog {
  id: string;
  userId: string;
  userName: string;
  hours: number;
  note: string;
  date: string;
}

export interface TaskProofMarkup {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  date: string;
}

export interface TaskProofAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  version: number;
  markups?: TaskProofMarkup[];
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string; // Maps to Users.id
  assigneeName?: string;
  assigneePhotoURL?: string;
  priority?: TaskPriority;
  order?: number; // Sorting index for Kanban columns
  linkedIndicatorId?: string; // Drives the M&E auto-sync upon 'COMPLETED'
  plannedStartDate?: string; // ISO string
  plannedEndDate?: string; // ISO string
  actualEndDate?: string;
  dependencies?: string[]; // Array of Task IDs this task depends on
  blockedBy?: string[]; // Linked tasks that block execution until completed
  isArchived?: boolean; // QoL archive status for tasks older than 30 days
  archivedAt?: string;
  fieldData?: TaskFieldData;
  indicatorIncrementValue?: number; // default +1
  indicatorSyncApplied?: boolean; // Idempotency flag preventing duplicate triggers
  
  // Milous Project Enterprise Work Management Extensions
  assigneeRole?: string;
  dueDate?: string;
  tags?: string[];
  customItemType?: 'Task' | 'Campaign' | 'Support Ticket' | 'Field Inspection' | 'Audit' | 'Requisition';
  customFields?: Record<string, string | number | boolean>;
  notificationChannels?: ('EMAIL' | 'SMS' | 'WHATSAPP')[];
  notifyPhone?: string;
  notifyEmail?: string;
  subtasks?: TaskSubtask[];
  timeLogs?: TaskTimeLog[];
  proofAttachments?: TaskProofAttachment[];
  comments?: TaskComment[];

  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. Indicators Collection (/indicators/{indicatorId})
// ==========================================
export type IndicatorType = 'QUANTITATIVE' | 'QUALITATIVE';

export interface DisaggregationData {
  category: string; // e.g., "Gender", "Age Group", "Location"
  value: string; // e.g., "Female", "18-24", "Northern Region"
  count: number;
}

export interface IndicatorAuditEntry {
  id: string;
  timestamp: string;
  previousValue: number;
  newValue: number;
  increment: number;
  sourceTaskId?: string;
  sourceTaskTitle?: string;
  triggeredByUserId?: string;
  note?: string;
}

export interface Indicator {
  id: string;
  projectId: string;
  code: string; // e.g., "IND-01.1"
  title: string; // e.g., "Number of community members trained"
  description?: string;
  type: IndicatorType;
  unit?: string; // e.g., "Beneficiaries", "Boreholes", "Clinics"
  baseline?: number;
  target: number;
  actualValue?: number;
  currentValue?: number;
  frequency?: string;
  disaggregations?: DisaggregationData[];
  autoSyncEnabled?: boolean; // If true, listens for Task completions
  history?: IndicatorAuditEntry[]; // Audit trail of task-triggered updates
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. Expenses Collection (/expenses/{expenseId})
// ==========================================
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUDITED';

export interface DonorAllocation {
  donorCode: string; // e.g., "USAID", "EU"
  percentage: number; // e.g., 60.0, 40.0 (Must sum to 100)
  allocatedAmount?: number;
  amount?: number;
  budgetLineCode?: string;
}

export interface ExpenseAiRiskFlags {
  riskScore: number; // 1-5 (1: Minimal, 5: Critical)
  category: string; // e.g., "Compliance Violation", "Over-budget", "Invoice Discrepancy"
  evidence: string;
}

export interface Expense {
  id: string;
  projectId: string;
  taskId?: string; // Optional link to a specific field activity
  submittedById?: string; // Field Officer ID
  submittedByName?: string;
  submittedBy?: string;
  approvedById?: string; // Finance Officer ID
  approvedByName?: string;
  approvedBy?: string;
  status: ExpenseStatus;
  totalAmount?: number;
  amount?: number;
  currency: string; // e.g., "GHS", "USD", "EUR"
  usdEquivalent?: number; // Normalized for BVA reporting
  dateIncurred?: string; // ISO date string
  date?: string;
  description: string;
  vendor?: string;
  category?: 'PROCUREMENT' | 'PERSONNEL' | 'LOGISTICS' | 'FIELD_OPS' | 'EQUIPMENT' | 'INDIRECT' | string;
  donorAllocations: DonorAllocation[]; // Multi-Donor Fractional Cost Splitting
  receiptUris?: string[]; // Google Cloud Storage links for proof
  aiRiskFlags?: ExpenseAiRiskFlags; // Populated by Vertex AI Gemini processing
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. Multimodal Document Extraction Payload
// (Used by Cloud Function & Vertex AI Gemini 2.5)
// ==========================================
export interface VertexRiskExtractionResponse {
  risk_title: string;
  category: 'financial' | 'operational' | 'security' | 'compliance' | 'environmental' | 'political';
  severity_score: number; // 1-5
  evidence: string;
  suggested_mitigation?: string;
  flagged_anomalies?: string[];
}

// ==========================================
// 7. Project Risks Collection (/project_risks/{riskId})
// ==========================================
export type RiskCategory = 'Financial' | 'Operational' | 'Community' | 'Supply Chain' | 'Weather';

export interface ExtractedRiskItem {
  title: string;
  category: RiskCategory;
  severity_score: number; // 1-5
  evidence: string;
}

export interface ProjectRiskReport {
  id: string;
  projectId: string;
  sourceFileUri: string;
  fileName: string;
  bucketName: string;
  contentType: string;
  extractedRisks: ExtractedRiskItem[];
  totalRisks: number;
  highestSeverity: number;
  status: 'COMPLETED' | 'VALIDATION_FAILED' | 'PROCESSING_FAILED';
  modelUsed?: string;
  timestamp?: any;
  createdAt: string;
  error?: string;
}

// ==========================================
// 8. Audit Logs Collection (/audit_logs/{logId})
// ==========================================
export type AuditActionType =
  | 'TASK_STATUS_CHANGED'
  | 'EXPENSE_ALLOCATION_UPDATED'
  | 'PROJECT_UPDATED'
  | 'INDICATOR_UPDATED'
  | 'EXPENSE_CREATED';

export interface AuditLog {
  id: string;
  projectId?: string;
  projectName?: string;
  actionType: AuditActionType;
  entityType: 'Task' | 'Expense' | 'Project' | 'Indicator';
  entityId: string;
  entityTitle: string;
  modifiedByUserId: string;
  modifiedByUserName: string;
  modifiedByUserRole?: string;
  previousValue?: string | number | object;
  newValue?: string | number | object;
  changeSummary: string;
  timestamp: string;
}

// ==========================================
// 9. Trigger Email Extension Collection (/mail/{mailId})
// ==========================================
export interface MailNotification {
  id?: string;
  to: string[];
  message: {
    subject: string;
    text: string;
    html: string;
  };
  metadata?: {
    taskId?: string;
    projectId?: string;
    changedBy?: string;
    timestamp?: string;
  };
  createdAt?: string;
}

// ==========================================
// 10. Vendors Collection (/vendors/{vendorId})
// ==========================================
export type VendorCategory = 
  | 'SUPPLIES'
  | 'LOGISTICS'
  | 'CONSTRUCTION'
  | 'CONSULTING'
  | 'EQUIPMENT'
  | 'WASH_ENGINEERING'
  | 'MEDICAL'
  | 'OTHER';

export type VendorComplianceStatus = 'VETTED' | 'PENDING' | 'FLAGGED';

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxId: string; // TIN / VAT registration number
  category: VendorCategory | string;
  complianceStatus?: VendorComplianceStatus;
  status?: string;
  country?: string;
  location?: string;
  address?: string;
  bankDetails?: string;
  rating: number; // 1-5 rating
  notes?: string;
  linkedExpenseCount?: number;
  activeContractsCount?: number;
  totalPaidAmount?: number;
  totalSpend?: number;
  paymentTerms?: string;
  isBlacklisted?: boolean;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 11. Donors Collection (/donors/{donorId})
// ==========================================
export type DonorType = 
  | 'BILATERAL'
  | 'MULTILATERAL'
  | 'FOUNDATION'
  | 'UN_AGENCY'
  | 'GOVERNMENT'
  | 'OTHER';

export interface Donor {
  id: string;
  name: string;
  code: string; // e.g. "USAID", "ECHO", "UNICEF", "FCDO", "GIZ"
  type: DonorType;
  contactOfficerName?: string;
  contactEmail?: string;
  contactPerson?: string;
  email?: string;
  contactPhone?: string;
  phone?: string;
  complianceFramework?: string; // e.g. "2 CFR 200 Uniform Guidance", "EU ECHO Single Form"
  complianceRules?: string | string[];
  defaultCurrency?: string; // "USD", "EUR", "GBP", "CHF"
  currency?: string;
  totalCommittedFunds?: number;
  totalFundingProvided?: number;
  activeGrantCount?: number;
  activeGrantsCount?: number;
  status?: string;
  auditFrequency?: 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUAL' | 'ANNUAL';
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 12. App Notification System
// ==========================================
export type NotificationCategory = 'approval' | 'donor_deadline' | 'project_update' | 'survey' | 'system' | 'compliance' | 'task' | 'inbound_message';
export type NotificationSeverity = 'high' | 'medium' | 'low';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRoles?: UserRole[];
  recipientRoles?: string[];
  relatedEntityId?: string;
  actionLabel?: string;
  actionUrl?: string;
  entityId?: string;
  entityType?: 'expense' | 'project' | 'task' | 'document' | 'survey' | 'indicator' | 'message';
}

// ==========================================
// 13. Survey & Google Forms Integration
// ==========================================
export type SurveyType = 'baseline' | 'endline' | 'monitoring' | 'rapid_assessment';

export interface SurveyQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'likert' | 'textarea';
  options?: string[];
  required?: boolean;
  linkedIndicatorCode?: string;
  helpText?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  surveyType: SurveyType;
  projectId: string;
  projectCode: string;
  respondentId: string;
  community: string;
  collectedBy: string;
  collectedAt: string;
  source: 'in_app' | 'google_forms' | 'kobotoolbox';
  answers: Record<string, any>; // questionId -> answer
  satisfactionScore?: number;
  notes?: string;
  syncedToIndicator?: boolean;
}

// ==========================================
// 14. Impact Analysis & Beneficiary Assessments
// ==========================================
export interface ImpactAssessment {
  id: string;
  beneficiaryNames: string;
  projectId: string;
  projectName: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CONCERN';
  sentimentScore: number; // 1 to 5
  progressNarrative: string;
  constraints: string;
  improvements: string;
  observations: string;
  audioRecorded?: boolean;
  audioTranscript?: string;
  imageUploaded?: boolean;
  imageOcrText?: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'ACTIONED';
}

// ==========================================
// 15. Proposal Database & AI Compliance
// ==========================================
export interface ProposalStage {
  stageName: string;
  percentage: number;
  amount: number;
  status: 'PENDING' | 'DISBURSED';
  targetDate?: string;
}

export interface GrantProposal {
  id: string;
  title: string;
  donorId: string;
  donorName: string;
  dateSubmitted: string;
  tags: string[];
  status: 'GRANTED' | 'PENDING' | 'DECLINED';
  requestedAmount: number;
  givenAmount?: number;
  stages: ProposalStage[];
  complianceLinks: { label: string; url: string }[];
  extractedText?: string;
  uploadedDocumentName?: string;
  aiReportingSchedule?: { taskTitle: string; deadline: string; description: string }[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 16. Maintenance & Vendor Tracking
// ==========================================
export type MaintenanceStatus = 
  | 'REPORTED' 
  | 'PENDING_APPROVAL' 
  | 'OPS_APPROVED' 
  | 'FINANCE_APPROVED' 
  | 'UNDER_REPAIR' 
  | 'COMPLETED' 
  | 'PAID' 
  | 'REJECTED' 
  | 'CHANGES_REQUESTED' 
  | 'IN_PROGRESS' 
  | 'SCHEDULED';

export interface MaintenanceRecord {
  id: string;
  title: string;
  equipmentName?: string;
  serviceDetails?: string;
  partsReplaced?: string[];
  cost?: number;
  scheduledDate?: string;
  completedDate?: string;
  malfunctionDate?: string;
  requestDate?: string;
  completionDate?: string;
  faultDescription?: string;
  amountPaid: number;
  vendorName: string;
  vendorAddress?: string;
  vendorContact: string;
  vendorEmail?: string;
  vendorPhone?: string;
  status: MaintenanceStatus;
  currentApprovalStep?: number; // 1 = Level 1 Operations Technical Assessment, 2 = Level 2 Finance PO Approval, 3 = Repair Dispatched, 4 = Final Sign-Off
  totalApprovalSteps?: number; // 2 or 3
  assignedApproverRole?: string; // 'PROJECT_MANAGER' | 'OPERATIONS' | 'FINANCE_OFFICER'
  requesterId?: string;
  requesterName?: string;
  requesterRole?: string;
  approvalHistory?: ApprovalStepRecord[];
  receiptUrl?: string;
  receiptFileName?: string;
  projectId?: string;
  projectName?: string;
  loggedBy?: string;
  createdAt: string;
}

// ==========================================
// 17. Stocks & Inventory Management
// ==========================================
export type StockMeasurementUnit = 
  | 'PIECES'
  | 'PACKS_10'
  | 'PACKS_50'
  | 'PACKS_100'
  | 'CARTONS'
  | 'BAGS_50KG'
  | 'DRUMS_200L'
  | 'LITERS'
  | 'KG'
  | 'BOXES'
  | 'BAGS';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  location: string;
  measurementUnit: StockMeasurementUnit;
  startingStock: number;
  receivedStock: number;
  issuedStock: number;
  closingStock: number;
  reorderLevel?: number;
  minimumThreshold?: number;
  unitPrice?: number;
  unitCost?: number;
  currency?: string;
  updatedAt: string;
}

export interface StockUsageRequest {
  id: string;
  stockItemId: string;
  stockItemName: string;
  quantityRequested: number;
  measurementUnit: StockMeasurementUnit;
  projectId: string;
  projectName: string;
  requesterName: string;
  requestedBy?: string;
  requesterRole?: string;
  purpose: string;
  requiredDate?: string;
  status: 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}
