import pool from "./db.js";
import xlsx from "xlsx";

const newSubData = {
  store_id: "18102055",
  days: 1,
  sum: 0,
  cellphone: "+7718358566",
};

const newSubDataPayoff = {
  store_id: "14916088",
  days: 3,
  sum: 0,
  cellphone: "+77764252244",
};

const newSubDataPapers = {
  store_id: "14916088",
  days: 3,
  sum: 0,
  cellphone: "+77764252244",
};

const giveSub = async (data) => {
  try {
    await pool.query(`INSERT INTO subs SET ?`, data);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS prices_${data.store_id}  LIKE prices`
    );
    console.log("Подписка успешно добавлена");
  } catch ({ message }) {
    console.log(message);
  }
};

const giveSubPayOff = async (data) => {
  try {
    await pool.query(`INSERT INTO subspayoff SET ?`, data);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS purchase_${data.store_id} LIKE prices`
    );
    console.log("Подписка успешно добавлена");
  } catch ({ message }) {
    console.log(message);
  }
};

const giveSubPapers = async (data) => {
  try {
    await pool.query(`INSERT INTO subspapers SET ?`, data);
    console.log("Подписка успешно добавлена");
  } catch ({ message }) {
    console.log(message);
  }
};

giveSub(newSubData);
// giveSubPayOff(newSubDataPayoff);
// giveSubPapers(newSubDataPapers);

const exportPrices = async () => {
  try {
    const workbook = xlsx.readFile("./prices.xlsx");
    const sheetNames = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNames[0]];
    const pricesFile = xlsx.utils.sheet_to_json(sheet);
    const prices = [];
    pricesFile.forEach((item) => {
      const values = {
        sku: item.Идентификатор,
        min_price: item.Минимальная,
        max_price: item.Максимальная,
        mock: item.Подстроить,
      };
      const isNull = Object.values(values).some((item) => !item);
      if (!isNull) {
        prices.push(values);
      }
    });
    console.log(pricesFile);
    const storeId = "1037010";
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
      // await pool.query(
      //   `UPDATE prices_${storeId} SET ? WHERE sku = ${editPrice.sku}`,
      //   editPrice
      // );
    }
    const values = newPrices.map((item) => [
      item.sku,
      item.min_price,
      item.max_price,
      item.mock,
    ]);
    if (values.length > 0) {
      // await pool.query(
      //   `INSERT INTO prices_${storeId} (sku, min_price, max_price, mock) VALUES ?`,
      //   [values]
      // );
    }
    console.log("Экспорт завершен!");
  } catch ({ message }) {
    console.log(message);
  }
};

// exportPrices();
