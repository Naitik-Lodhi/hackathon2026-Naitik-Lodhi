import { LLMProvider, LLMResponse } from "../types";

export class OpenRouterProvider implements LLMProvider {
  name = "openrouter";

  async analyze(content: string): Promise<LLMResponse | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API Key missing");
      return null;
    }

    try {
      const prompt = `
You are a support reasoning agent.

STRICT RULES:
- Return ONLY valid JSON
- No extra text outside JSON
- No explanations outside JSON

Format:
{
  "category": "refund | cancellation | shipping | warranty | general_query | ambiguous",
  "entities": {
    "order_id": string | null,
    "email": string | null,
    "product_id": string | null
  },
  "reasoning": "clear explanation of decision",
  "confidence": number (0 to 1)
}

Ticket:
${content}
`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/shop-wave-agent",
          "X-Title": "ShopWave Autonomous Agent"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      console.log(`[OpenRouter] RAW RESPONSE:`, text);

      if (!text) return null;

      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      const jsonString = text.slice(start, end + 1);
      const parsed = JSON.parse(jsonString);

      if (!parsed.category || parsed.confidence === undefined) {
          throw new Error("Invalid OpenRouter output structure");
      }

      return parsed;
    } catch (err) {
      console.error("OpenRouter Provider Error:", err);
      return null;
    }
  }
}
