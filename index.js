// index.js с ручной генерацией подписи в правильном порядке

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

const API_KEY = 'zH55wLV3rxfrB9oEf9eRxf';
const API_SECRET = 'cxakp_XJds6kb6UkJMePdYR6Hese';
const BASE_URL = 'https://api.crypto.com/v2';

let lastNonce = 0;
function getNonce() {
  const now = Date.now();
  if (now <= lastNonce) lastNonce += 1;
  else lastNonce = now;
  return lastNonce;
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Crypto Dashboard API is running ✅');
});

app.get('/api/balances-debug', async (req, res) => {
  try {
    const timestamp = getNonce();
    const method = 'private/get-account-summary';

    const baseBody = {
      id: timestamp,
      method: method,
      api_key: API_KEY,
      nonce: timestamp,
      params: {}
    };

    const payload = JSON.stringify(baseBody);
    const signature = crypto.createHmac('sha256', API_SECRET)
      .update(payload)
      .digest('hex');

    const finalBody = {
      ...baseBody,
      sig: signature
    };

    const response = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalBody)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('DEBUG ERROR:', err);
    res.status(500).json({ error: 'Failed to debug balances' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Crypto Dashboard API listening on http://localhost:${PORT}`);
});
