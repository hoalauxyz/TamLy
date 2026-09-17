export interface AppConfig {
  port: number;
  host: string;
  dbPath: string;
  llm: { baseUrl: string; apiKey?: string; model: string } | null;
  llmDisabled: boolean;
  chatDailyLimit: number;
  adminToken: string;
  storeCrisisText: boolean;
  chatRetentionDays: number;
  adsEnabled: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const baseUrl = env.LLM_BASE_URL?.trim();
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? '0.0.0.0',
    dbPath: env.DB_PATH ?? './data/tamly.dev.sqlite',
    llm: baseUrl ? { baseUrl, apiKey: env.LLM_API_KEY || undefined, model: env.LLM_MODEL ?? 'gpt-4o-mini' } : null,
    llmDisabled: env.LLM_DISABLED === '1' || env.LLM_DISABLED === 'true',
    chatDailyLimit: Number(env.CHAT_DAILY_LIMIT ?? 0),
    adminToken: env.ADMIN_TOKEN ?? 'change-me',
    storeCrisisText: env.STORE_CRISIS_TEXT === '1',
    chatRetentionDays: Number(env.CHAT_RETENTION_DAYS ?? 30),
    adsEnabled: env.ADS_ENABLED !== '0',
  };
}
