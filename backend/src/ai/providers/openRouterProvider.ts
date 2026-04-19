import { LLMProvider, LLMResponse } from "../types";

export class OpenRouterProvider implements LLMProvider {
  name = "openrouter";
  lastStatus: 'active' | 'unavailable' | 'quota_exceeded' = 'unavailable';
  lastMessage = 'Not called';

  async analyze(content: string): Promise<LLMResponse | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      this.lastStatus = 'unavailable';
      this.lastMessage = 'LLM unavailable (missing API key)';
      return null;
    }

    try {
      const prompt = `
You are a support reasoning agent.

STRICT RULES:
- Return ONLY valid JSON
- No extra text outside JSON

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // ✅ better stable free model
          model: "meta-llama/llama-3-8b-instruct",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data:any = await response.json();

      // 🔥 DEBUG FULL RESPONSE
      console.log("🔥 FULL OPENROUTER RESPONSE:", JSON.stringify(data, null, 2));

      // ❌ HANDLE API ERRORS FIRST
      if (data.error) {
        console.error("❌ OpenRouter API Error:", data.error);

        if (data.error.code === 429) {
          this.lastStatus = 'quota_exceeded';
          this.lastMessage = 'LLM quota exceeded';
        } else {
          this.lastStatus = 'unavailable';
          this.lastMessage = 'LLM provider error';
        }

        return null;
      }

      // ✅ UNIVERSAL PARSE
      const rawText =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        data.choices?.[0]?.delta?.content;

      if (!rawText) {
        console.error("❌ No content in OpenRouter response");
        this.lastStatus = 'unavailable';
        return null;
      }

      console.log("✅ RAW TEXT:", rawText);

      // 🧠 EXTRACT JSON
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');

      if (start === -1 || end === -1) {
        console.error("❌ JSON not found in LLM response");
        this.lastStatus = 'unavailable';
        return null;
      }

      const jsonString = rawText.slice(start, end + 1);

      let parsed: LLMResponse;
      try {
        parsed = JSON.parse(jsonString);
      } catch (e) {
        console.error("❌ JSON parse failed:", jsonString);
        this.lastStatus = 'unavailable';
        return null;
      }

      // ✅ VALIDATE
      if (!parsed.category || parsed.confidence === undefined) {
        console.error("❌ Invalid structure:", parsed);
        this.lastStatus = 'unavailable';
        return null;
      }

      this.lastStatus = 'active';
      this.lastMessage = 'LLM active: openrouter';

      return parsed;

    } catch (err: any) {
      console.error("❌ OpenRouter Provider Error:", err);

      const message = String(err?.message ?? err);

      this.lastStatus = /quota|429|rate|limit/i.test(message)
        ? 'quota_exceeded'
        : 'unavailable';

      this.lastMessage =
        this.lastStatus === 'quota_exceeded'
          ? 'LLM quota exceeded'
          : 'LLM unavailable, using deterministic mode';

      return null;
    }
  }
}