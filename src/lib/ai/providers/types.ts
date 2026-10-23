import type { z } from "zod";

export interface StructuredRequest<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  maxTokens?: number;
}

export interface StructuredResponse {
  /** Raw JSON returned by the model. Callers validate it with their own checks. */
  data: unknown;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  /** True for the deterministic test provider; the UI labels its output. */
  readonly isFixture: boolean;
  generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResponse>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
