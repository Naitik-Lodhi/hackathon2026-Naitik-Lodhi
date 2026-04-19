import { PoolClient } from 'pg';
import { getClient } from '../db/db';
import { tools } from '../tools/mockTools';
import { Ticket } from '../types';
import { classifyTicket, extractEntities } from './nlpMock';
import { getLLMProvider } from '../ai/llmService';

type Category = 'refund' | 'cancellation' | 'shipping' | 'warranty' | 'general_query' | 'ambiguous';
type ToolName = keyof typeof tools;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isObject = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object';

const isValidToolOutput = (toolName: ToolName, result: unknown) => {
  if (toolName === 'get_customer') return result === null || (isObject(result) && (Boolean(result.customer_id) || Boolean(result.id) || Boolean(result.email)) && Boolean(result.email));
  if (toolName === 'get_order') return result === null || (isObject(result) && (Boolean(result.order_id) || Boolean(result.id)));
  if (toolName === 'get_product') return result === null || (isObject(result) && (Boolean(result.product_id) || Boolean(result.id) || Boolean(result.name)));
  if (toolName === 'search_knowledge_base') return isObject(result) && Array.isArray(result.results);
  if (toolName === 'check_refund_eligibility') return isObject(result) && typeof result.eligible === 'boolean' && Boolean(result.reason);
  if (toolName === 'check_warranty') return isObject(result) && typeof result.valid === 'boolean' && Boolean(result.reason);
  if (toolName === 'cancel_order') return isObject(result) && typeof result.cancelled === 'boolean' && Boolean(result.reason);
  if (toolName === 'issue_refund') return isObject(result) && result.status === 'processed';
  if (toolName === 'send_reply') return isObject(result) && result.sent === true;
  if (toolName === 'escalate') return isObject(result) && result.status === 'queued_for_agent';
  return true;
};

const executeTool = async (
  client: PoolClient,
  ticketId: string,
  stepIndex: number,
  actionName: ToolName,
  args: any[],
) => {
  let attempt = 1;
  let retries = 0;

  while (attempt <= 3) {
    try {
      const toolFn = tools[actionName] as (...toolArgs: any[]) => Promise<any>;
      const result = await toolFn(...args);
      const valid = isValidToolOutput(actionName, result);
      
      let businessStatus: 'success' | 'failure' | 'denied' = valid ? 'success' : 'failure';
      let decisionText = valid ? 'Tool execution successful.' : 'Malformed tool output.';

      // More descriptive decisions based on tool results
      if (valid) {
        if (actionName === 'check_refund_eligibility') {
          businessStatus = result.eligible ? 'success' : 'denied';
          decisionText = result.eligible ? 'Policy Check: ELIGIBLE' : `Policy Check: DENIED (${result.reason})`;
        } else if (actionName === 'check_warranty') {
          businessStatus = result.valid ? 'success' : 'denied';
          decisionText = result.valid ? 'Warranty Check: VALID' : `Warranty Check: INVALID (${result.reason})`;
        } else if (actionName === 'cancel_order') {
          businessStatus = result.cancelled ? 'success' : 'denied';
          decisionText = result.cancelled ? 'Cancellation: PROCESSED' : `Cancellation: DECLINED (${result.reason})`;
        }
      }

      await client.query(
        `INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ticketId,
          stepIndex,
          actionName,
          JSON.stringify(args),
          JSON.stringify(result),
          businessStatus,
          attempt,
          decisionText,
        ],
      );

      if (!valid) {
        throw new Error(`Invalid output from tool ${actionName}`);
      }

      return { result, valid, retries };
    } catch (err: any) {
      const isValidationError = err.message.includes('Invalid output');
      const retrying = attempt < 3 && !isValidationError;
      
      await client.query(
        `INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ticketId,
          stepIndex,
          actionName,
          JSON.stringify(args),
          JSON.stringify({ error: err.message }),
          'failure',
          attempt,
          retrying ? 'Tool failed; retrying with exponential backoff.' : `Tool failed permanently (${err.message}); escalating.`,
        ],
      );

      if (!retrying) {
        throw new Error(`Permanent tool failure: ${actionName} - ${err.message}`);
      }

      retries += 1;
      await sleep(100 * Math.pow(2, attempt - 1));
      attempt += 1;
    }
  }

  throw new Error(`Exhausted retries for tool ${actionName}`);
};

const priorityLabel = (priority: number) => priority >= 3 ? 'urgent' : priority === 2 ? 'high' : 'medium';

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

const calibrateConfidence = (base: number, missingEntities: number, retries: number, invalidOutputs: number, category: Category) => {
  let score = base;
  score -= missingEntities * 0.14;
  score -= retries * 0.08;
  score -= invalidOutputs * 0.18;
  if (category === 'ambiguous') score -= 0.25;
  score = Math.max(0, Math.min(1, score));
  const label: 'HIGH' | 'MEDIUM' | 'LOW' = score >= 0.78 ? 'HIGH' : score >= 0.6 ? 'MEDIUM' : 'LOW';
  return { score: Number(score.toFixed(2)), label };
};

export const processTicket = async (ticket: Ticket) => {
  const client = await getClient();
  let finalStatus = 'escalated';

  try {
    await client.query(`UPDATE tickets SET status = 'processing', updated_at = NOW() WHERE id = $1`, [ticket.id]);
    await client.query(`INSERT INTO ticket_runs (ticket_id, status) VALUES ($1, 'started')`, [ticket.id]);

    const llmProvider = getLLMProvider();
    const llmResult = llmProvider ? await llmProvider.analyze(ticket.content) : null;
    const ruleEntities = extractEntities(ticket.content);
    const providerName = llmProvider?.name ?? 'none';
    const usedAI = Boolean(llmResult && llmResult.confidence >= 0.6);
    const llmStatus =
      llmResult ? 'active' :
      llmProvider?.lastStatus === 'quota_exceeded' ? 'quota_exceeded' :
      'fallback';
    const llmMessage =
      usedAI ? `LLM active: ${providerName}` :
      llmResult ? `LLM active: ${providerName}; deterministic fallback used due to low confidence` :
      llmProvider?.lastStatus === 'quota_exceeded' ? 'LLM quota exceeded' :
      'LLM unavailable, using deterministic mode';
    console.log(llmMessage);
    let category = (usedAI ? llmResult?.category : classifyTicket(ticket.content)) as Category;
    const entities = {
      ...ruleEntities,
      ...(usedAI ? llmResult?.entities : {}),
      email: (ticket as any).customer_email ?? (usedAI ? llmResult?.entities.email : ruleEntities.email),
      order_id: (usedAI ? llmResult?.entities.order_id : ruleEntities.order_id) ?? ruleEntities.order_id,
      product_id: (usedAI ? llmResult?.entities.product_id : ruleEntities.product_id) ?? ruleEntities.product_id,
    };

    const llmConfidence = usedAI ? llmResult!.confidence : 0.72;
    let retryCount = 0;
    let invalidOutputs = 0;

    await client.query(
      `INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision)
       VALUES ($1, 0, 'llm_analysis', $2, $3, 'success', 1, $4)`,
      [
        ticket.id,
        JSON.stringify({ content: ticket.content, provider: providerName }),
        JSON.stringify({ category, entities, llmConfidence, llmStatus, fallback_used: !usedAI, reasoning: llmResult?.reasoning ?? 'Rule-based deterministic classifier used.' }),
        usedAI ? `AI provider ${providerName} classified the ticket.` : llmMessage,
      ],
    );

    await client.query(
      `UPDATE tickets SET llm_status = $1, fallback_used = $2 WHERE id = $3`,
      [llmStatus, !usedAI, ticket.id],
    );

    const executionPlan: Array<{ name: ToolName; args: any[] }> = [
      { name: 'get_customer', args: [entities.email] },
      { name: 'get_order', args: [entities.order_id ?? entities.email, entities.email] },
      { name: 'search_knowledge_base', args: [category] },
    ];

    if (entities.product_id) {
      executionPlan.push({ name: 'get_product', args: [entities.product_id] });
    }

    const context: Record<string, any> = {};
    let stepIndex = 1;

    for (const action of executionPlan) {
      const outcome = await executeTool(client, ticket.id, stepIndex, action.name, action.args);
      retryCount += outcome.retries;
      if (!outcome.valid) invalidOutputs += 1;
      context[action.name] = outcome.result;
      stepIndex += 1;
    }

    const order = context.get_order;
    const customer = context.get_customer;
    const orderId = firstString(order, ['order_id', 'id']);

    // STRONG VERIFICATION: Check if order exists before any specific logic
    if (!order) {
      await executeTool(client, ticket.id, stepIndex, 'send_reply', [
        ticket.id,
        `I've checked our database but I couldn't find an order matching your details. Could you please provide your Order ID (e.g., ORD-1234) so I can assist you better?`,
      ]);
      finalStatus = 'resolved';
      stepIndex += 1;
    } else if (!customer) {
      await executeTool(client, ticket.id, stepIndex, 'send_reply', [
        ticket.id,
        `I found your order ${orderId}, but I couldn't verify your customer profile. Please ensure you are contacting us from your registered email address.`,
      ]);
      finalStatus = 'resolved';
      stepIndex += 1;
    } else {
      // Data extraction for validated order/customer
      const productId = entities.product_id ?? firstString(order, ['product_id', 'sku']) ?? null;
      if (!context.get_product && productId) {
        const productOutcome = await executeTool(client, ticket.id, stepIndex, 'get_product', [productId]);
        retryCount += productOutcome.retries;
        if (!productOutcome.valid) invalidOutputs += 1;
        context.get_product = productOutcome.result;
        stepIndex += 1;
      }

      const orderAmount = firstNumber(order, ['amount', 'total_amount', 'total'], 0);
      const returnDeadline = firstString(order, ['return_deadline', 'return_by']);
      const deliveryDate = firstString(order, ['delivery_date', 'delivered_at']);
      const productName = firstString(context.get_product, ['name', 'title']) ?? productId;
      const warrantyMonths = firstNumber(context.get_product, ['warranty_months', 'warrantyMonths'], 0);
      const orderStatus = firstString(order, ['status']) ?? 'unknown';
      const orderNotes = firstString(order, ['notes', 'description']) ?? JSON.stringify(order);

      if (category === 'refund' && deliveryDate && warrantyMonths > 0 && /stopped working|manufacturing defect/i.test(ticket.content) && returnDeadline && new Date((ticket as any).created_at) > new Date(`${returnDeadline}T23:59:59Z`)) {
        category = 'warranty';
      }

      if (category === 'cancellation') {
        const cancellation = await executeTool(client, ticket.id, stepIndex, 'cancel_order', [entities.order_id ?? orderId, entities.email]);
        stepIndex += 1;
        const result = cancellation.result;

        if (result?.cancelled) {
          await executeTool(client, ticket.id, stepIndex, 'send_reply', [
            ticket.id,
            `Your order ${orderId} has been cancelled. You will receive confirmation by email within 1 hour.`,
          ]);
          finalStatus = 'resolved';
        } else if (customer.tier === 'premium' || customer.tier === 'vip') {
          await executeTool(client, ticket.id, stepIndex, 'escalate', [
            ticket.id,
            `${customer.tier.toUpperCase()} Customer: Cancellation failed (${result?.reason}). Escalating for manual review.`,
            ticket.priority,
          ]);
          finalStatus = 'escalated';
        } else {
          await executeTool(client, ticket.id, stepIndex, 'send_reply', [
            ticket.id,
            `Order ${orderId} cannot be cancelled because ${result?.reason ?? 'it is not eligible under the cancellation policy'}.`,
          ]);
          finalStatus = 'resolved';
        }
        stepIndex += 1;
      } else if (category === 'warranty') {
        const warranty = await executeTool(client, ticket.id, stepIndex, 'check_warranty', [orderId, productId, (ticket as any).created_at, ticket.content]);
        stepIndex += 1;
        if (warranty.result?.valid) {
          await executeTool(client, ticket.id, stepIndex, 'escalate', [
            ticket.id,
            `Warranty claim for ${productName}: ${warranty.result.reason} Customer reports: ${ticket.content}. Priority: ${priorityLabel(ticket.priority)}.`,
            ticket.priority,
          ]);
          finalStatus = 'escalated';
        } else if (customer.tier === 'premium' || customer.tier === 'vip') {
          await executeTool(client, ticket.id, stepIndex, 'escalate', [
            ticket.id,
            `${customer.tier.toUpperCase()} Customer: Warranty claim invalid (${warranty.result?.reason}). Escalating for manual exception review.`,
            ticket.priority,
          ]);
          finalStatus = 'escalated';
        } else {
          await executeTool(client, ticket.id, stepIndex, 'send_reply', [
            ticket.id,
            `I checked the warranty rules for order ${orderId}. ${warranty.result?.reason ?? 'Warranty coverage could not be verified.'}`,
          ]);
          finalStatus = 'resolved';
        }
        stepIndex += 1;
      }
 else if (category === 'refund') {
        const eligibility = await executeTool(client, ticket.id, stepIndex, 'check_refund_eligibility', [orderId, entities.email, ticket.content, (ticket as any).created_at]);
        stepIndex += 1;
        
        if (eligibility.result?.eligible) {
          if (orderAmount > 200 || /replacement/i.test(ticket.content)) {
            await executeTool(client, ticket.id, stepIndex, 'escalate', [
              ticket.id,
              `Refund/replacement needs human review. Eligibility: ${eligibility.result.reason}. Amount: ${orderAmount}. Priority: ${priorityLabel(ticket.priority)}.`,
              ticket.priority,
            ]);
            finalStatus = 'escalated';
          } else {
            await executeTool(client, ticket.id, stepIndex, 'issue_refund', [orderId, orderAmount]);
            stepIndex += 1;
            await executeTool(client, ticket.id, stepIndex, 'send_reply', [
              ticket.id,
              `Your refund for order ${orderId} has been approved and processed to the original payment method. It usually appears within 5-7 business days.`,
            ]);
            finalStatus = 'resolved';
          }
        } else {
          // Tier-based logic for "denied" cases
          if (customer.tier === 'premium' || customer.tier === 'vip') {
            await executeTool(client, ticket.id, stepIndex, 'escalate', [
              ticket.id,
              `${customer.tier.toUpperCase()} Customer: Automated refund denied (${eligibility.result?.reason}). Escalating for manual policy exception review.`,
              ticket.priority,
            ]);
            finalStatus = 'escalated';
          } else {
            await executeTool(client, ticket.id, stepIndex, 'send_reply', [
              ticket.id,
              `I checked order ${orderId}. This request is not eligible for an automatic refund: ${eligibility.result?.reason ?? 'eligibility could not be confirmed'}.`,
            ]);
            finalStatus = 'resolved';
          }
        }
        stepIndex += 1;
      } else if (category === 'shipping') {
        await executeTool(client, ticket.id, stepIndex, 'send_reply', [
          ticket.id,
          `Order ${orderId} is currently ${orderStatus}. ${orderNotes}`,
        ]);
        finalStatus = 'resolved';
        stepIndex += 1;
      } else if (category === 'general_query') {
        const kbResults = context.search_knowledge_base?.results || [];
        const reply = kbResults.length > 0 
          ? kbResults[0].excerpt 
          : 'Our returns depend on product category. Most items have a 30-day window. Please contact support for specific details.';
        
        await executeTool(client, ticket.id, stepIndex, 'send_reply', [
          ticket.id,
          reply,
        ]);
        finalStatus = 'resolved';
        stepIndex += 1;
      } else {
        await executeTool(client, ticket.id, stepIndex, 'send_reply', [
          ticket.id,
          'Please share the order ID, product name, and what went wrong so I can route this correctly.',
        ]);
        finalStatus = 'resolved';
        stepIndex += 1;
      }
    }

    const missingEntities = [customer, order].filter(value => !value).length;
    const confidence = calibrateConfidence(llmConfidence, missingEntities, retryCount, invalidOutputs, category);

    await client.query(
      `INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision)
       VALUES ($1, $2, 'finalize_decision', $3, $4, 'success', 1, $5)`,
      [
        ticket.id,
        stepIndex,
        JSON.stringify({ finalStatus, category }),
        JSON.stringify({ confidenceScore: confidence.label, confidenceValue: confidence.score, retryCount, invalidOutputs, missingEntities, dataSource: (ticket as any).data_source, llmStatus, fallbackUsed: !usedAI }),
        `Decision: ${finalStatus.toUpperCase()} | Confidence: ${confidence.label}`,
      ],
    );

    await client.query(`UPDATE tickets SET status = $1, llm_status = $2, fallback_used = $3, updated_at = NOW() WHERE id = $4`, [finalStatus, llmStatus, !usedAI, ticket.id]);
    await client.query(`UPDATE ticket_runs SET status = 'completed', ended_at = NOW() WHERE ticket_id = $1 AND status = 'started'`, [ticket.id]);
  } catch (error: any) {
    console.error('Critical failure processing ticket', ticket.id, error);
    
    // Log the failure to audit logs
    try {
      await client.query(
        `INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision)
         VALUES ($1, 999, 'system_error', $2, $3, 'failure', 1, $4)`,
        [
          ticket.id,
          JSON.stringify({ error: error.message }),
          JSON.stringify({ stack: error.stack }),
          `AGENT ESCALATION: ${error.message}`
        ]
      );
    } catch (auditErr) {
      console.error('Failed to log error to audit_logs', auditErr);
    }

    await client.query(`UPDATE tickets SET status = 'escalated', updated_at = NOW() WHERE id = $1`, [ticket.id]);
    await client.query(`UPDATE ticket_runs SET status = 'failed', ended_at = NOW() WHERE ticket_id = $1 AND status = 'started'`, [ticket.id]);
  } finally {
    client.release();
  }
};
