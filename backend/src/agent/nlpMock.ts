/**
 * Deterministic NLP Mocks for classification and entity extraction.
 */

export const classifyTicket = (content: string): 'refund' | 'cancellation' | 'shipping' | 'warranty' | 'general_query' | 'ambiguous' => {
    const text = content.toLowerCase();
    
    if (text.includes('refund') || text.includes('double charged') || text.includes('money back')) {
        return 'refund';
    }
    if (text.includes('cancel')) {
        return 'cancellation';
    }
    if (text.includes('shipping') || text.includes('tracking') || text.includes('where is')) {
        return 'shipping';
    }
    if (text.includes('broken') || text.includes('battery') || text.includes('warranty')) {
        return 'warranty';
    }
    if (text.includes('stock') || text.includes('apply a discount')) {
        return 'general_query';
    }
    if (text.includes('escalate') || text.includes('manager')) {
        return 'ambiguous';
    }

    return 'ambiguous';
};


export const extractEntities = (content: string) => {
    // Highly deterministic mocks for demo purposes. 
    // Usually uses RegEx or LLMs, here we just extract fake IDs consistently if keywords exist.
    const text = content.toLowerCase();
    
    let email = null;
    let order_id = null;
    let product_id = null;

    // Simulate finding an email
    if (text.includes('@')) {
        const match = content.match(/\S+@\S+\.\S+/);
        if (match) email = match[0];
    } else {
        // Fallback fake deterministic mappings
        email = "customer+" + Math.floor(Math.random() * 1000) + "@mock.com";
    }

    // finding an order ID (#123)
    const orderMatch = content.match(/#(\d+)/);
    if (orderMatch) {
        order_id = 'order-' + orderMatch[1];
    } else {
        // Deterministic fallback based on length or just a generic order
        order_id = 'order-' + (content.length % 1000);
    }

    if (text.includes('headphones') || text.includes('battery')) {
        product_id = 'prod-audio-01';
    }

    return { email, order_id, product_id };
};
