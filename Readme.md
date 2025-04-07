```markdown
# Crypto Dashboard

Crypto Dashboard — это веб-интерфейс, показывающий актуальные цены криптовалют через API Crypto.com.

## Возможности:
- Подключение к публичному API Crypto.com
- Отображение цен: SOL, BTC, ETH
- Простая авторизация на стороне клиента (Tilda)

## Установка сервера (Node.js):
1. Установите Node.js v18+
2. Клонируйте проект: `git clone https://github.com/yourusername/crypto-dashboard.git`
3. Установите зависимости: `npm install`
4. Запустите сервер: `node index.js`

## Старт сервера
```bash
node server/index.js
```

Сервер будет доступен по адресу:
```
http://<ваш_ip>:3000/api/price?symbol=SOL_USDT
```
```

---