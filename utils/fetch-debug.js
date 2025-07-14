// utils/fetch-debug.js

import fetch from 'node-fetch';
import https from 'https';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные из .env

const agent = new https.Agent({
  rejectUnauthorized: false, // ⚠️ отключаем SSL-проверку — только для дебага
});

const method = 'GET';
const path = '/wallet/total_balance';
const baseUrl = 'https://api.gate.io/api/v4';
const url = `${baseUrl}${path}`;
const body = '';
const timestamp = Math.floor(Date.now() / 1000).toString();

const signStr = `${method}\n${path}\n${timestamp}\n${body}`;
const signature = crypto
  .createHmac('sha512', process.env.GATE_API_SECRET)
  .update(signStr)
  .digest('hex');

const headers = {
  KEY: process.env.GATE_API_KEY,
  Timestamp: timestamp,
  SIGN: signature,
  'Content-Type': 'application/json',
};

console.log('[SIGNATURE_DEBUG]', { signStr, signature, timestamp });

fetch(url, {
  method,
  headers,
  agent,
})
  .then(async (res) => {
    const raw = await res.text();
    console.log('\n[RESPONSE]');
    console.log('STATUS:', res.status);
    console.log('HEADERS:', res.headers.raw());
    console.log('BODY:', raw);
  })
  .catch((err) => {
    console.error('\n[FETCH_ERROR]', err.message);
  });
