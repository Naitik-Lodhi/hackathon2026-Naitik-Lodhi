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

const deterministicHash = (value: string) => {
    let hash = 2166136261;
    for (const char of value) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
};

export const extractEntities = (content: string) => {
    const text = content.toLowerCase();
    
    let email: string | null = null;
    let order_id: string | null = null;
    let product_id: string | null = null;

    const emailMatch = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    email = emailMatch ? emailMatch[0].toLowerCase() : `unknown-${deterministicHash(content)}@deterministic.local`;

    const orderMatch = content.match(/\bORD-\d{4}\b/i);
    order_id = orderMatch ? orderMatch[0].toUpperCase() : null;

    if (text.includes('headphone')) product_id = 'P001';
    if (text.includes('running shoe') || text.includes('shoes')) product_id = 'P002';
    if (text.includes('coffee maker') || text.includes('brewmaster')) product_id = 'P003';
    if (text.includes('laptop stand')) product_id = 'P004';
    if (text.includes('yoga mat')) product_id = 'P005';
    if (text.includes('watch')) product_id = 'P006';
    if (text.includes('lamp')) product_id = 'P007';
    if (text.includes('speaker')) product_id = 'P008';

    return { email, order_id, product_id };
};
