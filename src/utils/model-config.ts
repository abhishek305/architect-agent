/**
 * Shared Model Configuration
 * 
 * Centralized LLM provider configuration for all agents.
 * Supports Ollama (local/cloud), Groq, and other providers.
 */

export type ModelConfig = {
  providerId: string;
  modelId: string;
  url: string;
  apiKey: string;
} | string;

/**
 * Get the model configuration based on environment variables.
 * 
 * Priority:
 * 1. Ollama (if USE_OLLAMA=true or OLLAMA_MODEL contains -cloud)
 * 2. Groq (if GROQ_API_KEY is set)
 * 3. Default to Ollama cloud model
 */
export function getModelConfig(): ModelConfig {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const modelName = process.env.OLLAMA_MODEL || 'qwen3-coder:480b-cloud';
  const apiKey = process.env.OLLAMA_API_KEY || 'ollama';

  // Check if we should use Ollama (local or cloud models)
  const useOllama = process.env.USE_OLLAMA === 'true' || 
                    process.env.OLLAMA_MODEL?.includes('-cloud') ||
                    process.env.OLLAMA_BASE_URL;

  if (useOllama) {
    return {
      providerId: 'ollama',
      modelId: modelName,
      url: baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`,
      apiKey: apiKey,
    };
  }

  // Fallback to Groq if GROQ_API_KEY is set
  if (process.env.GROQ_API_KEY) {
    return 'groq/llama-3.3-70b-versatile';
  }

  // Default to Ollama cloud model
  return {
    providerId: 'ollama',
    modelId: 'qwen3-coder:480b-cloud',
    url: 'http://localhost:11434/v1',
    apiKey: 'ollama',
  };
}
