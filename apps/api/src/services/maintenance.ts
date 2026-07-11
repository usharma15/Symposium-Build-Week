import { getPool, hasDatabase } from "../db/client";
import { deleteUploadedObject } from "./storage";

const maintenanceIntervalMs = 6 * 60 * 60 * 1000;
let maintenanceTimer: NodeJS.Timeout | null = null;
let lastCompletedAt: string | null = null;
let lastErrorAt: string | null = null;
let lastStartedAt: string | null = null;

export const getMaintenanceStatus = () => ({
  active: Boolean(maintenanceTimer),
  lastCompletedAt,
  lastErrorAt,
  lastStartedAt
});

export const runDatabaseMaintenance = async () => {
  if (!hasDatabase()) return;
  lastStartedAt = new Date().toISOString();
  const client = await getPool().connect();
  let committed = false;
  let expiredUploadObjectKeys: string[] = [];
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM mutation_receipts
       WHERE id IN (
         SELECT id FROM mutation_receipts
         WHERE status = 'completed' AND created_at < now() - interval '7 days'
         ORDER BY created_at ASC
         LIMIT 5000
       )`
    );
    await client.query(
      `DELETE FROM events
       WHERE id IN (
         SELECT id FROM events
         WHERE created_at < now() - interval '14 days'
         ORDER BY created_at ASC
         LIMIT 5000
       )`
    );
    await client.query(
      `DELETE FROM content_views
       WHERE id IN (
         SELECT id FROM content_views
         WHERE created_at < now() - interval '2 days'
         ORDER BY created_at ASC
         LIMIT 5000
       )`
    );
    const expiredUploads = await client.query<{ uploadObjectKey: string }>(
      `UPDATE attachments
       SET status = 'failed',
           metadata = metadata || jsonb_build_object('verificationError', 'Upload window expired.'),
           updated_at = now()
       WHERE status IN ('pending', 'verifying')
         AND updated_at < now() - interval '1 day'
       RETURNING upload_object_key AS "uploadObjectKey"`
    );
    expiredUploadObjectKeys = expiredUploads.rows.map((row) => row.uploadObjectKey);
    await client.query("COMMIT");
    committed = true;
    lastCompletedAt = new Date().toISOString();
    lastErrorAt = null;
  } catch (error) {
    await client.query("ROLLBACK");
    lastErrorAt = new Date().toISOString();
    throw error;
  } finally {
    client.release();
  }

  if (committed && expiredUploadObjectKeys.length) {
    const cleanup = await Promise.allSettled(expiredUploadObjectKeys.map(deleteUploadedObject));
    if (cleanup.some((result) => result.status === "rejected")) {
      console.warn("SYMPOSIUM expired R2 attachment cleanup was incomplete.");
    }
  }
};

export const startDatabaseMaintenance = () => {
  if (maintenanceTimer || !hasDatabase()) return;
  const execute = () => {
    void runDatabaseMaintenance().catch((error) => {
      console.warn("SYMPOSIUM database maintenance failed.", error);
    });
  };
  execute();
  maintenanceTimer = setInterval(execute, maintenanceIntervalMs);
  maintenanceTimer.unref();
};

export const stopDatabaseMaintenance = () => {
  if (!maintenanceTimer) return;
  clearInterval(maintenanceTimer);
  maintenanceTimer = null;
};
