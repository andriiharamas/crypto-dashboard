// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = 'https://api.crypto.com/v2';

function generateSignature(path, params, apiSecret) {
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});
  
  const qs = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
    
  const payload = path + qs;
  return crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');
}

// 📊 Получение баланса
app.get('/balance', async (req, res) => {
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  const timestamp = Date.now();
  const path = '/private/get-account-summary';
  const params = {
    id: timestamp,
    method: 'private/get-account-summary',
    api_key: apiKey,
    nonce: timestamp,
  };
  const sig = generateSignature(path, params, apiSecret);
  const body = { ...params, sig };

  try {
    const response = await axios.post(`${API_URL}${path}`, body);
    res.json(response.data);
  } catch (error) {
    console.error('Ошибка при получении баланса:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при получении баланса' });
  }
});

// 🔖 Пример запроса цены (публичный, без подписи)
app.get('/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const response = await axios.get(`${API_URL}/public/get-ticker?instrument_name=${symbol}_USDT`);
    res.json(response.data);
  } catch (error) {
    console.error('Ошибка получения цены:', error.message);
    res.status(500).json({ error: 'Ошибка получения цены' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

