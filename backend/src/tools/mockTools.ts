/**
 * Tool Mocks for Autonomous Support Resolution Agent
 * These functions simulate real external integrations with random failures to test agent resilience.
 */

// Helper to simulate latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Randomly throw errors to test failure handlers
const withFailureProbability = async <T>(fn: () => Promise<T>, failureRate = 0.3): Promise<T> => {
  await delay(Math.random() * 800 + 200); // 200 - 1000ms latency
  
  if (Math.random() < failureRate) {
    const errorTypes = ['TimeoutError', 'NetworkError', 'MalformedData'];
    const type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    throw new Error(`Simulated Tool Failure [${type}]: Unable to complete operation`);
  }
  
  return fn();
};

export const tools = {
  get_customer: async (customerId: string) => {
    return withFailureProbability(async () => {
      // Mock lookup logic
      return { id: customerId, name: 'John Doe', email: 'john@example.com', status: 'active' };
    }, 0.2); // 20% fail rate
  },
  
  get_order: async (orderId: string) => {
    return withFailureProbability(async () => {
      return { id: orderId, customer_id: 'cust-123', product_id: 'prod-999', status: 'delivered', total_amount: 149.99 };
    }, 0.2);
  },
  
  get_product: async (productId: string) => {
    return withFailureProbability(async () => {
      return { id: productId, name: 'Wireless Headphones', price: 149.99, stock: 45 };
    }, 0.1);
  },
  
  search_knowledge_base: async (query: string) => {
    return withFailureProbability(async () => {
      return {  results: [{ title: 'Refund Policy', excerpt: 'Refunds within 30 days are accepted unconditionally.' }] };
    }, 0.3);
  },
  
  check_refund_eligibility: async (orderId: string) => {
    return withFailureProbability(async () => {
      // randomly return true/false
      const isEligible = Math.random() > 0.5;
      return { order_id: orderId, eligible: isEligible, reason: isEligible ? 'Within 30 days' : 'Past 30 days policy' };
    }, 0.2);
  },
  
  issue_refund: async (orderId: string, amount: number) => {
    return withFailureProbability(async () => {
      return { order_id: orderId, amount, status: 'processed', transaction_id: 'txn_' + Date.now() };
    }, 0.4); // 40% fail rate - refunds are tricky
  },
  
  send_reply: async (ticketId: string, message: string) => {
    return withFailureProbability(async () => {
      return { ticket_id: ticketId, sent: true, delivered_at: new Date().toISOString() };
    }, 0.1);
  },
  
  escalate: async (ticketId: string, reason: string) => {
    return withFailureProbability(async () => {
      return { ticket_id: ticketId, escalated_to: 'human_support', status: 'queued_for_agent' };
    }, 0.05);
  }
};
