import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export function getAnthropicModel(model: string, apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic(String(model));
}

export function getOpenAIModel(model: string, apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });

  return openai(model);
}

export function getOllamaModel(model: string, baseurl: string) {

  const ollama = createOpenAI({
    baseURL: baseurl,
    apiKey: "EMPTY",
  });

  return ollama(String(model));
}


