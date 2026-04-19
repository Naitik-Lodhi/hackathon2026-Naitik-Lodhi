import fs from 'fs';
import path from 'path';
import { query } from '../db/db';

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

const readJsonFile = (fileName: string) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

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

const normalizeKnowledgeBase = (knowledgeBase: ImportDataset['knowledge_base']) => {
  if (!knowledgeBase) return [];
  if (typeof knowledgeBase === 'string') return [{ id: 'knowledge-base', title: 'Knowledge Base', content: knowledgeBase }];
  if (Array.isArray(knowledgeBase)) return knowledgeBase;
  if (typeof knowledgeBase === 'object') {
    return Object.entries(knowledgeBase).map(([key, value]) => ({
      id: key,
      title: key,
      content: typeof value === 'string' ? value : JSON.stringify(value),
    }));
  }
  return [];
};

const ensureArray = (value: unknown, name: string) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array.`);
  return value;
};

export const importDataset = async (dataset: ImportDataset, source = 'api'): Promise<ImportSummary> => {
  const tickets = ensureArray(dataset.tickets, 'tickets');
  const customers = ensureArray(dataset.customers, 'customers');
  const orders = ensureArray(dataset.orders, 'orders');
  const products = ensureArray(dataset.products, 'products');
  const knowledgeBase = normalizeKnowledgeBase(dataset.knowledge_base);
  const errors: Array<{ type: string; index: number; error: string }> = [];

  if (dataset.replace !== false) {
    await query(`TRUNCATE tickets, ticket_runs, audit_logs RESTART IDENTITY CASCADE`);
    await query(`TRUNCATE customers, products, orders, knowledge_base RESTART IDENTITY CASCADE`);
  }

  // Import Customers
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    try {
      const customerId = firstString(c, ['customer_id', 'id']);
      const email = firstString(c, ['email']);
      if (!customerId || !email) throw new Error('Customer requires customer_id and email.');
      
      await query(
        `INSERT INTO customers (customer_id, name, email, phone, tier, member_since, total_orders, total_spent, address, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (customer_id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           tier = EXCLUDED.tier,
           member_since = EXCLUDED.member_since,
           total_orders = EXCLUDED.total_orders,
           total_spent = EXCLUDED.total_spent,
           address = EXCLUDED.address,
           notes = EXCLUDED.notes`,
        [
          customerId,
          firstString(c, ['name']),
          email,
          firstString(c, ['phone']),
          firstString(c, ['tier']) || 'standard',
          firstString(c, ['member_since']),
          firstNumber(c, ['total_orders'], 0),
          firstNumber(c, ['total_spent'], 0),
          c.address ? JSON.stringify(c.address) : null,
          firstString(c, ['notes'])
        ]
      );
    } catch (err: any) {
      errors.push({ type: 'customer', index: i, error: err.message });
    }
  }

  // Import Products
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const productId = firstString(p, ['product_id', 'id', 'sku']);
      if (!productId) throw new Error('Product requires product_id or id.');

      await query(
        `INSERT INTO products (product_id, name, category, price, warranty_months, return_window_days, returnable, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (product_id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           warranty_months = EXCLUDED.warranty_months,
           return_window_days = EXCLUDED.return_window_days,
           returnable = EXCLUDED.returnable,
           notes = EXCLUDED.notes`,
        [
          productId,
          firstString(p, ['name']),
          firstString(p, ['category']),
          firstNumber(p, ['price'], 0),
          firstNumber(p, ['warranty_months'], 0),
          firstNumber(p, ['return_window_days'], 30),
          p.returnable !== false,
          firstString(p, ['notes'])
        ]
      );
    } catch (err: any) {
      errors.push({ type: 'product', index: i, error: err.message });
    }
  }

  // Import Orders
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    try {
      const orderId = firstString(o, ['order_id', 'id']);
      const customerId = firstString(o, ['customer_id']);
      const productId = firstString(o, ['product_id']);
      if (!orderId || !customerId || !productId) throw new Error('Order requires order_id, customer_id, and product_id.');

      await query(
        `INSERT INTO orders (order_id, customer_id, product_id, quantity, status, total_amount, order_date, delivery_date, return_deadline, refund_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (order_id) DO UPDATE SET
           customer_id = EXCLUDED.customer_id,
           product_id = EXCLUDED.product_id,
           quantity = EXCLUDED.quantity,
           status = EXCLUDED.status,
           total_amount = EXCLUDED.total_amount,
           order_date = EXCLUDED.order_date,
           delivery_date = EXCLUDED.delivery_date,
           return_deadline = EXCLUDED.return_deadline,
           refund_status = EXCLUDED.refund_status,
           notes = EXCLUDED.notes`,
        [
          orderId,
          customerId,
          productId,
          firstNumber(o, ['quantity'], 1),
          firstString(o, ['status']) || 'processing',
          firstNumber(o, ['amount', 'total_amount'], 0),
          firstString(o, ['order_date']),
          firstString(o, ['delivery_date']),
          firstString(o, ['return_deadline']),
          firstString(o, ['refund_status']),
          firstString(o, ['notes'])
        ]
      );
    } catch (err: any) {
      errors.push({ type: 'order', index: i, error: err.message });
    }
  }

  // Import Knowledge Base
  for (let i = 0; i < knowledgeBase.length; i++) {
    const kb = knowledgeBase[i];
    try {
      await query(
        `INSERT INTO knowledge_base (id, title, content, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           updated_at = NOW()`,
        [kb.id, kb.title, kb.content]
      );
    } catch (err: any) {
      errors.push({ type: 'knowledge_base', index: i, error: err.message });
    }
  }

  // Import Tickets
  const normalizedTickets = tickets.map((ticket, index) => {
    try {
      return normalizeTicket(ticket, source);
    } catch (error: any) {
      errors.push({ type: 'ticket', index, error: error.message });
      return null;
    }
  }).filter(Boolean) as ReturnType<typeof normalizeTicket>[];

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

  if (errors.length > 0) {
    await query(
      `INSERT INTO import_errors (data_source, payload, errors) VALUES ($1, $2, $3)`,
      [source, JSON.stringify(dataset), JSON.stringify(errors)],
    );
    // We still threw if errors occurred in previous version, keeping consistency
    throw new Error(`Invalid import schema: ${errors.map(error => `${error.type}[${error.index}] ${error.error}`).join('; ')}`);
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
