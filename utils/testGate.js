import { getAccountBalances, getTickers } from './gateApiClient.js';

try {
  const balances = await getAccountBalances();
  console.log('✔ Баланс:', balances);
} catch (err) {
  console.error('❌ Ошибка баланса:', err.message);
}

try {
  const tickers = await getTickers();
  console.log('✔ Тикеры:', tickers.length);
} catch (err) {
  console.error('❌ Ошибка тикеров:', err.message);
}
