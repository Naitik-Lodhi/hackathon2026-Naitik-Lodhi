import { GoogleGenAI } from "@google/genai";
import { LLMProvider, LLMResponse } from "../types";

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  lastStatus: 'active' | 'unavailable' | 'quota_exceeded' = 'unavailable';
  lastMessage = 'Not called';
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async analyze(content: string): Promise<LLMResponse | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `
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
`
      });

      const text = response.text;
      console.log(`[Gemini] RAW RESPONSE:`, text);

      if (!text) return null;

      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      const jsonString = text.slice(start, end + 1);
      const parsed = JSON.parse(jsonString);

      if (!parsed.category || parsed.confidence === undefined) {
          throw new Error("Invalid Gemini output structure");
      }

      this.lastStatus = 'active';
      this.lastMessage = 'LLM active: gemini';
      return parsed;
    } catch (err: any) {
      const message = String(err?.message ?? err);
      this.lastStatus = /quota|429|resource_exhausted|rate/i.test(message) ? 'quota_exceeded' : 'unavailable';
      this.lastMessage = this.lastStatus === 'quota_exceeded' ? 'LLM quota exceeded' : 'LLM unavailable, using deterministic mode';
      console.error("Gemini Provider Error:", err);
      return null;
    }
  }
}
