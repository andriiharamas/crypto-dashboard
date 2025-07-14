// ticker-watcher.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { logInfo, logError } from '../utils/logger.js'; // путь адаптировать под файл
import dotenv from 'dotenv';
dotenv.config();

const DATA_PATH = './data/tickers.json';
const LOG_PATH = './logs/events.log';
const SELL_CONFIG_PATH = './data/sell-config.json';
const API_URL = 'https://cryptoman.it.com/api/gate/tickers';
const GATE_API = 'https://api.gateio.ws/api/v4';

let isRunning = false;
let buyAmountUSDT = 10;
let sellRules = loadSellConfig();

export function getWatcherStatus() {
  return {
    active: isRunning,
    buyAmountUSDT,
    ...sellRules
  };
}

export function setWatcherActive(state) {
  isRunning = state;
  logEvent('SYSTEM', state ? 'AUTO_TRADE_STARTED' : 'AUTO_TRADE_STOPPED');
}

export function setBuyAmount(amount) {
  buyAmountUSDT = amount;
  logEvent('SYSTEM', `BUY_AMOUNT_SET ${amount}`);
}

export function setSellRules(up, down, percent) {
  sellRules = { sellUp: up, sellDown: down, sellPercent: percent };
  saveSellConfig(up, down, percent);
}

export async function checkNewTickers() {
  if (!isRunning) return;
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (!json || !json.success || !Array.isArray(json.data)) {
      logEvent('ERROR', `INVALID_TICKER_RESPONSE: ${JSON.stringify(json)}`);
      return;
    }
    const newTickers = json.data.map(t => t.currency_pair.split('_')[0]);
    const prevData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const prevTickers = prevData.tickers || [];
    const fresh = newTickers.filter(t => !prevTickers.includes(t));
    if (fresh.length === 0) return;
    for (const ticker of fresh) {
      await attemptBuy(ticker);
    }
    const snapshot = {
      timestamp: new Date().toISOString(),
      tickers: newTickers
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(snapshot, null, 2));
  } catch (err) {
    logEvent('ERROR', `API_UNAVAILABLE ${err.message}`);
  }
}

async function attemptBuy(symbol) {
  const pairs = [`${symbol}_USDT`, `${symbol}_USDC`];
  const balances = await fetchBalances();
  const apiKey = process.env.GATE_API_KEY;
  const apiSecret = process.env.GATE_API_SECRET;
  if (!apiKey || !apiSecret) {
    logEvent('ERROR', 'Missing API credentials');
    return;
  }

  for (const pair of pairs) {
    const quote = pair.split('_')[1];
    const balance = balances[quote]?.available || 0;
    if (balance >= buyAmountUSDT) {
      try {
        const body = {
          currency_pair: pair,
          type: 'market',
          side: 'buy',
          account: 'spot',
          total: buyAmountUSDT.toString()
        };
        const jsonBody = JSON.stringify(body);
        const ts = Math.floor(Date.now() / 1000);
        const signPayload = `POST\n/api/v4/spot/orders\n${ts}\n${jsonBody}`;
        const signature = crypto.createHmac('sha512', apiSecret).update(signPayload).digest('hex');

        const response = await fetch(`${GATE_API}/spot/orders`, {
          method: 'POST',
          headers: {
            'KEY': apiKey,
            'Timestamp': ts,
            'SIGN': signature,
            'Content-Type': 'application/json'
          },
          body: jsonBody
        });

        const result = await response.json();
        if (result.id) {
          logEvent('BUY', `${symbol} | via ${quote} | total: ${buyAmountUSDT} | order_id: ${result.id}`);
        } else {
          logEvent('ERROR', `BUY_FAIL ${symbol}: ${JSON.stringify(result)}`);
        }
        return;
      } catch (e) {
        logEvent('ERROR', `BUY_EXCEPTION ${symbol}: ${e.message}`);
      }
    }
  }
  logEvent('SKIPPED', `${symbol} - No valid pair or insufficient balance`);
}

function logEvent(type, message) {
  const line = `[${new Date().toISOString()}] [${type}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, line);
}

async function fetchBalances() {
  const apiKey = process.env.GATE_API_KEY;
  const apiSecret = process.env.GATE_API_SECRET;
  const ts = Math.floor(Date.now() / 1000);
  const signPayload = `GET\n/api/v4/wallet/spot/accounts\n${ts}\n`;
  const signature = crypto.createHmac('sha512', apiSecret).update(signPayload).digest('hex');
  try {
    const res = await fetch(`${GATE_API}/wallet/spot/accounts`, {
      method: 'GET',
      headers: {
        'KEY': apiKey,
        'Timestamp': ts,
        'SIGN': signature
      }
    });
    const json = await res.json();
    if (!Array.isArray(json)) {
      logEvent('ERROR', `BALANCE_RESPONSE_INVALID: ${JSON.stringify(json)}`);
      return {};
    }
    const map = {};
    json.forEach(item => {
      map[item.currency] = {
        available: parseFloat(item.available),
        locked: parseFloat(item.locked)
      };
    });
    return map;
  } catch (err) {
    logEvent('ERROR', `FETCH_BALANCE_EXCEPTION: ${err.message}`);
    return {};
  }
}

function saveSellConfig(up, down, percent) {
  const config = { sellUp: up, sellDown: down, sellPercent: percent };
  fs.writeFileSync(SELL_CONFIG_PATH, JSON.stringify(config, null, 2));
  logEvent('SYSTEM', `SELL_RULES_UPDATED: ${JSON.stringify(config)}`);
}

function loadSellConfig() {
  if (fs.existsSync(SELL_CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(SELL_CONFIG_PATH, 'utf8'));
  } else {
    return { sellUp: 0, sellDown: 0, sellPercent: 100 };
  }
}
