import { GeminiProvider } from "./providers/geminiProvider";
import { OpenRouterProvider } from "./providers/openRouterProvider";
import { LLMProvider } from "./types";

export function getLLMProvider(): LLMProvider | null {
  const useLLM = process.env.USE_LLM === 'true';
  if (!useLLM) return null;

  const providerType = process.env.LLM_PROVIDER || 'gemini';

  switch (providerType.toLowerCase()) {
    case 'openrouter':
      if (!process.env.OPENROUTER_API_KEY) return null;
      return new OpenRouterProvider();
    case 'gemini':
    default:
      if (!process.env.GEMINI_API_KEY) return null;
      return new GeminiProvider();
  }
}

// Deprecated: analyzeTicket will be removed in favor of provider-based calls
export async function analyzeTicket(content: string) {
    const provider = getLLMProvider();
    if (!provider) return null;
    return provider.analyze(content);
}
