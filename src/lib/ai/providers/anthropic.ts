import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { LLMProvider, StructuredRequest, StructuredResponse } from "./types";
import { ProviderError } from "./types";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly isFixture = false;
  private client: Anthropic;

  constructor(
    readonly model: string,
    private effort: Effort,
    apiKey?: string,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 5 * 60_000 });
  }

  async generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResponse> {
    let message;
    try {
      const stream = this.client.beta.messages.stream({
        model: this.model,
        max_tokens: req.maxTokens ?? 32000,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
        output_config: { effort: this.effort, format: betaZodOutputFormat(req.schema) },
        // On a safety-classifier decline, the API re-runs the request on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      message = await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        throw new ProviderError("The AI provider rejected the API key. Check ANTHROPIC_API_KEY.", false);
      }
      if (err instanceof Anthropic.BadRequestError) {
        throw new ProviderError(`The AI provider rejected the request: ${err.message}`, false);
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new ProviderError("The AI provider is rate limiting requests. Try again in a minute.", true);
      }
      if (err instanceof Anthropic.APIError) {
        throw new ProviderError(`AI provider error (${err.status ?? "network"}): ${err.message}`, true);
      }
      throw err;
    }

    if (message.stop_reason === "refusal") {
      throw new ProviderError("The AI declined to answer this question. Try rephrasing or report it.", false);
    }
    if (message.stop_reason === "max_tokens") {
      throw new ProviderError("The AI response was cut off before it finished. Try regenerating.", true);
    }
    const text = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ProviderError("The AI returned malformed JSON.", true);
    }
    return {
      data,
      model: message.model,
      usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
    };
  }
}
