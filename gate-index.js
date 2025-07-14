import express from 'express';
import basicAuth from 'express-basic-auth';
import axios from 'axios';
import { getBalanceDirect } from './utils/gateApiClient.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express(); // ← эта строка должна быть ДО использования app

const PORT = 3000;

// --- Роут для отладки IP ---
app.get('/api/debug/ip', async (req, res) => {
  try {
    const response = await axios.get('https://api64.ipify.org?format=json');
    res.json({ ip: response.data.ip });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve IP', details: err.message });
  }
});

// --- Публичные маршруты ---
app.get('/api/gate/balance', async (req, res) => {
  const timestamp = Date.now().toString();
  console.log(`[${new Date().toISOString()}] Incoming request to /api/gate/balance with timestamp: ${timestamp}`);

  try {
    console.log(`[${new Date().toISOString()}] [TRY DIRECT] Calling getBalanceDirect with timestamp: ${timestamp}`);
    const data = await getBalanceDirect();
    console.log(`[${new Date().toISOString()}] Data received from getBalanceDirect:`, data);

    if (data.error || !data.total || Object.keys(data.total).length === 0) {
      console.warn(`[${new Date().toISOString()}] Primary API failed:`, data.error);
      throw new Error('Primary API failed or returned empty result');
    }

    console.log(`[${new Date().toISOString()}] [SUCCESS] Got direct balance`);
    return res.json({ success: true, source: 'direct', data });
  } catch (err) {
    console.warn(`[${new Date().toISOString()}] [ERROR] Primary API failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve balance',
      details: err.message
    });
  }
});

app.get('/api/gate/tickers', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Incoming request to /api/gate/tickers`);
  try {
    const response = await axios.get('https://api.gateio.ws/api/v4/spot/tickers');
    console.log(`[${new Date().toISOString()}] Response from Gate.io API for tickers:`, response.data);
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [ERROR] /tickers failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Авторизация для остальных маршрутов ---
app.use((req, res, next) => {
  const openPaths = ['/api/gate/balance', '/api/gate/tickers', '/api/debug/ip'];
  if (openPaths.includes(req.path)) return next();
  return basicAuth({
    users: { 'CryptoMan': 'Rs-232vs485' },
    challenge: true
  })(req, res, next);
});

// --- Пример защищённого маршрута ---
app.get('/api/gate/secret', (req, res) => {
  res.json({ message: 'Authorized access to protected route' });
});

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`✅ gate-index.js running on port ${PORT}`);
});
