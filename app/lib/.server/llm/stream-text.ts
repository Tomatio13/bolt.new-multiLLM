import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKey, getOpenAIAPIKey,getOllamBaseUrl } from '~/lib/.server/llm/api-key';
import { getAnthropicModel, getOpenAIModel,getOllamaModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { ollama } from 'ollama-ai-provider'

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

export function streamText(messages: Messages, env: Env, model: string, options?: StreamingOptions) {
  return _streamText({
    model: getAnthropicModel(model,getAPIKey(env)),
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
    messages: convertToCoreMessages(messages),
    ...options,
  });
}

export function streamTextOpenAI(messages: Messages, env: Env, model: string, options?: StreamingOptions) {
  return _streamText({
    model: getOpenAIModel(model, getOpenAIAPIKey(env)),
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    headers: {},
    ...options,
  });
}

export function streamTextOllama(messages: Messages, env: Env, model: string, options?: StreamingOptions) {
  return _streamText({
    maxRetries: 5,
    model: getOllamaModel(model, getOllamBaseUrl(env)),
    system: getSystemPrompt(),
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    headers: {},
    ...options,
  });
}


