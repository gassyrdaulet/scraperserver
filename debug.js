import pool from "./db.js";

const newSubData = {
  store_id: "15503068",
  days: 360,
  sum: 0,
  cellphone: "+77088135765",
};

const giveSub = async (data) => {
  try {
    await pool.query(`INSERT INTO subs SET ?`, data);
    console.log("Подписка успешно добавлена");
  } catch ({ message }) {
    console.log(message);
  }
};

giveSub(newSubData);
