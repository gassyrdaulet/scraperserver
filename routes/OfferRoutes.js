import { Router } from "express";
import pool from "../db.js";
import _ from "lodash";

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

router.get("/purchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const [prices] = await pool.query(`SELECT * FROM purchase_${store_id}`);
    res.send(prices);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/newpurchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const { price, name, sku } = req.body;
    await pool.query(`INSERT INTO purchase_${store_id} SET ?`, {
      price,
      name,
      sku,
    });
    res.status(200).json({ message: "Success" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/fillpurchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const { prices } = req.body;
    const [oldPrices] = await pool.query(`SELECT * FROM purchase_${store_id}`);
    const newPrices = [];
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
      } else {
        newPrices.push(price);
      }
    });
    for (let editPrice of editPrices) {
      await pool.query(
        `UPDATE purchase_${store_id} SET ? WHERE sku = ${editPrice.sku}`,
        editPrice
      );
    }
    const filteredNewPrices = _.uniqBy(newPrices, "sku");
    const values = filteredNewPrices.map((item) => [
      item.sku,
      item.image,
      item.name,
    ]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO purchase_${store_id} (sku, image, name) VALUES ?`,
        [values]
      );
    }
    res.status(200).json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/editpurchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const { price, name, sku } = req.body;
    await pool.query(`UPDATE purchase_${store_id} SET ? WHERE sku = ${sku}`, {
      price,
      name,
    });
    res.status(200).json({ message: "Success" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/deletepurchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const { sku } = req.body;
    await pool.query(`DELETE FROM purchase_${store_id} WHERE ?`, {
      sku,
    });
    res.status(200).json({ message: "Success" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/exportpurchase", async (req, res) => {
  try {
    const { store_id } = req.headers;
    const { prices } = req.body;
    const [oldPrices] = await pool.query(`SELECT * FROM purchase_${store_id}`);
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
        `UPDATE purchase_${store_id} SET ? WHERE sku = ${editPrice.sku}`,
        editPrice
      );
    }
    const values = newPrices.map((item) => [item.sku, item.name, item.price]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO purchase_${store_id} (sku, name, price) VALUES ?`,
        [values]
      );
    }
    res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
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

router.post("/editprice", async (req, res) => {
  try {
    const { store_id, price } = req.body;
    Object.keys(price).forEach((key) => {
      if (!price[key]) price[key] = null;
    });
    await pool.query(
      `UPDATE prices_${store_id} SET ? WHERE sku = ${price.sku}`,
      price
    );
    res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

router.post("/export", async (req, res) => {
  try {
    const { storeId, withEngKeys: prices } = req.body;
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
      item.preorder,
    ]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO prices_${storeId} (sku, min_price, max_price, mock, preorder) VALUES ?`,
        [values]
      );
    }
    res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

router.post("/import", async (req, res) => {
  try {
    const { storeId, prices: pricesPreorder } = req.body;
    const prices = pricesPreorder.map((item) => {
      const preorder = parseInt(item.preorder);
      delete item.preorder;
      return {
        ...item,
        preorder: isNaN(preorder) ? 0 : preorder,
      };
    });
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
        `UPDATE prices_${storeId} SET ? WHERE sku = "${editPrice.sku}"`,
        editPrice
      );
    }
    const values = newPrices.map((item) => [
      item.sku,
      item.min_price,
      item.max_price,
      item.mock,
      item.preorder,
    ]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO prices_${storeId} (sku, min_price, max_price, mock, preorder) VALUES ?`,
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
