/**
 * Deterministic NLP Mocks for classification and entity extraction.
 */

export const classifyTicket = (content: string): 'refund' | 'cancellation' | 'shipping' | 'warranty' | 'general_query' | 'ambiguous' => {
    const text = content.toLowerCase();

    if (text.includes('cancel')) {
        return 'cancellation';
    }
    if (text.includes('where is') || text.includes('tracking') || text.includes('in transit') || text.includes('shipping')) {
        return 'shipping';
    }
    if (text.includes('warranty') || text.includes('stopped working') || text.includes('is broken') || text.includes('isnt working') || text.includes("isn't working")) {
        return 'warranty';
    }
    if (text.includes('refund') || text.includes('return') || text.includes('replacement') || text.includes('wrong size') || text.includes('wrong colour') || text.includes('wrong color') || text.includes('wrong item') || text.includes('damaged') || text.includes('cracked') || text.includes('double charged')) {
        return 'refund';
    }
    if (text.includes('policy') || text.includes('how long') || text.includes('exchange') || text.includes('what is your return')) {
        return 'general_query';
    }

    return 'ambiguous';
};

export const extractEntities = (content: string) => {
    const text = content.toLowerCase();
    
    let email: string | null = null;
    let order_id: string | null = null;
    let product_id: string | null = null;

    const emailMatch = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    email = emailMatch ? emailMatch[0].toLowerCase() : null;

    const orderMatch = content.match(/\bORD-\d{4,}\b/i);
    order_id = orderMatch ? orderMatch[0].toUpperCase() : null;

    const productMatch = content.match(/\bP\d{3,}\b/i);
    product_id = productMatch ? productMatch[0].toUpperCase() : null;

    return { email, order_id, product_id };
};
