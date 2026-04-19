export interface LLMResponse {
  category: string;
  entities: {
    order_id?: string | null;
    email?: string | null;
    product_id?: string | null;
  };
  reasoning: string;
  confidence: number;
}

export interface LLMProvider {
  name: string;
  analyze(content: string): Promise<LLMResponse | null>;
}
