import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getOpenAIModel(model: string, apiKey: string) {
  const openai = createOpenAI({
    apiKey,
  });

  return openai(model);
}

export function getOllamaModel(model: string, baseurl: string) {

  const ollama = createOllama({
    baseURL: baseurl,
  });

  return ollama(String(model));
}


