import { query } from '../db/db';

const deterministicToolCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  return fn();
};

const normalizeDate = (dateValue?: string | Date | null) => {
  if (!dateValue) return null;
  const iso = typeof dateValue === 'string' ? dateValue : dateValue.toISOString();
  return iso.slice(0, 10);
};

const addMonths = (dateValue: string | Date, months: number) => {
  const date = typeof dateValue === 'string' 
    ? new Date(`${dateValue.slice(0, 10)}T00:00:00Z`)
    : new Date(dateValue);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

const isDefectOrDamage = (context?: string | null) => {
  const text = (context ?? '').toLowerCase();
  return ['defect', 'defective', 'broken', 'stopped working', 'damaged', 'cracked', 'wrong item', 'wrong size', 'wrong colour', 'wrong color'].some(term => text.includes(term));
};

const findCustomerByEmail = async (email?: string | null) => {
  console.log("DB FETCH: findCustomerByEmail", email);
  if (!email) return null;
  const result = await query(
    `SELECT * FROM customers WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

const findCustomerById = async (customerId?: string | null) => {
  console.log("DB FETCH: findCustomerById", customerId);
  if (!customerId) return null;
  const result = await query(
    `SELECT * FROM customers WHERE customer_id = $1 LIMIT 1`,
    [customerId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

const findOrder = async (identifier?: string | null, customerEmail?: string | null) => {
  console.log("DB FETCH: findOrder", { identifier, customerEmail });
  
  if (identifier) {
    // If we have an ID, find it but verify it belongs to the email if provided
    const result = await query(
      `SELECT o.*, c.email as customer_email 
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = $1 LIMIT 1`,
      [identifier],
    );
    const order = result.rows[0];
    if (order) {
      if (customerEmail && order.customer_email.toLowerCase() !== customerEmail.toLowerCase()) {
        console.warn(`Order ${identifier} does not belong to ${customerEmail}`);
        return null; // Security check failed
      }
      return order;
    }
  }

  if (customerEmail) {
    const result = await query(
      `SELECT o.* FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE lower(c.email) = lower($1)
       ORDER BY o.order_date DESC LIMIT 1`,
      [customerEmail],
    );
    if (result.rows[0]) return result.rows[0];
  }

  return null;
};

const findProductById = async (productId?: string | null) => {
  console.log("DB FETCH: findProductById", productId);
  if (!productId) return null;
  const result = await query(
    `SELECT * FROM products WHERE product_id = $1 LIMIT 1`,
    [productId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

const getKbEntries = async (queryText?: string | null) => {
  console.log("DB FETCH: getKbEntries", queryText);
  const text = queryText ?? '';
  const result = await query(
    `SELECT * FROM knowledge_base
     WHERE $1 = '' OR title ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%'
     ORDER BY id ASC
     LIMIT 10`,
    [text],
  );
  return result.rows;
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
          title: entry.title,
          excerpt: entry.content.substring(0, 500),
        })),
      };
    });
  },

  check_refund_eligibility: async (orderId: string | null, customerEmail?: string | null, context?: string | null, asOfDate?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId, customerEmail);
      const customer = await findCustomerById(order.customer_id);
      const product = await findProductById(order.product_id);
      const kbEntries = await getKbEntries('refund return damaged defective');
      
      const effectiveDate = normalizeDate(asOfDate) ?? new Date().toISOString().slice(0, 10);
      const returnDeadline = normalizeDate(order.return_deadline);

      if (order.refund_status === 'refunded') {
        return { order_id: order.order_id, eligible: false, reason: 'Refund has already been processed for this order.' };
      }

      const policyText = kbEntries.map(e => e.content).join('\n').toLowerCase();

      if (policyText.includes('non-returnable') && (order.notes?.toLowerCase().includes('non-returnable') || product.notes?.toLowerCase().includes('non-returnable'))) {
        return { order_id: order.order_id, eligible: false, reason: 'Product or order is marked as non-returnable.' };
      }

      if (isDefectOrDamage(context) && (policyText.includes('damaged') || policyText.includes('defective'))) {
        return { order_id: order.order_id, eligible: true, reason: 'Policy allows refunds for damaged or defective items.' };
      }

      if (returnDeadline && effectiveDate <= returnDeadline) {
        return { order_id: order.order_id, eligible: true, reason: `Within return window ending ${returnDeadline}.` };
      }

      if (customer.tier === 'vip' && customer.notes?.toLowerCase().includes('extended return')) {
        return { order_id: order.order_id, eligible: true, reason: 'VIP customer with pre-approved extended return exception.' };
      }

      return { order_id: order.order_id, eligible: false, reason: returnDeadline ? `Return deadline expired on ${returnDeadline}.` : 'No return deadline found.' };
    });
  },

  issue_refund: async (orderId: string, amount: number) => {
    console.log("DB FETCH: issue_refund", { orderId, amount });
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId);
      if (!order) throw new Error(`Cannot refund: Order ${orderId} not found.`);
      if (order.refund_status === 'refunded') throw new Error(`Cannot refund: Order ${orderId} already refunded.`);
      
      return {
        order_id: orderId,
        amount,
        status: 'processed',
        transaction_id: `refund-${orderId}`,
      };
    });
  },

  cancel_order: async (orderId: string | null, customerEmail?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId, customerEmail);
      if (!order) return { order_id: orderId, cancelled: false, reason: 'Order not found or access denied.' };
      
      const status = order.status;
      
      if (status === 'processing') {
        return { order_id: order.order_id, cancelled: true, status: 'cancelled', reason: 'Order was in processing and has been cancelled.' };
      }
      return { order_id: order.order_id, cancelled: false, reason: `Order status is ${status}; it cannot be cancelled.` };
    });
  },

  check_warranty: async (orderId: string | null, productId: string | null, asOfDate?: string | null, context?: string | null) => {
    return deterministicToolCall(async () => {
      const order = await findOrder(orderId);
      const product = await findProductById(productId || order.product_id);
      
      const deliveryDate = normalizeDate(order.delivery_date);
      const warrantyMonths = product.warranty_months || 0;

      if (!deliveryDate || warrantyMonths <= 0) {
        return { order_id: order.order_id, product_id: product.product_id, valid: false, reason: 'No active warranty period found.' };
      }

      const effectiveDate = normalizeDate(asOfDate) ?? new Date().toISOString().slice(0, 10);
      const warrantyEnd = addMonths(deliveryDate, warrantyMonths).toISOString().slice(0, 10);
      
      return {
        order_id: order.order_id,
        product_id: product.product_id,
        valid: effectiveDate <= warrantyEnd,
        reason: effectiveDate <= warrantyEnd ? `Warranty active until ${warrantyEnd}.` : `Warranty expired on ${warrantyEnd}.`,
      };
    });
  },

  send_reply: async (ticketId: string, message: string) => {
    console.log("DB FETCH: send_reply", { ticketId });
    return deterministicToolCall(async () => ({ ticket_id: ticketId, sent: true, message }));
  },

  escalate: async (ticketId: string, reason: string, priority: number) => {
    console.log("DB FETCH: escalate", { ticketId, reason, priority });
    return deterministicToolCall(async () => ({
      ticket_id: ticketId,
      escalated_to: 'human_support',
      status: 'queued_for_agent',
      priority,
      summary: reason,
    }));
  },
};
