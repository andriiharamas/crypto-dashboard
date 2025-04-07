```javascript
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());

app.get("/api/price", async (req, res) => {
  const symbol = req.query.symbol || "SOL_USDT";
  try {
    const response = await axios.get(
      `https://api.crypto.com/v2/public/get-ticker?instrument_name=${symbol}`
    );
    const price = response.data.result.data.a;
    res.json({ symbol, price });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения цены" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
```

---