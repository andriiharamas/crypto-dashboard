// gate-autobuy.js (v2.2.2 with CORS middleware)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { logInfo, logError } from './utils/logger.js';
import {
  checkNewTickers,
  getWatcherStatus,
  setWatcherActive,
  setBuyAmount,
  setSellRules
} from './data/ticker-watcher.js';

dotenv.config();

const app = express();
const PORT = 3002;

// ✅ CORS middleware (мы теперь на одном сервере, разрешаем все источники)
app.use(cors({
  origin: '*', // Разрешаем все источники
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

app.get('/api/gate/status', (req, res) => {
  logInfo('GET /status');
  try {
    const status = getWatcherStatus();
    res.json({ success: true, status });
  } catch (e) {
    logError('Status error', e);
    res.status(500).json({ success: false, error: 'Status unavailable' });
  }
});

app.post('/api/gate/start', (req, res) => {
  logInfo('POST /start');
  try {
    setWatcherActive(true);
    res.json({ success: true, message: 'Auto-trading started' });
  } catch (e) {
    logError('Start error', e);
    res.status(500).json({ success: false });
  }
});

app.post('/api/gate/stop', (req, res) => {
  logInfo('POST /stop');
  try {
    setWatcherActive(false);
    res.json({ success: true, message: 'Auto-trading stopped' });
  } catch (e) {
    logError('Stop error', e);
    res.status(500).json({ success: false });
  }
});

app.post('/api/gate/config', (req, res) => {
  logInfo('POST /config', req.body);
  try {
    const { buyAmount, sellUp, sellDown, sellPercent } = req.body;
    const result = {};

    if (buyAmount !== undefined) {
      if (isNaN(buyAmount)) {
        return res.status(400).json({ success: false, error: 'Invalid buyAmount' });
      }
      setBuyAmount(parseFloat(buyAmount));
      result.buyAmount = buyAmount;
    }

    if (sellUp !== undefined || sellDown !== undefined || sellPercent !== undefined) {
      const up = parseFloat(sellUp);
      const down = parseFloat(sellDown);
      const percent = parseFloat(sellPercent);
      if (isNaN(up) || isNaN(down) || isNaN(percent)) {
        return res.status(400).json({ success: false, error: 'Invalid sell rules' });
      }
      setSellRules(up, down, percent);
      result.sellUp = up;
      result.sellDown = down;
      result.sellPercent = percent;
    }

    res.status(200).json({ success: true, message: 'Config updated', config: result });
  } catch (e) {
    logError('Config error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/gate/logs', (req, res) => {
  logInfo('GET /logs');
  try {
    const LOG_PATH = './logs/events.log';
    if (!fs.existsSync(LOG_PATH)) return res.json({ success: true, logs: [] });

    const rawLines = fs.readFileSync(LOG_PATH, 'utf8').trim().split('\n').reverse();
    const filtered = rawLines.filter(line => line.includes('[BUY]') || line.includes('[SELL]')).slice(0, 30);

    const parsed = filtered.map(line => {
      const match = line.match(/^\[(.+?)\] \[(BUY|SELL)] (.+)$/);
      return match ? { time: match[1], type: match[2], detail: match[3] } : null;
    }).filter(Boolean);

    res.json({ success: true, logs: parsed });
  } catch (e) {
    logError('Logs error', e);
    res.status(500).json({ success: false });
  }
});

// Проверка новых тикеров каждую минуту
setInterval(() => {
  logInfo('Running checkNewTickers() interval');
  checkNewTickers();
}, 5 * 60 * 1000); // раз в 5 минут

// Запуск сервера
app.listen(PORT, () => {
  logInfo('API_READY', `🚀 Gate AutoBuyer API running on port ${PORT}`);
  console.log(`🚀 Gate AutoBuyer API running on port ${PORT}`);
});
