import fs from 'fs';
import path from 'path';
import { query } from './db';

export const exportAuditLog = async () => {
  const result = await query(`
    SELECT
      a.*,
      t.external_ticket_id,
      t.customer_email,
      t.subject,
      t.expected_action
    FROM audit_logs a
    JOIN tickets t ON t.id = a.ticket_id
    ORDER BY t.external_ticket_id ASC NULLS LAST, a.step ASC, a.attempt ASC, a.timestamp ASC
  `);

  const outputPath = path.resolve(__dirname, '../../../audit_log.json');
  fs.writeFileSync(outputPath, JSON.stringify(result.rows, null, 2));
  return { outputPath, count: result.rows.length };
};

if (require.main === module) {
  exportAuditLog()
    .then(({ outputPath, count }) => {
      console.log(`Exported ${count} audit log rows to ${outputPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to export audit log', error);
      process.exit(1);
    });
}
