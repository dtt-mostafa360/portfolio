export const env = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-pro",
  googleAiStudioApiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
  googleAiStudioModel: process.env.GOOGLE_AI_STUDIO_MODEL ?? "gemini-2.5-pro",
  githubToken: process.env.GITHUB_TOKEN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  externalReverseUrl: process.env.EXTERNAL_REVERSE_URL ?? "http://localhost:3001",
  viewsIpSalt: process.env.VIEWS_IP_SALT,
  nodeEnv: process.env.NODE_ENV,
};

export const isSupabaseEnabled = Boolean(env.supabaseUrl && env.supabasePublishableKey);

export const assertViewsSaltInProduction = () => {
  if (env.nodeEnv === "production" && !env.viewsIpSalt) {
    throw new Error("VIEWS_IP_SALT is required in production for analytics deduplication.");
  }
};
