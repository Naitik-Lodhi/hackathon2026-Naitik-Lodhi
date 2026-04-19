import { query } from './db';
import fs from 'fs';
import path from 'path';

export const runMigrations = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await query(schema);
        console.log('Migrations executed successfully');
    } catch (error) {
        console.error('Error executing migrations', error);
        throw error;
    }
}
