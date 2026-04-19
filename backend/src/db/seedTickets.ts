import { runMigrations } from './migrate';
import { importDataset, loadDefaultDataset } from '../services/dataImportService';

export const seedTicketsFromData = async () => {
  const summary = await importDataset(loadDefaultDataset(), 'default');
  return summary;
};

if (require.main === module) {
  runMigrations()
    .then(() => seedTicketsFromData())
    .then(summary => {
      console.log(`Seeded ${summary.tickets} tickets from the default dataset`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed default dataset', error);
      process.exit(1);
    });
}
