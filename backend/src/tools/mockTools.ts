import { query } from '../db/db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const deterministicToolCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  await delay(25);
  return fn();
};

const normalizeDate = (dateValue?: string | null) => dateValue ? dateValue.slice(0, 10) : null;

const addMonths = (dateValue: string, months: number) => {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

const firstString = (record: any, fields: string[]) => {
  for (const field of fields) {
    const value = record?.[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const firstNumber = (record: any, fields: string[], fallback = 0) => {
  for (const field of fields) {
    const value = record?.[field];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
};

const isDefectOrDamage = (context?: string | null) => {
  const text = (context ?? '').toLowerCase();
  return ['defect', 'defective', 'broken', 'stopped working', 'damaged', 'cracked', 'wrong item', 'wrong size', 'wrong colour', 'wrong color'].some(term => text.includes(term));
};

const getRecord = async (recordType: string, externalId: string | null) => {
  if (!externalId) return null;
  const result = await query(
    `SELECT data FROM support_data_records
     WHERE record_type = $1 AND lower(external_id) = lower($2)
     LIMIT 1`,
    [recordType, externalId],
  );
  return result.rows[0]?.data ?? null;
};

const findCustomerByEmail = async (email?: string | null) => {
  if (!email) return null;
  const result = await query(
    `SELECT data FROM support_data_records
     WHERE record_type = 'customer' AND lower(data->>'email') = lower($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0]?.data ?? null;
};

const findCustomerById = async (customerId?: string | null) => {
  if (!customerId) return null;
  return getRecord('customer', customerId);
};

const findOrder = async (identifier?: string | null, customerEmail?: string | null) => {
  if (identifier) {
    const byId = await getRecord('order', identifier);
    if (byId) return byId;
  }

  const customer = await findCustomerByEmail(customerEmail ?? identifier ?? null);
  if (!customer) return null;

  const customerId = firstString(customer, ['customer_id', 'id']);
  const result = await query(
    `SELECT data FROM support_data_records
     WHERE record_type = 'order'
       AND (data->>'customer_id' = $1 OR lower(data->>'customer_email') = lower($2))
     ORDER BY
       CASE WHEN data->>'status' = 'processing' THEN 0 ELSE 1 END,
       COALESCE(data->>'order_date', data->>'created_at', '') DESC
     LIMIT 1`,
    [customerId, customer.email],
  );
  return result.rows[0]?.data ?? null;
};

const findProductById = async (productId?: string | null) => {
  if (!productId) return null;
  return getRecord('product', productId);
};

const findProductForOrder = async (order?: any | null) => {
  const productId = firstString(order, ['product_id', 'sku']);
  return findProductById(productId);
};

const getKbEntries = async (queryText?: string | null) => {
  const text = queryText ?? '';
  const result = await query(
    `SELECT data FROM support_data_records
     WHERE record_type = 'knowledge_base'
       AND ($1 = '' OR data::text ILIKE '%' || $1 || '%')
     ORDER BY external_id ASC
     LIMIT 10`,
    [text],
  );

  if (result.rows.length > 0) return result.rows.map(row => row.data);

  const fallback = await query(
    `SELECT data FROM support_data_records WHERE record_type = 'knowledge_base' ORDER BY external_id ASC LIMIT 10`,
  );
  return fallback.rows.map(row => row.data);
};

const includesPolicy = (entries: any[], terms: string[]) => {
  const text = entries.map(entry => JSON.stringify(entry)).join('\n').toLowerCase();
  return terms.some(term => text.includes(term));
};

export const tools = {
  get_customer: async (email: string | null) => {
    return deterministicToolCall(() => findCustomerByEmail(email));
  },

  get_order: async (orderIdOrEmail: string | null, customerEmail?: string | null) => {
    return deterministicToolCall(() => findOrder(orderIdOrEmail, customerEmail));
  },

  get_product: async (productId: string | null) => {
    return deterministicToolCall(() => findProductById(productId));
  },

  search_knowledge_base: async (queryText: string) => {
    return deterministicToolCall(async () => {
      const results = await getKbEntries(queryText);
      return {
        query: queryText,
        results: results.map(entry => ({
          title: firstString(entry, ['title', 'name', 'id']) ?? 'Knowledge Base',
          excerpt: firstString(entry, ['content', 'body', 'text', 'excerpt']) ?? JSON.stringify(entry),
        })),
      };
    });
  },

  check_refund_eligibility: async (orderId: string | null, customerEmail?: string | null, context?: string | null, asOfDate?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId, customerEmail);
      if (!order) return { order_id: orderId, eligible: false, reason: 'Order was not found in the imported dataset.' };

      const customer = await findCustomerById(firstString(order, ['customer_id']));
      const product = await findProductForOrder(order);
      const kbEntries = await getKbEntries('refund return damaged defective');
      const effectiveDate = normalizeDate(asOfDate) ?? new Date().toISOString().slice(0, 10);
      const returnDeadline = normalizeDate(firstString(order, ['return_deadline', 'return_by']));
      const orderIdValue = firstString(order, ['order_id', 'id']) ?? orderId;

      if (firstString(order, ['refund_status']) === 'refunded') {
        return { order_id: orderIdValue, eligible: false, reason: 'Refund has already been processed for this order.' };
      }

      if (includesPolicy(kbEntries, ['registered online', 'non-returnable']) && /registered online|non-returnable/i.test(JSON.stringify(order) + JSON.stringify(product))) {
        return { order_id: orderIdValue, eligible: false, reason: 'Imported policy marks this item as non-returnable.' };
      }

      if (isDefectOrDamage(context) && includesPolicy(kbEntries, ['damaged', 'defective', 'wrong item'])) {
        return { order_id: orderIdValue, eligible: true, reason: 'Imported policy allows refunds or replacement for damaged, defective, or wrong-item claims.' };
      }

      if (returnDeadline && effectiveDate <= returnDeadline) {
        return { order_id: orderIdValue, eligible: true, reason: `Within return window ending ${returnDeadline}.` };
      }

      const tier = firstString(customer, ['tier']);
      if (tier === 'vip' && /pre-approved|exception|extended/i.test(JSON.stringify(customer) + JSON.stringify(order))) {
        return { order_id: orderIdValue, eligible: true, reason: 'Customer record contains an imported exception or extended return approval.' };
      }

      return { order_id: orderIdValue, eligible: false, reason: returnDeadline ? `Return deadline expired on ${returnDeadline}.` : 'No return deadline or qualifying policy exception was found.' };
    });
  },

  issue_refund: async (orderId: string, amount: number) => {
    return deterministicToolCall(async () => ({
      order_id: orderId,
      amount,
      status: 'processed',
      transaction_id: `refund-${orderId}`,
    }));
  },

  cancel_order: async (orderId: string | null, customerEmail?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId, customerEmail);
      if (!order) return { order_id: orderId, cancelled: false, reason: 'Order was not found.' };

      const status = firstString(order, ['status']) ?? 'unknown';
      const id = firstString(order, ['order_id', 'id']) ?? orderId;
      const kbEntries = await getKbEntries('cancellation cancel');
      const policyAllowsProcessing = includesPolicy(kbEntries, ['processing', 'before shipment', 'before shipping']);

      if (status === 'processing' && policyAllowsProcessing) {
        return { order_id: id, cancelled: true, status: 'cancelled', reason: 'Imported cancellation policy allows processing orders to be cancelled.' };
      }
      if (status === 'processing') {
        return { order_id: id, cancelled: true, status: 'cancelled', reason: 'Order is still processing and no imported policy blocks cancellation.' };
      }
      return { order_id: id, cancelled: false, reason: `Order status is ${status}; it cannot be cancelled automatically.` };
    });
  },

  check_warranty: async (orderId: string | null, productId: string | null, asOfDate?: string | null, context?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId);
      const product = await findProductById(productId) ?? await findProductForOrder(order);
      const kbEntries = await getKbEntries('warranty defect manufacturing');
      const orderIdValue = firstString(order, ['order_id', 'id']) ?? orderId;
      const productIdValue = firstString(product, ['product_id', 'id', 'sku']) ?? productId;

      if (!order || !product) {
        return { order_id: orderIdValue, product_id: productIdValue, valid: false, reason: 'Warranty cannot be verified because imported order or product data is missing.' };
      }

      const deliveryDate = normalizeDate(firstString(order, ['delivery_date', 'delivered_at']));
      const warrantyMonths = firstNumber(product, ['warranty_months', 'warrantyMonths'], 0);
      if (!deliveryDate || warrantyMonths <= 0) {
        return { order_id: orderIdValue, product_id: productIdValue, valid: false, reason: 'Imported product/order data does not define an active warranty period.' };
      }

      if (includesPolicy(kbEntries, ['manufacturing defect', 'defects only']) && !isDefectOrDamage(context)) {
        return { order_id: orderIdValue, product_id: productIdValue, valid: false, reason: 'Imported warranty policy covers defects, but the ticket does not describe a qualifying defect.' };
      }

      const effectiveDate = normalizeDate(asOfDate) ?? new Date().toISOString().slice(0, 10);
      const warrantyEnd = addMonths(deliveryDate, warrantyMonths).toISOString().slice(0, 10);
      return {
        order_id: orderIdValue,
        product_id: productIdValue,
        valid: effectiveDate <= warrantyEnd,
        reason: effectiveDate <= warrantyEnd ? `Warranty active until ${warrantyEnd}.` : `Warranty expired on ${warrantyEnd}.`,
      };
    });
  },

  send_reply: async (ticketId: string, message: string) => {
    return deterministicToolCall(async () => ({ ticket_id: ticketId, sent: true, message }));
  },

  escalate: async (ticketId: string, reason: string, priority: number) => {
    return deterministicToolCall(async () => ({
      ticket_id: ticketId,
      escalated_to: 'human_support',
      status: 'queued_for_agent',
      priority,
      summary: reason,
    }));
  },
};
