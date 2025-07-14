import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const GATE_API = 'https://api.gateio.ws/api/v4';

// ⛏️ Корректная подпись (3 строки)
function signRequest(secret, method, path) {
  const signatureBase = `${method}\n${path}\n\n`;
  return crypto.createHmac('sha512', secret).update(signatureBase).digest('hex');
}

// Получение баланса
export async function getBalanceDirect() {
  const method = 'GET';
  const path = '/wallet/total_balance';
  const fullUrl = `${GATE_API}${path}`;
  const signature = signRequest(process.env.GATE_API_SECRET, method, path);

  console.log(`[${new Date().toISOString()}] Requesting balance from: ${fullUrl}`);
  console.log(`[${new Date().toISOString()}] Signature: ${signature}`);

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'KEY': process.env.GATE_API_KEY,
        'Sign': signature,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`[${new Date().toISOString()}] Response from API:`, response.data);
    return response.data;

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error during API request:`, err.message);
    return {
      error: 'Request failed',
      details: err.message
    };
  }
}

// Проверка IP сервера
export async function getExternalIP() {
  try {
    const response = await axios.get('https://httpbin.org/ip');
    console.log(`[${new Date().toISOString()}] Outbound IP detected:`, response.data);
    return response.data;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to get external IP:`, err.message);
    return { error: 'Could not determine external IP' };
  }
}
