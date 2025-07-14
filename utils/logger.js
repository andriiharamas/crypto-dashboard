// ✅ Рекомендуемый способ: utils/logger.js
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve('./logs/events.log');

export function logInfo(tag, payload) {
  const timestamp = new Date().toISOString();
  const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
  fs.appendFileSync(LOG_PATH, `[${timestamp}] [${tag}] ${message}\n`);
}

export function logError(tag, error) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.stack : JSON.stringify(error);
  fs.appendFileSync(LOG_PATH, `[${timestamp}] [${tag}] ${message}\n`);
}
