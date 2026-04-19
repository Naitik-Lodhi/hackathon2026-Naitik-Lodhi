import { GoogleGenerativeAI } from "@google/generative-ai"; // 1. Use the correct import
import { LLMProvider, LLMResponse } from "../types";

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  lastStatus: 'active' | 'unavailable' | 'quota_exceeded' = 'unavailable';
  lastMessage = 'Not called';
  private genAI: GoogleGenerativeAI; // 2. Rename for clarity

  constructor() {
    // 3. Ensure your API Key is actually being loaded
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing from .env file");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async listAvailableModels() {
  const response = await fetch(`https://googleapis.com{process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log("AVAILABLE MODELS:", JSON.stringify(data, null, 2));
}

  async analyze(content: string): Promise<LLMResponse | null> {
    try {
      // 4. Use getGenerativeModel on the genAI instance
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 

      const prompt = `
You are a support reasoning agent.
STRICT RULES:
- Return ONLY valid JSON
- No extra text outside JSON
Format:
{
  "category": "refund | cancellation | shipping | warranty | general_query | ambiguous",
  "entities": {
    "order_id": "string | null",
    "email": "string | null",
    "product_id": "string | null"
  },
  "reasoning": "clear explanation",
  "confidence": 0.9
}

Ticket:
${content}`;

      // 5. Call generateContent directly from the model object
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) return null;

      // Your existing JSON parsing logic
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      const jsonString = text.slice(start, end + 1);
      const parsed = JSON.parse(jsonString);

      this.lastStatus = 'active';
      this.lastMessage = 'LLM active: gemini';
      return parsed;

    } catch (err: any) {
      const message = String(err?.message ?? err);
      // Fixed regex to avoid triggering on the word "models" in the 404 error
      this.lastStatus = /quota|429|resource_exhausted/i.test(message) ? 'quota_exceeded' : 'unavailable';
      console.error("Gemini Provider Error:", message);
      return null;
    }
  }
}
