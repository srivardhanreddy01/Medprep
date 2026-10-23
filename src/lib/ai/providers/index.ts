import "server-only";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { FixtureProvider } from "./fixture";
import type { LLMProvider } from "./types";

export type { LLMProvider } from "./types";
export { ProviderError } from "./types";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

/** Resolves the configured provider from server-side environment variables. */
export function getProvider(): LLMProvider {
  const name = process.env.LLM_PROVIDER ?? "openai";
  switch (name) {
    case "openai":
      return new OpenAIProvider(process.env.LLM_MODEL ?? "gpt-4.1", process.env.OPENAI_API_KEY);
    case "anthropic": {
      const effort = (process.env.LLM_EFFORT ?? "high") as (typeof EFFORTS)[number];
      if (!EFFORTS.includes(effort)) throw new Error(`Invalid LLM_EFFORT "${effort}"`);
      return new AnthropicProvider(process.env.LLM_MODEL ?? "claude-opus-5-5", effort, process.env.ANTHROPIC_API_KEY);
    }
    case "fixture":
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_FIXTURE_PROVIDER !== "true") {
        throw new Error("The fixture LLM provider is for tests only and is disabled in production.");
      }
      return new FixtureProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER "${name}". Supported: openai, anthropic, fixture.`);
  }
}
