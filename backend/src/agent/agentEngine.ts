import { getClient } from '../db/db';
import { tools } from '../tools/mockTools';
import { Ticket } from '../types';
import { classifyTicket, extractEntities } from './nlpMock';
import { getLLMProvider } from '../ai/llmService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processTicket = async (ticket: Ticket) => {
    const client = await getClient();
    try {
        await client.query(`UPDATE tickets SET status = 'processing', updated_at = NOW() WHERE id = $1`, [ticket.id]);
        await client.query(`INSERT INTO ticket_runs (ticket_id, status) VALUES ($1, 'started')`, [ticket.id]);

        // PHASE 1: COGNITIVE ANALYSIS (Provider-Agnostic AI)
        const llmProvider = getLLMProvider();
        const llmResult = llmProvider ? await llmProvider.analyze(ticket.content) : null;
        
        let category: any;
        let entities: any;
        let reasoning = "";
        let confidence = 0;
        let usedAI = false;
        let providerName = llmProvider?.name || 'none';

        if (llmResult && llmResult.confidence >= 0.6) {
            category = llmResult.category;
            entities = llmResult.entities;
            reasoning = llmResult.reasoning;
            confidence = llmResult.confidence;
            usedAI = true;
            console.log(`✨ AI Enhancement Active | Provider: ${providerName.toUpperCase()} | Confidence: ${confidence}`);
        } else {
            console.log(`⚠️ AI Confidence Low (${llmResult?.confidence || 0}) or failed. Falling back to rules.`);
            category = classifyTicket(ticket.content);
            entities = extractEntities(ticket.content);
        }

        // Log AI Analysis to Audit
        await client.query(`
            INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
            VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
        `, [
            ticket.id, 
            0, 
            'llm_analysis', 
            JSON.stringify({ content: ticket.content, provider: providerName }), 
            JSON.stringify({ category, reasoning, confidence }), 
            'success', 
            usedAI ? `AI (${providerName}) Classified as ${category.toUpperCase()} | Reasoning: ${reasoning}` : 'Fallback to Rule-Based Engine'
        ]);

        console.log(`🤖 Agent thinking for ${ticket.id.substring(0, 8)}...`);
        console.log(`📋 Final Category: ${category.toUpperCase()} | Source: ${usedAI ? 'AI' : 'RULES'}`);
        console.log(`🔎 Entities: ${JSON.stringify(entities)}`);

        // Required Dynamic Tool Chain Construction
        const executionPlan: Array<{ name: keyof typeof tools; args: any[] }> = [
            { name: 'get_customer', args: [entities.email] },
            { name: 'get_order', args: [entities.order_id] },
            { name: 'search_knowledge_base', args: [category] }
        ];

        if (category === 'refund') {
            executionPlan.push({ name: 'check_refund_eligibility', args: [entities.order_id] });
        }

        let stepIndex = 1;
        let chainFailed = false;
        let refundEligible = false;
        
        let confidenceScore: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

        for (const action of executionPlan) {
            let attempt = 1;
            const maxAttempts = 3;
            let stepSuccess = false;

            while (attempt <= maxAttempts && !stepSuccess) {
                try {
                    const toolFn = tools[action.name];
                    // @ts-ignore
                    const result = await toolFn(...action.args);
                    
                    const decision = 'Step succeeded, continuing process';
                    
                    await client.query(`
                        INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [ticket.id, stepIndex, action.name, JSON.stringify(action.args), JSON.stringify(result), 'success', attempt, decision]);

                    stepSuccess = true;
                    
                    // Specific logic hook for refund parsing
                    if (action.name === 'check_refund_eligibility' && result && (result as any).eligible) {
                        refundEligible = true;
                    }
                } catch (err: any) {
                     const decision = attempt < maxAttempts ? `Retrying... (${attempt}/${maxAttempts - 1})` : 'Tool failed permanently, aborting agent chain';
                     await client.query(`
                        INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [ticket.id, stepIndex, action.name, JSON.stringify(action.args), JSON.stringify({ error: err.message }), 'failure', attempt, decision]);

                    if (attempt < maxAttempts) {
                        confidenceScore = 'MEDIUM'; // Downgrade confidence slightly upon retries
                        await sleep(100 * Math.pow(2, attempt - 1));
                        attempt++;
                    } else {
                        break; 
                    }
                }
            }

            if (!stepSuccess) {
                chainFailed = true;
                confidenceScore = 'LOW';
                break; 
            }
            stepIndex++;
        }

        let finalStatus = 'escalated';

        if (!chainFailed) {
            if (category === 'refund' && refundEligible) {
                stepIndex = await executeActionStep(client, ticket.id, 'issue_refund', [entities.order_id, 99.99], stepIndex);
                stepIndex = await executeActionStep(client, ticket.id, 'send_reply', [ticket.id, "Your refund has been processed automatically."], stepIndex);
                finalStatus = 'resolved';
            } else if (category === 'refund' && !refundEligible) {
                stepIndex = await executeActionStep(client, ticket.id, 'send_reply', [ticket.id, "Unfortunately, you are not eligible for a refund according to our policy."], stepIndex);
                finalStatus = 'resolved';
            } else if (!entities.email || !entities.order_id) {
                // missing data
                 confidenceScore = 'LOW';
                 stepIndex = await executeActionStep(client, ticket.id, 'escalate', [ticket.id, "Missing critical entity data. Escalating immediately."], stepIndex);
                 finalStatus = 'escalated';
            } else {
                 stepIndex = await executeActionStep(client, ticket.id, 'send_reply', [ticket.id, "We have received your query and resolved it automatically based on our KB procedures."], stepIndex);
                 finalStatus = 'resolved';
            }
        } else {
            // failed tools
            confidenceScore = 'LOW';
            stepIndex = await executeActionStep(client, ticket.id, 'escalate', [ticket.id, "Repeated tool failure. Escalating to human."], stepIndex);
            finalStatus = 'escalated';
        }

        // Final decision log to append confidence visually per instructions
        await client.query(`
            INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
            VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
        `, [ticket.id, stepIndex, 'finalize_decision', JSON.stringify({ finalStatus }), JSON.stringify({ confidenceScore }), 'success', `Decision: ${finalStatus.toUpperCase()} | Confidence: ${confidenceScore}`]);

        console.log(`🎯 Final Decision for ${ticket.id.substring(0, 8)}: ${finalStatus.toUpperCase()} (${confidenceScore})`);

        await client.query(`UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`, [finalStatus, ticket.id]);
        await client.query(`UPDATE ticket_runs SET status = 'completed', ended_at = NOW() WHERE ticket_id = $1 AND status = 'started'`, [ticket.id]);

    } catch (error) {
        console.error('Critical failure processing ticket', ticket.id, error);
        await client.query(`UPDATE tickets SET status = 'escalated', updated_at = NOW() WHERE id = $1`, [ticket.id]);
    } finally {
        client.release();
    }
};

const executeActionStep = async (client: any, ticketId: string, actionName: keyof typeof tools, args: any[], stepIndex: number) => {
    let attempt = 1;
    let success = false;
    while(attempt <= 3 && !success) {
        try {
            const toolFn = tools[actionName];
            // @ts-ignore
            const result = await toolFn(...args);
            await client.query(`
                INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [ticketId, stepIndex, actionName, JSON.stringify(args), JSON.stringify(result), 'success', attempt, 'Action succeeded']);
            success = true;
        } catch(err: any) {
             const decision = attempt < 3 ? `Retrying... (${attempt}/2)` : 'Final step action failed permanently';
             await client.query(`
                 INSERT INTO audit_logs (ticket_id, step, tool_name, input, output, status, attempt, decision) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             `, [ticketId, stepIndex, actionName, JSON.stringify(args), JSON.stringify({ error: err.message }), 'failure', attempt, decision]);
             
             if (attempt < 3) {
                 await sleep(100 * Math.pow(2, attempt - 1));
                 attempt++;
             } else {
                 break;
             }
        }
    }
    return stepIndex + 1;
}
