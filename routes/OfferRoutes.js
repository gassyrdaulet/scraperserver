import { Router } from "express";
import pool from "../db.js";

const router = new Router();

router.get("/prices", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const [prices] = await pool.query(`SELECT * FROM prices_${store_id}`);
    res.send(prices);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { storeId, prices } = req.body;
    const [oldPrices] = await pool.query(`SELECT * FROM prices_${storeId}`);
    const newPrices = [];
    prices.forEach((price) => {
      const exists = oldPrices.find((oldPrice) => oldPrice.sku === price.sku);
      if (!exists) {
        newPrices.push(price);
      }
    });
    const values = newPrices.map((item) => [
      item.sku,
      item.min_price,
      item.max_price,
    ]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO prices_${storeId} (sku, min_price, max_price) VALUES ?`,
        [values]
      );
    }
    res.status(200).json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/edit", async (req, res) => {
  try {
    const { storeId, prices } = req.body;
    const [oldPrices] = await pool.query(`SELECT * FROM prices_${storeId}`);
    const editPrices = [];
    prices.forEach((price) => {
      const oldPrice = oldPrices.find((old) => old.sku === price.sku);
      if (oldPrice) {
        const isDifferent = Object.keys(price).some((key) => {
          if (key === "id") return false;
          if (!price[key] && !oldPrice[key]) {
            return false;
          }
          return price[key] !== oldPrice[key];
        });
        if (isDifferent) {
          editPrices.push(price);
        }
      }
    });
    for (let editPrice of editPrices) {
      await pool.query(
        `UPDATE prices_${storeId} SET ? WHERE sku = ${editPrice.sku}`,
        editPrice
      );
    }
    res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

router.post("/export", async (req, res) => {
  try {
    const { storeId, prices } = req.body;
    const [oldPrices] = await pool.query(`SELECT * FROM prices_${storeId}`);
    const editPrices = [];
    const newPrices = [];
    prices.forEach((price) => {
      const oldPrice = oldPrices.find((old) => old.sku === price.sku);
      if (oldPrice) {
        const isDifferent = Object.keys(price).some((key) => {
          if (key === "id") return false;
          if (!price[key] && !oldPrice[key]) {
            return false;
          }
          return price[key] !== oldPrice[key];
        });
        if (isDifferent) {
          editPrices.push(price);
        }
      } else {
        newPrices.push(price);
      }
    });
    for (let editPrice of editPrices) {
      await pool.query(
        `UPDATE prices_${storeId} SET ? WHERE sku = ${editPrice.sku}`,
        editPrice
      );
    }
    const values = newPrices.map((item) => [
      item.sku,
      item.min_price,
      item.max_price,
      item.mock,
    ]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO prices_${storeId} (sku, min_price, max_price, mock) VALUES ?`,
        [values]
      );
    }
    res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

export default router;
