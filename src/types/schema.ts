import { UserProfile, UserRole, Project, Task, Indicator, Expense } from '../types';

/**
 * AppUser interface for Auth and RBAC
 */
export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'ceo' | 'project_manager' | 'me_officer' | 'finance_officer' | 'field_officer' | 'donor_auditor' | UserRole;
  displayName: string;
  photoURL?: string;
  organization?: string;
  assignedProjectIds?: string[];
  department?: string;
  isActive?: boolean;
}

export * from '../types';
