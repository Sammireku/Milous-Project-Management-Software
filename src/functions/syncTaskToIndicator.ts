import { onDocumentUpdated, FirestoreEvent, Change } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Task, Indicator, IndicatorAuditEntry } from '../types';

// Ensure Firebase Admin is initialized once
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Task-to-Indicator Auto-Sync Cloud Function (Firebase Functions v2)
 *
 * Listens for updates on '/tasks/{taskId}'.
 * When a task status transitions from a non-COMPLETED state to 'COMPLETED',
 * this function automatically increments the target indicator's actualValue
 * inside a secure Firestore transaction.
 */
export const syncTaskToIndicator = onDocumentUpdated(
  'tasks/{taskId}',
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { taskId: string }>) => {
    const taskId = event.params.taskId;

    // 1. Validate snapshot existence
    if (!event.data) {
      logger.warn(`[Auto-Sync] No document snapshot data found for task ${taskId}. Skipping.`);
      return;
    }

    const beforeSnap = event.data.before;
    const afterSnap = event.data.after;

    if (!beforeSnap || !afterSnap || !beforeSnap.exists || !afterSnap.exists) {
      logger.info(`[Auto-Sync] Task ${taskId} was either created or deleted. Skipping update trigger.`);
      return;
    }

    const beforeData = beforeSnap.data() as Task;
    const afterData = afterSnap.data() as Task;

    const previousStatus = beforeData.status;
    const newStatus = afterData.status;

    logger.info(
      `[Auto-Sync] Processing update for task "${afterData.title}" (${taskId}): ${previousStatus} -> ${newStatus}`
    );

    // 2. Logic Validation: Check if status specifically transitioned to 'COMPLETED'
    // Prevent duplicate triggers if task was already COMPLETED
    if (previousStatus === 'COMPLETED') {
      logger.info(
        `[Auto-Sync] Task ${taskId} was already COMPLETED in the previous revision. No increment required.`
      );
      return;
    }

    if (newStatus !== 'COMPLETED') {
      logger.info(
        `[Auto-Sync] Task ${taskId} status transitioned to "${newStatus}" (not COMPLETED). No sync needed.`
      );
      return;
    }

    // Check if task is linked to an indicator
    const linkedIndicatorId = afterData.linkedIndicatorId;
    if (!linkedIndicatorId || typeof linkedIndicatorId !== 'string' || linkedIndicatorId.trim() === '') {
      logger.info(
        `[Auto-Sync] Task ${taskId} completed but has no linkedIndicatorId configured. Skipping indicator update.`
      );
      return;
    }

    // Idempotency safeguard check: if task already recorded sync completion
    if (afterData.indicatorSyncApplied) {
      logger.warn(
        `[Auto-Sync] Task ${taskId} already has indicatorSyncApplied flag set. Skipping to prevent duplicate increment.`
      );
      return;
    }

    const indicatorRef = db.collection('indicators').doc(linkedIndicatorId);
    const taskRef = db.collection('tasks').doc(taskId);

    // Determine increment amount (defaults to 1 unless task specifies a custom metric value)
    const incrementDelta = 
      typeof afterData.indicatorIncrementValue === 'number' && afterData.indicatorIncrementValue > 0
        ? afterData.indicatorIncrementValue
        : 1;

    try {
      // 3. Database Transaction: Fetch indicator, increment actualValue, update timestamp & history
      await db.runTransaction(async (transaction) => {
        const indicatorSnap = await transaction.get(indicatorRef);

        if (!indicatorSnap.exists) {
          throw new Error(
            `Indicator document ${linkedIndicatorId} referenced by task ${taskId} was not found in Firestore.`
          );
        }

        const indicatorData = indicatorSnap.data() as Indicator;

        // Verify if the indicator has auto-sync enabled (optional check with permissive fallback)
        if (indicatorData.autoSyncEnabled === false) {
          logger.warn(
            `[Auto-Sync] Indicator ${linkedIndicatorId} (${indicatorData.code}) has autoSyncEnabled set to false. Proceeding with caution.`
          );
        }

        const currentActual = typeof indicatorData.actualValue === 'number' ? indicatorData.actualValue : 0;
        const newActualValue = currentActual + incrementDelta;
        const nowIso = new Date().toISOString();

        // Create an audit trail entry for M&E donor verification
        const auditEntry: IndicatorAuditEntry = {
          id: `audit_${taskId}_${Date.now()}`,
          timestamp: nowIso,
          previousValue: currentActual,
          newValue: newActualValue,
          increment: incrementDelta,
          sourceTaskId: taskId,
          sourceTaskTitle: afterData.title || 'Completed Task',
          triggeredByUserId: afterData.assigneeId,
          note: `Auto-synced from completed task [${afterData.title}]`,
        };

        // Update the indicator document atomically
        transaction.update(indicatorRef, {
          actualValue: newActualValue,
          updatedAt: nowIso,
          history: FieldValue.arrayUnion(auditEntry),
        });

        // Mark the task as synchronized to provide idempotency guarantee
        transaction.update(taskRef, {
          indicatorSyncApplied: true,
          actualEndDate: afterData.actualEndDate || nowIso,
          updatedAt: nowIso,
        });

        logger.info(
          `[Auto-Sync Success] Indicator "${indicatorData.title}" (${linkedIndicatorId}) updated: ${currentActual} -> ${newActualValue} (+${incrementDelta})`
        );
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        `[Auto-Sync Error] Transaction failed for task ${taskId} linking to indicator ${linkedIndicatorId}: ${errorMessage}`,
        { error }
      );
      throw error; // Re-throw to alert Cloud Functions retry/monitoring if configured
    }
  }
);
