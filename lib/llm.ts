import { env } from "@/lib/env";
import { truncate } from "@/lib/utils";
import type { RepoMetadata, RepoTreeEntry } from "@/lib/types";

const CREDIT_EXHAUSTED_REGEX =
  /(requires more credits|quota exceeded|resource exhausted|billing has not been enabled)/i;

const SYSTEM_PROMPT = `You reverse-engineer repositories into one synthetic USER prompt.
Return exactly one natural-language prompt between 120 and 200 words.
Keep it outcome-focused, plain language, and avoid over-claiming.
Do not include markdown code fences, lists, labels, or explanations.`;

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function buildUserMessage(metadata: RepoMetadata, tree: RepoTreeEntry[], readme: string) {
  const treeLines = tree.map((entry) => `${entry.type}: ${entry.path}`).join("\n");

  return [
    "Repository metadata:",
    JSON.stringify(
      {
        owner: metadata.owner,
        repo: metadata.repo,
        description: metadata.description,
        stars: metadata.stars,
        language: metadata.language,
        topics: metadata.topics,
        defaultBranch: metadata.defaultBranch,
      },
      null,
      2,
    ),
    "",
    "Top-level and depth-1 file tree:",
    treeLines || "(no files detected)",
    "",
    "README excerpt:",
    truncate(readme, 8000) || "(no README content found)",
  ].join("\n");
}

async function callChatCompletion(url: string, apiKey: string, model: string, userMessage: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
    }),
  });

  const data = (await response.json()) as ChatResponse;

  const content = data.choices?.[0]?.message?.content?.trim();
  if (response.ok && content) {
    return content;
  }

  const message = data.error?.message ?? `LLM request failed with status ${response.status}`;
  const error = new Error(message);
  (error as Error & { status?: number }).status = response.status;
  throw error;
}

export async function generatePromptFromRepo(input: {
  metadata: RepoMetadata;
  tree: RepoTreeEntry[];
  readme: string;
}) {
  const userMessage = buildUserMessage(input.metadata, input.tree, input.readme);

  if (env.openRouterApiKey) {
    try {
      return await callChatCompletion(
        "https://openrouter.ai/api/v1/chat/completions",
        env.openRouterApiKey,
        env.openRouterModel,
        userMessage,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (CREDIT_EXHAUSTED_REGEX.test(msg)) {
        const exhausted = new Error(msg);
        (exhausted as Error & { exhaustedCredits?: boolean }).exhaustedCredits = true;
        throw exhausted;
      }
    }
  }

  if (env.googleAiStudioApiKey) {
    const result = await callChatCompletion(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      env.googleAiStudioApiKey,
      env.googleAiStudioModel,
      userMessage,
    );
    return result;
  }

  throw new Error(
    "No LLM API key configured. Set OPENROUTER_API_KEY or GOOGLE_AI_STUDIO_API_KEY.",
  );
}

export function classifyLlmError(error: unknown): { status: number; message: string } {
  const message = error instanceof Error ? error.message : "LLM generation failed.";

  const exhaustedCredits =
    (error as { exhaustedCredits?: boolean } | undefined)?.exhaustedCredits ||
    CREDIT_EXHAUSTED_REGEX.test(message);

  if (exhaustedCredits) {
    return {
      status: 429,
      message: "Model credits are exhausted. Please browse the library instead.",
    };
  }

  return {
    status: 502,
    message,
  };
}
