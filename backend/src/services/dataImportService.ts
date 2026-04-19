import fs from 'fs';
import path from 'path';
import { query } from '../db/db';

type RecordType = 'customer' | 'order' | 'product' | 'knowledge_base';

export interface ImportDataset {
  tickets?: any[];
  customers?: any[];
  orders?: any[];
  products?: any[];
  knowledge_base?: any[] | Record<string, any> | string;
  replace?: boolean;
}

export interface ImportSummary {
  source: string;
  tickets: number;
  customers: number;
  orders: number;
  products: number;
  knowledge_base: number;
}

const dataDir = path.resolve(__dirname, '../../../data');

const readJsonFile = (fileName: string) => JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));

const loadDefaultKnowledgeBase = () => {
  const jsonPath = path.join(dataDir, 'knowledge_base.json');
  if (fs.existsSync(jsonPath)) return readJsonFile('knowledge_base.json');

  const mdPath = path.join(dataDir, 'knowledge-base.md');
  if (!fs.existsSync(mdPath)) return [];

  const markdown = fs.readFileSync(mdPath, 'utf8');
  return markdown
    .split(/\n(?=##\s+)/)
    .map((section, index) => ({
      id: `kb-${index + 1}`,
      title: section.match(/^##\s+(.+)$/m)?.[1]?.trim() ?? `Knowledge Base ${index + 1}`,
      content: section.trim(),
    }))
    .filter(entry => entry.content);
};

export const loadDefaultDataset = (): ImportDataset => ({
  tickets: readJsonFile('tickets.json'),
  customers: readJsonFile('customers.json'),
  orders: readJsonFile('orders.json'),
  products: readJsonFile('products.json'),
  knowledge_base: loadDefaultKnowledgeBase(),
  replace: true,
});

const firstString = (record: any, fields: string[]) => {
  for (const field of fields) {
    const value = record?.[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const firstNumber = (record: any, fields: string[], fallback: number) => {
  for (const field of fields) {
    const value = record?.[field];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
};

const normalizeTicket = (ticket: any, source: string) => {
  const externalId = firstString(ticket, ['ticket_id', 'id', 'external_ticket_id']);
  const subject = firstString(ticket, ['subject', 'title']) ?? 'Support request';
  const body = firstString(ticket, ['body', 'content', 'message', 'description']);
  const email = firstString(ticket, ['customer_email', 'email']);

  if (!body) throw new Error('Ticket requires body, content, message, or description.');

  return {
    external_ticket_id: externalId,
    customer_email: email,
    subject,
    content: subject ? `${subject}\n\n${body}` : body,
    expected_action: firstString(ticket, ['expected_action', 'expected_context']),
    source: firstString(ticket, ['source']) ?? source,
    data_source: source,
    priority: firstNumber(ticket, ['priority', 'tier'], 1),
    created_at: firstString(ticket, ['created_at', 'createdAt']),
  };
};

const normalizeRecord = (recordType: RecordType, record: any) => {
  if (recordType === 'knowledge_base' && typeof record === 'string') {
    const externalId = `kb-${Buffer.from(record).toString('base64url').slice(0, 16)}`;
    return { externalId, data: { id: externalId, title: externalId, content: record } };
  }

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error(`${recordType} record must be an object.`);
  }

  if (recordType === 'customer') {
    const externalId = firstString(record, ['customer_id', 'id', 'external_id']) ?? firstString(record, ['email']);
    const email = firstString(record, ['email', 'customer_email']);
    if (!externalId || !email) throw new Error('Customer requires customer_id/id or email, and email.');
    return { externalId, data: { ...record, customer_id: firstString(record, ['customer_id', 'id']) ?? externalId, email } };
  }

  if (recordType === 'order') {
    const externalId = firstString(record, ['order_id', 'id', 'external_id']);
    if (!externalId) throw new Error('Order requires order_id or id.');
    return { externalId, data: { ...record, order_id: externalId } };
  }

  if (recordType === 'product') {
    const externalId = firstString(record, ['product_id', 'id', 'sku', 'external_id']);
    const name = firstString(record, ['name', 'title']);
    if (!externalId || !name) throw new Error('Product requires product_id/id/sku and name/title.');
    return { externalId, data: { ...record, product_id: externalId, name } };
  }

  const externalId = firstString(record, ['id', 'key', 'title']) ?? `kb-${Buffer.from(JSON.stringify(record)).toString('base64url').slice(0, 16)}`;
  const content = firstString(record, ['content', 'body', 'text', 'excerpt']) ?? JSON.stringify(record);
  return { externalId, data: { ...record, id: externalId, content, title: firstString(record, ['title', 'name']) ?? externalId } };
};

const normalizeKnowledgeBase = (knowledgeBase: ImportDataset['knowledge_base']) => {
  if (!knowledgeBase) return [];
  if (typeof knowledgeBase === 'string') return [{ id: 'knowledge-base', title: 'Knowledge Base', content: knowledgeBase }];
  if (Array.isArray(knowledgeBase)) return knowledgeBase;
  if (typeof knowledgeBase === 'object') {
    return Object.entries(knowledgeBase).map(([key, value]) => ({
      id: key,
      title: key,
      content: typeof value === 'string' ? value : JSON.stringify(value),
      value,
    }));
  }
  return [];
};

const ensureArray = (value: unknown, name: string) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array.`);
  return value;
};

const insertSupportRecord = async (recordType: RecordType, externalId: string, data: any, source: string) => {
  await query(
    `INSERT INTO support_data_records (record_type, external_id, data, data_source, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (record_type, external_id) DO UPDATE SET
       data = EXCLUDED.data,
       data_source = EXCLUDED.data_source,
       updated_at = NOW()`,
    [recordType, externalId, JSON.stringify(data), source],
  );
};

export const importDataset = async (dataset: ImportDataset, source = 'api'): Promise<ImportSummary> => {
  const tickets = ensureArray(dataset.tickets, 'tickets');
  const customers = ensureArray(dataset.customers, 'customers');
  const orders = ensureArray(dataset.orders, 'orders');
  const products = ensureArray(dataset.products, 'products');
  const knowledgeBase = normalizeKnowledgeBase(dataset.knowledge_base);
  const errors: Array<{ type: string; index: number; error: string }> = [];

  const normalizedTickets = tickets.map((ticket, index) => {
    try {
      return normalizeTicket(ticket, source);
    } catch (error: any) {
      errors.push({ type: 'ticket', index, error: error.message });
      return null;
    }
  }).filter(Boolean) as ReturnType<typeof normalizeTicket>[];

  const normalizedRecords: Array<{ type: RecordType; externalId: string; data: any }> = [];
  const addRecords = (type: RecordType, rows: any[]) => {
    rows.forEach((row, index) => {
      try {
        normalizedRecords.push({ type, ...normalizeRecord(type, row) });
      } catch (error: any) {
        errors.push({ type, index, error: error.message });
      }
    });
  };

  addRecords('customer', customers);
  addRecords('order', orders);
  addRecords('product', products);
  addRecords('knowledge_base', knowledgeBase);

  if (errors.length > 0) {
    await query(
      `INSERT INTO import_errors (data_source, payload, errors) VALUES ($1, $2, $3)`,
      [source, JSON.stringify(dataset), JSON.stringify(errors)],
    );
    throw new Error(`Invalid import schema: ${errors.map(error => `${error.type}[${error.index}] ${error.error}`).join('; ')}`);
  }

  if (dataset.replace !== false) {
    await query(`TRUNCATE tickets, ticket_runs, audit_logs RESTART IDENTITY CASCADE`);
    await query(`TRUNCATE support_data_records RESTART IDENTITY CASCADE`);
  }

  for (const record of normalizedRecords) {
    await insertSupportRecord(record.type, record.externalId, record.data, source);
  }

  for (const ticket of normalizedTickets) {
    await query(
      `INSERT INTO tickets (
        external_ticket_id,
        customer_email,
        subject,
        content,
        expected_action,
        source,
        data_source,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'queued', COALESCE($9::timestamp, NOW()), NOW())
      ON CONFLICT (external_ticket_id) DO UPDATE SET
        customer_email = EXCLUDED.customer_email,
        subject = EXCLUDED.subject,
        content = EXCLUDED.content,
        expected_action = EXCLUDED.expected_action,
        source = EXCLUDED.source,
        data_source = EXCLUDED.data_source,
        priority = EXCLUDED.priority,
        status = 'queued',
        llm_status = NULL,
        fallback_used = false,
        updated_at = NOW()`,
      [
        ticket.external_ticket_id,
        ticket.customer_email,
        ticket.subject,
        ticket.content,
        ticket.expected_action,
        ticket.source,
        ticket.data_source,
        ticket.priority,
        ticket.created_at,
      ],
    );
  }

  return {
    source,
    tickets: normalizedTickets.length,
    customers: customers.length,
    orders: orders.length,
    products: products.length,
    knowledge_base: knowledgeBase.length,
  };
};
