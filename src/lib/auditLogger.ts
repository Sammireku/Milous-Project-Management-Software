import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLog, AuditActionType, MailNotification } from '../types';

/**
 * Logs human-readable activity history to the /audit_logs Firestore collection
 */
export async function logAuditEvent(params: {
  projectId?: string;
  projectName?: string;
  actionType: AuditActionType;
  entityType: 'Task' | 'Expense' | 'Project' | 'Indicator';
  entityId: string;
  entityTitle: string;
  modifiedByUserId: string;
  modifiedByUserName: string;
  modifiedByUserRole?: string;
  previousValue?: any;
  newValue?: any;
  changeSummary: string;
}): Promise<void> {
  try {
    const logData: Omit<AuditLog, 'id'> = {
      projectId: params.projectId || '',
      projectName: params.projectName || 'General Project',
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      modifiedByUserId: params.modifiedByUserId,
      modifiedByUserName: params.modifiedByUserName || 'Staff Member',
      modifiedByUserRole: params.modifiedByUserRole || 'Field Officer',
      previousValue: params.previousValue ?? '',
      newValue: params.newValue ?? '',
      changeSummary: params.changeSummary,
      timestamp: new Date().toISOString(),
    };

    await addDoc(collection(db, 'audit_logs'), logData);
  } catch (err) {
    console.warn('Activity history notice (handled gracefully by local store):', err);
  }
}

/**
 * Writes an email record to the /mail collection (Firebase "Trigger Email" Extension)
 * Alerts Project Managers when a field activity/task status is marked as 'COMPLETED'
 */
export async function triggerTaskCompletedEmailAlert(params: {
  taskId: string;
  taskTitle: string;
  projectName: string;
  completedByName: string;
  projectManagerEmails: string[];
}): Promise<void> {
  try {
    const recipientEmails = params.projectManagerEmails.length > 0 
      ? params.projectManagerEmails 
      : ['kofi.mensah@milous-ngo.org'];

    const mailDoc: MailNotification = {
      to: recipientEmails,
      message: {
        subject: `Task Completed Alert: "${params.taskTitle}" (${params.projectName})`,
        text: `Hello Project Manager,\n\nField activity "${params.taskTitle}" in "${params.projectName}" has been marked as COMPLETED by ${params.completedByName}.\n\nPlease log in to review field photos and indicator progress.\n\nThank you,\nMilous NGO Field Operations`,
        html: `
          <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 600px;">
            <div style="background-color: #059669; padding: 16px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px; font-weight: bold;">Field Activity Completed</h2>
            </div>
            <p style="font-size: 14px; margin-bottom: 12px;">Hello Project Manager,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Field activity <strong>"${params.taskTitle}"</strong> under project <strong>"${params.projectName}"</strong> has been successfully marked as <strong>COMPLETED</strong> by <strong>${params.completedByName}</strong>.
            </p>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Task ID:</strong> ${params.taskId}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Project:</strong> ${params.projectName}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Completed By:</strong> ${params.completedByName}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 24px; text-align: center;">
              Sent automatically via Firebase Trigger Email Extension for Milous NGO Operations.
            </p>
          </div>
        `,
      },
      metadata: {
        taskId: params.taskId,
        projectId: params.projectName,
        changedBy: params.completedByName,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'mail'), mailDoc);
  } catch (err) {
    console.warn('Mail extension trigger notice:', err);
  }
}
