import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { LLMProvider, StructuredRequest, StructuredResponse } from "./types";
import { ProviderError } from "./types";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly isFixture = false;
  private client: OpenAI;

  constructor(readonly model: string, apiKey?: string) {
    if (!apiKey) throw new ProviderError("OPENAI_API_KEY is not configured.", false);
    this.client = new OpenAI({ apiKey, maxRetries: 2, timeout: 5 * 60_000 });
  }

  async generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResponse> {
    try {
      const response = await this.client.responses.parse({
        model: this.model,
        instructions: req.system,
        input: req.prompt,
        text: { format: zodTextFormat(req.schema, req.schemaName) },
        max_output_tokens: req.maxTokens ?? 16000,
      });

      if (response.status === "incomplete") {
        throw new ProviderError("The AI response was cut off. Try regenerating.", true);
      }
      if (!response.output_parsed) {
        throw new ProviderError("The AI returned no structured answer or declined the request.", false);
      }
      return {
        data: response.output_parsed,
        model: response.model,
        usage: response.usage
          ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
          : undefined,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
        throw new ProviderError("OpenAI rejected the API key. Check OPENAI_API_KEY.", false);
      }
      if (err instanceof OpenAI.BadRequestError) {
        throw new ProviderError(`OpenAI rejected the request: ${err.message}`, false);
      }
      if (err instanceof OpenAI.RateLimitError) {
        throw new ProviderError("OpenAI rate limit or quota reached. Check billing and retry.", true);
      }
      if (err instanceof OpenAI.APIError) {
        throw new ProviderError(`OpenAI error (${err.status ?? "network"}): ${err.message}`, true);
      }
      throw err;
    }
  }
}
