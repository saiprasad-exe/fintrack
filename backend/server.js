import express from "express";
import cors from "cors";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Yahoo Finance Backend Running");
});

app.get("/api/stock/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const quote = await yahooFinance.quote(symbol);

    console.log("===== Yahoo Quote =====");
    console.log(quote);

    res.json({
      success: true,
      symbol: quote.symbol,
      name: quote.longName || quote.shortName,
      price: quote.regularMarketPrice,
      currency: quote.currency,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});