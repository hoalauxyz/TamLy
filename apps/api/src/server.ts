import cors from '@fastify/cors';
import Fastify from 'fastify';
import { loadConfig } from './config.ts';
import { Db } from './db.ts';
import { registerRoutes } from './routes.ts';

const config = loadConfig();
const db = new Db(config.dbPath);

const app = Fastify({ logger: { level: 'info' } });
await app.register(cors, { origin: true });

// Không log body request (chứa nội dung nhạy cảm).
app.addHook('onRequest', async (req) => {
  req.log.info({ method: req.method, url: req.url }, 'req');
});

registerRoutes(app, db, config);

// Dọn chat cũ mỗi 6 giờ.
setInterval(() => {
  const n = db.purgeOldChat(config.chatRetentionDays);
  if (n) app.log.info({ purged: n }, 'purged old chat messages');
}, 6 * 3_600_000).unref();

app.get('/health', async () => ({
  ok: true,
  llm: config.llm ? (config.llmDisabled ? 'disabled' : config.llm.model) : 'none (scripted mode)',
}));

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    `TamLy API sẵn sàng. LLM: ${config.llm ? (config.llmDisabled ? 'TẮT (kill-switch)' : config.llm.model) : 'không cấu hình → chế độ kịch bản'}`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
