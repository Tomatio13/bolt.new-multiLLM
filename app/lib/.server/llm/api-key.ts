import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY;
}

export function getOpenAIAPIKey(cloudflareEnv: Env) {
  return env.OPENAI_API_KEY || cloudflareEnv.OPENAI_API_KEY;
}

export function getOllamBaseUrl(cloudflareEnv: Env){
  return env.OLLAMA_BASE_URL || cloudflareEnv.OLLAMA_BASE_URL;
}